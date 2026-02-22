import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Recognition,
  PointTransaction,
  PointTransactionEntry,
  PointBalance,
  MonthlyPointBudget,
  Organization,
  OrganizationMembership,
  TransactionType,
  AccountType,
} from '../../database/entities';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateKudosDto } from './dto/create-kudos.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities';
import {
  CacheEvents,
  KudosCreatedPayload,
} from '../../common/events/cache-events';

@Injectable()
export class KudosService {
  private readonly logger = new Logger(KudosService.name);

  constructor(
    @InjectRepository(Recognition)
    private readonly recognitionRepo: Repository<Recognition>,
    @InjectRepository(PointTransaction)
    private readonly pointTxRepo: Repository<PointTransaction>,
    @InjectRepository(PointTransactionEntry)
    private readonly pointEntryRepo: Repository<PointTransactionEntry>,
    @InjectRepository(PointBalance)
    private readonly pointBalanceRepo: Repository<PointBalance>,
    @InjectRepository(MonthlyPointBudget)
    private readonly monthlyBudgetRepo: Repository<MonthlyPointBudget>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createKudos(
    giverId: string,
    orgId: string,
    dto: CreateKudosDto,
  ): Promise<Recognition> {
    // 1. Validate self-recognition
    if (giverId === dto.receiverId) {
      throw new BadRequestException('Cannot give kudos to yourself.');
    }

    // 2. Validate receiver is in same org
    const receiverMembership = await this.membershipRepo.findOne({
      where: { orgId, userId: dto.receiverId, isActive: true },
    });
    if (!receiverMembership) {
      throw new ForbiddenException(
        'Recipient is not a member of your organization.',
      );
    }

    // 3. Get org settings for points range + monthly budget
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found.');

    const minPts =
      org.settings?.points?.minPerKudo ??
      this.configService.get<number>('points.minPoints', 1);
    const maxPts =
      org.settings?.points?.maxPerKudo ??
      this.configService.get<number>('points.maxPoints', 100);
    const defaultBudget =
      org.settings?.budget?.monthlyGivingBudget ??
      this.configService.get<number>('points.defaultMonthlyBudget', 1000);

    if (dto.points < minPts || dto.points > maxPts) {
      throw new BadRequestException(
        `Points must be between ${minPts} and ${maxPts}.`,
      );
    }

    // 4. Get or lazily initialize monthly budget for current month
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    let budget = await this.monthlyBudgetRepo
      .createQueryBuilder('b')
      .where('b.user_id = :userId', { userId: giverId })
      .andWhere('b.org_id = :orgId', { orgId })
      .andWhere('b.month = :month', { month: monthStr })
      .getOne();

    if (!budget) {
      // Lazy init — use ON CONFLICT DO NOTHING to handle concurrent requests
      await this.dataSource.query(
        `INSERT INTO monthly_point_budgets (id, org_id, user_id, month, total_budget, spent, version, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, 0, NOW(), NOW())
         ON CONFLICT (user_id, month) DO NOTHING`,
        [orgId, giverId, monthStr, defaultBudget],
      );

      budget = await this.monthlyBudgetRepo
        .createQueryBuilder('b')
        .where('b.user_id = :userId', { userId: giverId })
        .andWhere('b.org_id = :orgId', { orgId })
        .andWhere('b.month = :month', { month: monthStr })
        .getOne();
    }

    if (!budget) {
      throw new InternalServerErrorException(
        'Failed to initialize monthly budget.',
      );
    }

    // 5. Check sufficient giveable points
    if (budget.spent + dto.points > budget.totalBudget) {
      const remaining = budget.totalBudget - budget.spent;
      throw new BadRequestException(
        `Insufficient points. You have ${remaining} points left to give this month.`,
      );
    }

    // 6. All DB writes in atomic transaction
    const budgetVersion = budget.version;

    const result = await this.dataSource.transaction(async (manager) => {
      // 6a. Create recognition
      const recognition = await manager.save(
        manager.create(Recognition, {
          orgId,
          giverId,
          receiverId: dto.receiverId,
          points: dto.points,
          message: dto.message,
          valueId: dto.valueId,
        }),
      );

      // 6b. Create point_transaction (immutable header)
      const tx = await manager.save(
        manager.create(PointTransaction, {
          orgId,
          transactionType: TransactionType.RECOGNITION,
          referenceType: 'recognition',
          referenceId: recognition.id,
          createdBy: giverId,
        }),
      );

      // 6c. Create point_transaction_entries (double-entry bookkeeping, SUM = 0)
      await manager.save(PointTransactionEntry, [
        manager.create(PointTransactionEntry, {
          transactionId: tx.id,
          userId: giverId,
          accountType: AccountType.GIVEABLE,
          amount: -dto.points, // giver gives away points
        }),
        manager.create(PointTransactionEntry, {
          transactionId: tx.id,
          userId: dto.receiverId,
          accountType: AccountType.REDEEMABLE,
          amount: dto.points, // receiver earns points
        }),
      ]);

      // 6d. UPSERT point_balances for giver (giveable decrements)
      await manager.query(
        `INSERT INTO point_balances (user_id, balance_type, current_balance, version, updated_at)
         VALUES ($1, 'giveable', $2, 1, NOW())
         ON CONFLICT (user_id, balance_type)
         DO UPDATE SET current_balance = point_balances.current_balance - $3,
                       version = point_balances.version + 1,
                       updated_at = NOW()`,
        [giverId, defaultBudget - dto.points, dto.points],
      );

      // 6e. UPSERT point_balances for receiver (redeemable increments)
      await manager.query(
        `INSERT INTO point_balances (user_id, balance_type, current_balance, version, updated_at)
         VALUES ($1, 'redeemable', $2, 1, NOW())
         ON CONFLICT (user_id, balance_type)
         DO UPDATE SET current_balance = point_balances.current_balance + $2,
                       version = point_balances.version + 1,
                       updated_at = NOW()`,
        [dto.receiverId, dto.points],
      );

      // 6f. UPDATE monthly_point_budgets.spent with optimistic lock
      const updateResult: unknown[] = await manager.query(
        `UPDATE monthly_point_budgets
         SET spent = spent + $1, version = version + 1, updated_at = NOW()
         WHERE user_id = $2 AND org_id = $3 AND month = $4 AND version = $5
         RETURNING id`,
        [dto.points, giverId, orgId, monthStr, budgetVersion],
      );

      if (!updateResult || updateResult.length === 0) {
        throw new ConflictException(
          'Concurrent update detected. Please try again.',
        );
      }

      const rec = await manager.findOne(Recognition, {
        where: { id: recognition.id },
        relations: ['giver', 'receiver', 'coreValue'],
      });

      if (!rec) {
        throw new InternalServerErrorException(
          'Failed to retrieve recognition after creation.',
        );
      }

      this.logger.log(
        `Kudos created: ${giverId} → ${dto.receiverId} (${dto.points} pts) in org ${orgId}`,
      );

      return rec;
    });

    // 7. Invalidate caches
    this.eventEmitter.emit(CacheEvents.KUDOS_CREATED, {
      orgId,
      giverId,
      receiverId: dto.receiverId,
    } satisfies KudosCreatedPayload);

    // 8. Create notification for receiver (fire-and-forget, outside transaction)
    const giverName = result.giver?.fullName ?? 'Someone';
    this.notificationsService
      .create({
        orgId,
        userId: dto.receiverId,
        type: NotificationType.KUDOS_RECEIVED,
        title: `${giverName} gave you ${dto.points} points! 🎉`,
        body: dto.message,
        referenceType: 'recognition',
        referenceId: result.id,
      })
      .catch((err) =>
        this.logger.warn(`Failed to create notification: ${err.message}`),
      );

    return result;
  }
}

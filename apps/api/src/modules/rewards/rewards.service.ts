import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  Reward,
  RewardCategory,
  Redemption,
  RedemptionStatus,
  PointBalance,
  PointTransaction,
  PointTransactionEntry,
  BalanceType,
  TransactionType,
  AccountType,
  OrganizationMembership,
} from '../../database/entities';
import { RedeemRewardDto } from './dto/redeem-reward.dto';

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  category: RewardCategory;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  canAfford: boolean;
}

export interface RewardStats {
  availablePoints: number;
  totalEarned: number;
  rewardsRedeemed: number;
  pointsSpent: number;
  lastRedeemedAt: Date | null;
}

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(Redemption)
    private readonly redemptionRepo: Repository<Redemption>,
    @InjectRepository(PointBalance)
    private readonly pointBalanceRepo: Repository<PointBalance>,
    @InjectRepository(PointTransactionEntry)
    private readonly pointEntryRepo: Repository<PointTransactionEntry>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getRewards(
    orgId: string,
    userId: string,
    category?: string,
  ): Promise<RewardItem[]> {
    await this.ensureMembershipAccess(userId, orgId);

    const redeemableBalance = await this.getRedeemableBalance(userId);

    const qb = this.rewardRepo
      .createQueryBuilder('r')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.is_active = true')
      .andWhere('r.deleted_at IS NULL')
      .orderBy('r.points_cost', 'ASC');

    if (category && category !== 'all') {
      qb.andWhere('r.category = :category', { category });
    }

    const rewards = await qb.getMany();

    return rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      pointsCost: r.pointsCost,
      category: r.category,
      imageUrl: r.imageUrl ?? null,
      stock: r.stock,
      isActive: r.isActive,
      canAfford: redeemableBalance >= r.pointsCost,
    }));
  }

  async getStats(userId: string, orgId: string): Promise<RewardStats> {
    await this.ensureMembershipAccess(userId, orgId);

    const [redeemableBalance, redemptions] = await Promise.all([
      this.getRedeemableBalance(userId),
      this.redemptionRepo.find({
        where: { userId, orgId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const fulfilled = redemptions.filter(
      (r) => r.status === RedemptionStatus.FULFILLED,
    );
    const pointsSpent = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);

    const earned = await this.pointEntryRepo
      .createQueryBuilder('e')
      .innerJoin('point_transactions', 't', 't.id = e.transaction_id')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.account_type = :type', { type: AccountType.REDEEMABLE })
      .andWhere('e.amount > 0')
      .andWhere('t.org_id = :orgId', { orgId })
      .getRawOne<{ total: string }>();

    return {
      availablePoints: redeemableBalance,
      totalEarned: parseInt(earned?.total ?? '0', 10),
      rewardsRedeemed: fulfilled.length,
      pointsSpent,
      lastRedeemedAt: redemptions[0]?.createdAt ?? null,
    };
  }

  async redeemReward(
    userId: string,
    orgId: string,
    rewardId: string,
    dto: RedeemRewardDto,
  ): Promise<Redemption> {
    await this.ensureMembershipAccess(userId, orgId);

    const existing = await this.findExistingRedemptionByKey(
      userId,
      orgId,
      dto.idempotencyKey,
    );
    if (existing) return existing;

    const reward = await this.rewardRepo.findOne({
      where: { id: rewardId, orgId, isActive: true },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found or not active.');
    }

    if (reward.stock === 0) {
      throw new BadRequestException('This reward is out of stock.');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (reward.stock > 0) {
          const stockRows = await manager.query<{ id: string }[]>(
            `UPDATE rewards
             SET stock = stock - 1
             WHERE id = $1 AND stock > 0
             RETURNING id`,
            [rewardId],
          );

          if (!stockRows.length) {
            throw new ConflictException(
              'Reward just went out of stock. Please try again.',
            );
          }
        }

        const balanceRows = await manager.query<{ user_id: string }[]>(
          `UPDATE point_balances
           SET current_balance = current_balance - $1,
               version = version + 1,
               updated_at = NOW()
           WHERE user_id = $2
             AND balance_type = 'redeemable'
             AND current_balance >= $1
           RETURNING user_id`,
          [reward.pointsCost, userId],
        );

        if (!balanceRows.length) {
          throw new BadRequestException('Insufficient redeemable points.');
        }

        const tx = manager.create(PointTransaction, {
          orgId,
          transactionType: TransactionType.REDEMPTION,
          referenceType: 'redemption',
          referenceId: rewardId,
          createdBy: userId,
        });
        const savedTx = await manager.save(tx);

        await manager.save(PointTransactionEntry, [
          manager.create(PointTransactionEntry, {
            transactionId: savedTx.id,
            userId,
            accountType: AccountType.REDEEMABLE,
            amount: -reward.pointsCost,
          }),
          manager.create(PointTransactionEntry, {
            transactionId: savedTx.id,
            accountType: AccountType.SYSTEM_LIABILITY,
            amount: +reward.pointsCost,
          }),
        ]);

        const redemption = manager.create(Redemption, {
          orgId,
          rewardId,
          userId,
          pointsSpent: reward.pointsCost,
          idempotencyKey: dto.idempotencyKey,
          status: RedemptionStatus.PENDING,
        });
        const saved = await manager.save(redemption);

        this.logger.log(
          `User ${userId} redeemed reward ${rewardId} for ${reward.pointsCost} pts`,
        );

        const hydrated = await manager.findOne(Redemption, {
          where: { id: saved.id },
          relations: ['reward'],
        });

        if (!hydrated) {
          throw new ConflictException(
            'Redemption created but could not be loaded.',
          );
        }

        return hydrated;
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const duplicate = await this.findExistingRedemptionByKey(
          userId,
          orgId,
          dto.idempotencyKey,
        );
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }

  private async ensureMembershipAccess(
    userId: string,
    orgId: string,
  ): Promise<void> {
    if (!orgId) {
      throw new ForbiddenException('Organization context required.');
    }

    const membership = await this.membershipRepo.findOne({
      where: { userId, orgId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization.',
      );
    }
  }

  private async findExistingRedemptionByKey(
    userId: string,
    orgId: string,
    idempotencyKey: string,
  ): Promise<Redemption | null> {
    return this.redemptionRepo.findOne({
      where: { idempotencyKey, userId, orgId },
      relations: ['reward'],
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === '23505';
  }

  private async getRedeemableBalance(userId: string): Promise<number> {
    const balance = await this.pointBalanceRepo.findOne({
      where: { userId, balanceType: BalanceType.REDEEMABLE },
    });
    return balance?.currentBalance ?? 0;
  }
}

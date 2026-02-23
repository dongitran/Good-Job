import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  OrganizationMembership,
  PointBalance,
  Recognition,
  Redemption,
  Department,
  BalanceType,
  UserRole,
} from '../../database/entities';
import { UpdateMeDto } from './dto/update-me.dto';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../../common/cache';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  departmentName: string | null;
  giveableBalance: number;
  redeemableBalance: number;
  stats: {
    kudosReceived: number;
    kudosGiven: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
  };
  kudosReceived: KudosItem[];
  kudosGiven: KudosItem[];
  redemptions: RedemptionItem[];
}

export interface KudosItem {
  id: string;
  points: number;
  message: string;
  valueName: string;
  valueEmoji: string;
  giverName: string;
  giverAvatarUrl: string | null;
  receiverName: string;
  receiverAvatarUrl: string | null;
  createdAt: Date;
}

export interface RedemptionItem {
  id: string;
  rewardName: string;
  rewardImageUrl: string | null;
  pointsSpent: number;
  status: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(PointBalance)
    private readonly pointBalanceRepo: Repository<PointBalance>,
    @InjectRepository(Recognition)
    private readonly recognitionRepo: Repository<Recognition>,
    @InjectRepository(Redemption)
    private readonly redemptionRepo: Repository<Redemption>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly cache: CacheService,
  ) {}

  async getMe(userId: string): Promise<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  async updateMe(
    userId: string,
    dto: UpdateMeDto,
  ): Promise<{
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    user.fullName = dto.fullName.trim();
    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      avatarUrl: saved.avatarUrl ?? null,
    };
  }

  async getProfile(
    requestingUserId: string,
    requestingUserRole: UserRole,
    targetUserId: string,
    orgId: string,
  ): Promise<UserProfile> {
    if (
      requestingUserId !== targetUserId &&
      requestingUserRole !== UserRole.ADMIN &&
      requestingUserRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this profile.',
      );
    }

    return this.cache.getOrSet(
      CACHE_KEYS.userProfile(targetUserId, orgId),
      CACHE_TTL.USER_PROFILE,
      () => this.computeProfile(targetUserId, orgId),
    );
  }

  private async computeProfile(
    userId: string,
    orgId: string,
  ): Promise<UserProfile> {
    const [user, membership, balances] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.membershipRepo.findOne({
        where: { userId, orgId, isActive: true },
      }),
      this.pointBalanceRepo.find({ where: { userId } }),
    ]);

    if (!user) throw new NotFoundException('User not found.');
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization.',
      );
    }

    let departmentName: string | null = null;
    if (membership?.departmentId) {
      const dept = await this.departmentRepo.findOne({
        where: { id: membership.departmentId },
      });
      departmentName = dept?.name ?? null;
    }

    const giveable = balances.find(
      (b) => b.balanceType === BalanceType.GIVEABLE,
    );
    const redeemable = balances.find(
      (b) => b.balanceType === BalanceType.REDEEMABLE,
    );

    const [kudosReceived, kudosGiven, redemptions, earnedAgg, spentAgg] =
      await Promise.all([
        this.recognitionRepo.find({
          where: { receiverId: userId, orgId },
          relations: ['giver', 'coreValue'],
          order: { createdAt: 'DESC' },
          take: 20,
        }),
        this.recognitionRepo.find({
          where: { giverId: userId, orgId },
          relations: ['receiver', 'coreValue'],
          order: { createdAt: 'DESC' },
          take: 20,
        }),
        this.redemptionRepo.find({
          where: { userId, orgId },
          relations: ['reward'],
          order: { createdAt: 'DESC' },
          take: 20,
        }),
        // Aggregate queries for accurate lifetime totals (not limited to last 20)
        this.recognitionRepo
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.points), 0)', 'total')
          .where('r.receiver_id = :userId', { userId })
          .andWhere('r.org_id = :orgId', { orgId })
          .getRawOne<{ total: string }>(),
        this.redemptionRepo
          .createQueryBuilder('rd')
          .select('COALESCE(SUM(rd.points_spent), 0)', 'total')
          .where('rd.user_id = :userId', { userId })
          .andWhere('rd.org_id = :orgId', { orgId })
          .getRawOne<{ total: string }>(),
      ]);

    const totalPointsEarned = parseInt(earnedAgg?.total ?? '0', 10);
    const totalPointsSpent = parseInt(spentAgg?.total ?? '0', 10);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      role: membership.role,
      departmentName,
      giveableBalance: giveable?.currentBalance ?? 0,
      redeemableBalance: redeemable?.currentBalance ?? 0,
      stats: {
        kudosReceived: kudosReceived.length,
        kudosGiven: kudosGiven.length,
        totalPointsEarned,
        totalPointsSpent,
      },
      kudosReceived: kudosReceived.map((r) => ({
        id: r.id,
        points: r.points,
        message: r.message,
        valueName: r.coreValue?.name ?? '',
        valueEmoji: r.coreValue?.emoji ?? '',
        giverName: r.giver?.fullName ?? '',
        giverAvatarUrl: r.giver?.avatarUrl ?? null,
        receiverName: user.fullName,
        receiverAvatarUrl: user.avatarUrl ?? null,
        createdAt: r.createdAt,
      })),
      kudosGiven: kudosGiven.map((r) => ({
        id: r.id,
        points: r.points,
        message: r.message,
        valueName: r.coreValue?.name ?? '',
        valueEmoji: r.coreValue?.emoji ?? '',
        giverName: user.fullName,
        giverAvatarUrl: user.avatarUrl ?? null,
        receiverName: r.receiver?.fullName ?? '',
        receiverAvatarUrl: r.receiver?.avatarUrl ?? null,
        createdAt: r.createdAt,
      })),
      redemptions: redemptions.map((r) => ({
        id: r.id,
        rewardName: r.reward?.name ?? '',
        rewardImageUrl: r.reward?.imageUrl ?? null,
        pointsSpent: r.pointsSpent,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }
}

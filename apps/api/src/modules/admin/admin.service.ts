import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Recognition,
  OrganizationMembership,
  CoreValue,
  User,
  UserRole,
  Redemption,
  RedemptionStatus,
  Reward,
} from '../../database/entities';

export interface AdminAnalytics {
  stats: {
    totalRecognitions: number;
    activeUsers: number;
    totalPointsGiven: number;
    participationRate: number;
  };
  recognitionTrend: { date: string; count: number; points: number }[];
  valueDistribution: {
    name: string;
    emoji: string;
    count: number;
    color: string;
  }[];
  topGivers: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    count: number;
    points: number;
  }[];
  topReceivers: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    count: number;
    points: number;
  }[];
  recentActivity: {
    id: string;
    giverName: string;
    receiverName: string;
    points: number;
    message: string;
    valueName: string;
    valueEmoji: string;
    createdAt: Date;
  }[];
  departmentBreakdown: { name: string; count: number; points: number }[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Recognition)
    private readonly recognitionRepo: Repository<Recognition>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(CoreValue)
    private readonly coreValueRepo: Repository<CoreValue>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Redemption)
    private readonly redemptionRepo: Repository<Redemption>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
  ) {}

  async verifyAdminAccess(userId: string, orgId: string): Promise<void> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, orgId, isActive: true },
    });
    if (
      !membership ||
      (membership.role !== UserRole.ADMIN && membership.role !== UserRole.OWNER)
    ) {
      throw new ForbiddenException('Admin access required.');
    }
  }

  async getAdminUsers(orgId: string) {
    const memberships = await this.membershipRepo.find({
      where: { orgId, isActive: true },
      relations: ['user', 'department'],
      order: { createdAt: 'ASC' },
    });

    const userIds = memberships.map((m) => m.userId).filter(Boolean);
    if (!userIds.length) return [];

    const [kudosReceived, kudosGiven] = await Promise.all([
      this.recognitionRepo
        .createQueryBuilder('r')
        .select('r.receiver_id', 'userId')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(r.points), 0)', 'points')
        .where('r.org_id = :orgId', { orgId })
        .groupBy('r.receiver_id')
        .getRawMany<{ userId: string; count: string; points: string }>(),
      this.recognitionRepo
        .createQueryBuilder('r')
        .select('r.giver_id', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('r.org_id = :orgId', { orgId })
        .groupBy('r.giver_id')
        .getRawMany<{ userId: string; count: string }>(),
    ]);

    const receivedMap = new Map(
      kudosReceived.map((r) => [
        r.userId,
        { count: parseInt(r.count, 10), points: parseInt(r.points, 10) },
      ]),
    );
    const givenMap = new Map(
      kudosGiven.map((r) => [r.userId, parseInt(r.count, 10)]),
    );

    return memberships.map((m) => ({
      id: m.user?.id ?? m.userId,
      fullName: m.user?.fullName ?? '',
      email: m.user?.email ?? '',
      avatarUrl: m.user?.avatarUrl ?? null,
      role: m.role,
      departmentName: m.department?.name ?? null,
      joinedAt: m.createdAt,
      kudosReceived: receivedMap.get(m.userId)?.count ?? 0,
      kudosGiven: givenMap.get(m.userId) ?? 0,
      pointsEarned: receivedMap.get(m.userId)?.points ?? 0,
    }));
  }

  async getRedemptions(orgId: string, status?: string, search?: string) {
    const qb = this.redemptionRepo
      .createQueryBuilder('rd')
      .leftJoinAndSelect('rd.user', 'u')
      .leftJoinAndSelect('rd.reward', 'r')
      .where('rd.org_id = :orgId', { orgId })
      .orderBy('rd.created_at', 'DESC');

    if (status && status !== 'all') {
      qb.andWhere('rd.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        `(LOWER(u.full_name) LIKE :search OR LOWER(r.name) LIKE :search)`,
        { search: `%${search.toLowerCase()}%` },
      );
    }

    const redemptions = await qb.getMany();

    return redemptions.map((rd) => ({
      id: rd.id,
      userId: rd.userId,
      userName: rd.user?.fullName ?? '',
      userEmail: rd.user?.email ?? '',
      rewardId: rd.rewardId,
      rewardName: rd.reward?.name ?? '',
      rewardCategory: rd.reward?.category ?? '',
      pointsSpent: rd.pointsSpent,
      status: rd.status,
      fulfilledAt: rd.fulfilledAt ?? null,
      createdAt: rd.createdAt,
    }));
  }

  async updateRedemptionStatus(
    orgId: string,
    redemptionId: string,
    status: RedemptionStatus,
  ) {
    const redemption = await this.redemptionRepo.findOne({
      where: { id: redemptionId, orgId },
    });

    if (!redemption) throw new NotFoundException('Redemption not found.');

    const allowed: Record<RedemptionStatus, RedemptionStatus[]> = {
      [RedemptionStatus.PENDING]: [
        RedemptionStatus.APPROVED,
        RedemptionStatus.REJECTED,
      ],
      [RedemptionStatus.APPROVED]: [
        RedemptionStatus.FULFILLED,
        RedemptionStatus.REJECTED,
      ],
      [RedemptionStatus.FULFILLED]: [],
      [RedemptionStatus.REJECTED]: [],
    };

    if (!allowed[redemption.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${redemption.status} to ${status}.`,
      );
    }

    redemption.status = status;
    if (status === RedemptionStatus.FULFILLED) {
      redemption.fulfilledAt = new Date();
    }

    return this.redemptionRepo.save(redemption);
  }

  async getAnalytics(orgId: string, days = 30): Promise<AdminAnalytics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      stats,
      trend,
      valueDistrib,
      topGivers,
      topReceivers,
      recent,
      deptBreakdown,
    ] = await Promise.all([
      this.getStats(orgId, since),
      this.getRecognitionTrend(orgId, since, days),
      this.getValueDistribution(orgId, since),
      this.getTopUsers(orgId, since, 'giver'),
      this.getTopUsers(orgId, since, 'receiver'),
      this.getRecentActivity(orgId, 10),
      this.getDepartmentBreakdown(orgId, since),
    ]);

    return {
      stats,
      recognitionTrend: trend,
      valueDistribution: valueDistrib,
      topGivers,
      topReceivers,
      recentActivity: recent,
      departmentBreakdown: deptBreakdown,
    };
  }

  private async getStats(orgId: string, since: Date) {
    const [totalRecognitions, totalPointsRaw, activeUsersRaw, totalMembersRaw] =
      await Promise.all([
        this.recognitionRepo.count({ where: { orgId } }),
        this.recognitionRepo
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.points), 0)', 'total')
          .where('r.org_id = :orgId', { orgId })
          .andWhere('r.created_at >= :since', { since })
          .getRawOne<{ total: string }>(),
        this.recognitionRepo
          .createQueryBuilder('r')
          .select('COUNT(DISTINCT r.giver_id)', 'count')
          .where('r.org_id = :orgId', { orgId })
          .andWhere('r.created_at >= :since', { since })
          .getRawOne<{ count: string }>(),
        this.membershipRepo.count({ where: { orgId, isActive: true } }),
      ]);

    const activeUsers = parseInt(activeUsersRaw?.count ?? '0', 10);
    const participationRate =
      totalMembersRaw > 0
        ? Math.round((activeUsers / totalMembersRaw) * 100)
        : 0;

    return {
      totalRecognitions,
      activeUsers,
      totalPointsGiven: parseInt(totalPointsRaw?.total ?? '0', 10),
      participationRate,
    };
  }

  private async getRecognitionTrend(orgId: string, since: Date, days: number) {
    const rows = await this.recognitionRepo
      .createQueryBuilder('r')
      .select(`DATE_TRUNC('day', r.created_at)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(r.points), 0)', 'points')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.created_at >= :since', { since })
      .groupBy(`DATE_TRUNC('day', r.created_at)`)
      .orderBy(`DATE_TRUNC('day', r.created_at)`, 'ASC')
      .getRawMany<{ date: Date; count: string; points: string }>();

    const map = new Map(
      rows.map((r) => [r.date.toISOString().split('T')[0], r]),
    );

    const trend: { date: string; count: number; points: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const row = map.get(key);
      trend.push({
        date: key,
        count: row ? parseInt(row.count, 10) : 0,
        points: row ? parseInt(row.points, 10) : 0,
      });
    }
    return trend;
  }

  private async getValueDistribution(orgId: string, since: Date) {
    const rows = await this.recognitionRepo
      .createQueryBuilder('r')
      .select('r.value_id', 'valueId')
      .addSelect('COUNT(*)', 'count')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.created_at >= :since', { since })
      .groupBy('r.value_id')
      .orderBy('count', 'DESC')
      .getRawMany<{ valueId: string; count: string }>();

    const values = await this.coreValueRepo.find({
      where: { orgId, isActive: true },
    });
    const valueMap = new Map(values.map((v) => [v.id, v]));

    return rows
      .filter((r) => valueMap.has(r.valueId))
      .map((r) => {
        const v = valueMap.get(r.valueId)!;
        return {
          name: v.name,
          emoji: v.emoji,
          count: parseInt(r.count, 10),
          color: v.color ?? '#7c3aed',
        };
      });
  }

  private async getTopUsers(
    orgId: string,
    since: Date,
    role: 'giver' | 'receiver',
  ) {
    const col = role === 'giver' ? 'r.giver_id' : 'r.receiver_id';
    const rows = await this.recognitionRepo
      .createQueryBuilder('r')
      .select(col, 'userId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(r.points), 0)', 'points')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.created_at >= :since', { since })
      .groupBy(col)
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ userId: string; count: string; points: string }>();

    const userIds = rows.map((r) => r.userId);
    if (!userIds.length) return [];

    const users = await this.userRepo
      .createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids: userIds })
      .getMany();

    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows
      .filter((r) => userMap.has(r.userId))
      .map((r) => {
        const u = userMap.get(r.userId)!;
        return {
          id: u.id,
          fullName: u.fullName,
          avatarUrl: u.avatarUrl ?? null,
          count: parseInt(r.count, 10),
          points: parseInt(r.points, 10),
        };
      });
  }

  private async getRecentActivity(orgId: string, limit: number) {
    const items = await this.recognitionRepo.find({
      where: { orgId, isPrivate: false },
      relations: ['giver', 'receiver', 'coreValue'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return items.map((r) => ({
      id: r.id,
      giverName: r.giver?.fullName ?? '',
      receiverName: r.receiver?.fullName ?? '',
      points: r.points,
      message: r.message,
      valueName: r.coreValue?.name ?? '',
      valueEmoji: r.coreValue?.emoji ?? '',
      createdAt: r.createdAt,
    }));
  }

  private async getDepartmentBreakdown(orgId: string, since: Date) {
    const rows = await this.recognitionRepo
      .createQueryBuilder('r')
      .innerJoin(
        'organization_memberships',
        'm',
        'm.user_id = r.receiver_id AND m.org_id = r.org_id',
      )
      .innerJoin('departments', 'd', 'd.id = m.department_id')
      .select('d.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(r.points), 0)', 'points')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.created_at >= :since', { since })
      .groupBy('d.name')
      .orderBy('count', 'DESC')
      .getRawMany<{ name: string; count: string; points: string }>();

    return rows.map((r) => ({
      name: r.name,
      count: parseInt(r.count, 10),
      points: parseInt(r.points, 10),
    }));
  }
}

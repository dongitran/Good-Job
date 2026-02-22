import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PointBalance,
  Organization,
  BalanceType,
} from '../../database/entities';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../../common/cache';

export interface BalanceResponse {
  giveableBalance: number;
  redeemableBalance: number;
}

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointBalance)
    private readonly pointBalanceRepo: Repository<PointBalance>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
  ) {}

  async getBalance(userId: string, orgId: string): Promise<BalanceResponse> {
    return this.cache.getOrSet(
      CACHE_KEYS.pointsBalance(userId, orgId),
      CACHE_TTL.POINTS_BALANCE,
      () => this.computeBalance(userId, orgId),
    );
  }

  private async computeBalance(
    userId: string,
    orgId: string,
  ): Promise<BalanceResponse> {
    const [balances, org] = await Promise.all([
      this.pointBalanceRepo.find({ where: { userId } }),
      this.orgRepo.findOne({
        where: { id: orgId },
        select: ['id', 'settings'],
      }),
    ]);

    const giveable = balances.find(
      (b) => b.balanceType === BalanceType.GIVEABLE,
    );
    const redeemable = balances.find(
      (b) => b.balanceType === BalanceType.REDEEMABLE,
    );

    let giveableBalance: number;
    if (giveable) {
      giveableBalance = giveable.currentBalance;
    } else {
      // No kudos given yet — return full monthly budget as available balance
      const defaultBudget =
        org?.settings?.budget?.monthlyGivingBudget ??
        this.configService.get<number>('points.defaultMonthlyBudget', 1000);
      giveableBalance = defaultBudget;
    }

    return {
      giveableBalance,
      redeemableBalance: redeemable?.currentBalance ?? 0,
    };
  }
}

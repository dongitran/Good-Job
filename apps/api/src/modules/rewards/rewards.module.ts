import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import {
  Reward,
  Redemption,
  PointBalance,
  PointTransaction,
  PointTransactionEntry,
  OrganizationMembership,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reward,
      Redemption,
      PointBalance,
      PointTransaction,
      PointTransactionEntry,
      OrganizationMembership,
    ]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}

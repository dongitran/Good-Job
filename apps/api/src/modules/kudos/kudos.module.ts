import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KudosController } from './kudos.controller';
import { KudosService } from './kudos.service';
import {
  Recognition,
  PointTransaction,
  PointTransactionEntry,
  PointBalance,
  MonthlyPointBudget,
  Organization,
  OrganizationMembership,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recognition,
      PointTransaction,
      PointTransactionEntry,
      PointBalance,
      MonthlyPointBudget,
      Organization,
      OrganizationMembership,
    ]),
  ],
  controllers: [KudosController],
  providers: [KudosService],
})
export class KudosModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KudosController } from './kudos.controller';
import { KudosService } from './kudos.service';
import { NotificationsModule } from '../notifications/notifications.module';
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
    NotificationsModule,
  ],
  controllers: [KudosController],
  providers: [KudosService],
})
export class KudosModule {}

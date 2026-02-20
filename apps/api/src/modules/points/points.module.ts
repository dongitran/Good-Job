import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import {
  PointBalance,
  MonthlyPointBudget,
  Organization,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointBalance, MonthlyPointBudget, Organization]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  Recognition,
  OrganizationMembership,
  CoreValue,
  User,
  Redemption,
  Reward,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recognition,
      OrganizationMembership,
      CoreValue,
      User,
      Redemption,
      Reward,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

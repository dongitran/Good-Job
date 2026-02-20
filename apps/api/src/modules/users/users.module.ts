import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  User,
  OrganizationMembership,
  PointBalance,
  Recognition,
  Redemption,
  Department,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      OrganizationMembership,
      PointBalance,
      Recognition,
      Redemption,
      Department,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

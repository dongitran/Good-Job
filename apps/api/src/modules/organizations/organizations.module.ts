import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import {
  Organization,
  CoreValue,
  Invitation,
  OrganizationMembership,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      CoreValue,
      Invitation,
      OrganizationMembership,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

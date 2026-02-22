import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import {
  Organization,
  CoreValue,
  Invitation,
  OrganizationMembership,
  User,
  Reward,
} from '../../database/entities';
import { AuthEmailService } from '../auth/auth-email.service';
import { OrganizationLogoStorageService } from './organization-logo-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      CoreValue,
      Invitation,
      OrganizationMembership,
      User,
      Reward,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    AuthEmailService,
    OrganizationLogoStorageService,
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

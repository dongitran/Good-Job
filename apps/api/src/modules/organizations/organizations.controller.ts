import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateCoreValuesDto } from './dto/create-core-values.dto';
import { CreateInvitationsDto } from './dto/create-invitations.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id')
  getOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.getOrganization(id, user.sub);
  }

  @Get(':id/members')
  getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
  ) {
    return this.organizationsService.getMembers(id, user.sub, q);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  updateOrganization(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.updateOrganization(id, user.sub, dto);
  }

  @Post(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadOrganizationLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required.');
    }
    return this.organizationsService.uploadOrganizationLogo(id, user.sub, file);
  }

  @Post(':id/core-values')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  setCoreValues(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCoreValuesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.setCoreValues(id, user.sub, dto);
  }

  @Get(':id/invitations')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getPendingInvitations(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.getPendingInvitations(id, user.sub);
  }

  @Post(':id/invitations')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  sendInvitations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInvitationsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.sendInvitations(id, user.sub, dto);
  }

  @Delete(':id/invitations/:invId')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  revokeInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invId', ParseUUIDPipe) invId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.revokeInvitation(id, user.sub, invId);
  }

  @Post(':id/complete-onboarding')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  completeOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteOnboardingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.completeOnboarding(id, user.sub, dto);
  }
}

import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
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
  getOrganization(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.getOrganization(id, user.sub);
  }

  @Patch(':id')
  updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.updateOrganization(id, user.sub, dto);
  }

  @Post(':id/core-values')
  setCoreValues(
    @Param('id') id: string,
    @Body() dto: CreateCoreValuesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.setCoreValues(id, user.sub, dto);
  }

  @Post(':id/invitations')
  sendInvitations(
    @Param('id') id: string,
    @Body() dto: CreateInvitationsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.sendInvitations(id, user.sub, dto);
  }

  @Post(':id/complete-onboarding')
  completeOnboarding(
    @Param('id') id: string,
    @Body() dto: CompleteOnboardingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationsService.completeOnboarding(id, user.sub, dto);
  }
}

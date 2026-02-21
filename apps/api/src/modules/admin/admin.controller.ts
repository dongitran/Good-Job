import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, RedemptionStatus } from '../../database/entities';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireOrg } from '../../common/decorators/require-org.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { UpdateRedemptionStatusDto } from './dto/update-redemption-status.dto';

@Controller('admin')
@RequireOrg()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  healthCheck() {
    return { status: 'ok', scope: 'admin' };
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetAnalyticsQueryDto,
  ) {
    await this.adminService.verifyAdminAccess(user.sub, user.orgId!);
    return this.adminService.getAnalytics(user.orgId!, query.days ?? 30);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getUsers(@CurrentUser() user: JwtPayload) {
    await this.adminService.verifyAdminAccess(user.sub, user.orgId!);
    return this.adminService.getAdminUsers(user.orgId!);
  }

  @Get('redemptions')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getRedemptions(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    await this.adminService.verifyAdminAccess(user.sub, user.orgId!);
    return this.adminService.getRedemptions(user.orgId!, status, search);
  }

  @Patch('redemptions/:id/status')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async updateRedemptionStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) redemptionId: string,
    @Body() dto: UpdateRedemptionStatusDto,
  ) {
    await this.adminService.verifyAdminAccess(user.sub, user.orgId!);
    return this.adminService.updateRedemptionStatus(
      user.orgId!,
      redemptionId,
      dto.status as RedemptionStatus,
      user.sub,
    );
  }
}

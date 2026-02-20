import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  healthCheck() {
    return {
      status: 'ok',
      scope: 'admin',
    };
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetAnalyticsQueryDto,
  ) {
    await this.adminService.verifyAdminAccess(user.sub, user.orgId ?? '');
    return this.adminService.getAnalytics(user.orgId ?? '', query.days ?? 30);
  }
}

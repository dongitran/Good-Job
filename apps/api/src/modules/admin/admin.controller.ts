import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities';

@Controller('admin')
export class AdminController {
  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  healthCheck() {
    return {
      status: 'ok',
      scope: 'admin',
    };
  }
}

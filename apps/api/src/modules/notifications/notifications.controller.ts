import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.list(user.sub, page, Math.min(limit, 50));
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.service.getUnreadCount(user.sub);
    return { count };
  }

  // ⚠️ Static route MUST come before parameterized route to avoid NestJS matching 'read-all' as :id
  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.markRead(user.sub, id);
  }
}

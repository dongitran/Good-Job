import { Controller, Get, Query } from '@nestjs/common';
import { FeedService } from './feed.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('valueId') valueId?: string,
  ) {
    const orgId = user.orgId ?? '';
    return this.feedService.getFeed(
      orgId,
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(50, Math.max(1, parseInt(limit, 10) || 20)),
      valueId,
    );
  }
}

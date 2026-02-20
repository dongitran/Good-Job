import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  getBalance(@CurrentUser() user: JwtPayload) {
    return this.pointsService.getBalance(user.sub, user.orgId ?? '');
  }
}

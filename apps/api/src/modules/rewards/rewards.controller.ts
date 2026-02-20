import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  getRewards(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
  ) {
    return this.rewardsService.getRewards(user.orgId ?? '', user.sub, category);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getStats(user.sub, user.orgId ?? '');
  }

  @Post(':id/redeem')
  @HttpCode(201)
  redeemReward(
    @CurrentUser() user: JwtPayload,
    @Param('id') rewardId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeemReward(
      user.sub,
      user.orgId ?? '',
      rewardId,
      dto,
    );
  }
}

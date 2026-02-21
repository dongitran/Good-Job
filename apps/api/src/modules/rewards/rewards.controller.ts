import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RestockRewardDto } from './dto/restock-reward.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireOrg } from '../../common/decorators/require-org.decorator';
import { UserRole } from '../../database/entities';

@Controller('rewards')
@RequireOrg()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ─── User endpoints ───────────────────────────────────────────────────────────

  @Get()
  getRewards(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
  ) {
    return this.rewardsService.getRewards(user.orgId!, user.sub, category);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getStats(user.sub, user.orgId!);
  }

  @Post(':id/redeem')
  @HttpCode(201)
  redeemReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeemReward(
      user.sub,
      user.orgId!,
      rewardId,
      dto,
    );
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────────

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getAdminRewards(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('search') search?: string,
  ) {
    return this.rewardsService.getAdminRewards(
      user.orgId!,
      user.sub,
      category,
      status,
      search,
    );
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getAdminStats(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.getAdminStats(user.orgId!, user.sub);
  }

  @Post('admin')
  @HttpCode(201)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  createReward(@CurrentUser() user: JwtPayload, @Body() dto: CreateRewardDto) {
    return this.rewardsService.createReward(user.orgId!, user.sub, dto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  updateReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(
      user.orgId!,
      user.sub,
      rewardId,
      dto,
    );
  }

  @Post('admin/:id/disable')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  disableReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
  ) {
    return this.rewardsService.disableReward(user.orgId!, user.sub, rewardId);
  }

  @Post('admin/:id/enable')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  enableReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
  ) {
    return this.rewardsService.enableReward(user.orgId!, user.sub, rewardId);
  }

  @Post('admin/:id/restock')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  restockReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
    @Body() dto: RestockRewardDto,
  ) {
    return this.rewardsService.restockReward(
      user.orgId!,
      user.sub,
      rewardId,
      dto,
    );
  }

  @Delete('admin/:id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteReward(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) rewardId: string,
  ) {
    await this.rewardsService.deleteReward(user.orgId!, user.sub, rewardId);
  }
}

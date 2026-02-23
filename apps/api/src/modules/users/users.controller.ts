import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireOrg } from '../../common/decorators/require-org.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get('profile')
  @RequireOrg()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(
      user.sub,
      user.role,
      user.sub,
      user.orgId!,
    );
  }

  @Get('profile/:userId')
  @RequireOrg()
  getMemberProfile(
    @CurrentUser() user: JwtPayload,
    @Param('userId') targetUserId: string,
  ) {
    return this.usersService.getProfile(
      user.sub,
      user.role,
      targetUserId,
      user.orgId!,
    );
  }
}

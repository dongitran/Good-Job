import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly service: UserPreferencesService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.service.get(user.sub);
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePreferencesDto) {
    return this.service.update(user.sub, dto);
  }
}

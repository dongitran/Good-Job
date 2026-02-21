import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { KudosService } from './kudos.service';
import { CreateKudosDto } from './dto/create-kudos.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireOrg } from '../../common/decorators/require-org.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('kudos')
@RequireOrg()
export class KudosController {
  constructor(private readonly kudosService: KudosService) {}

  @Post()
  @HttpCode(201)
  createKudos(@CurrentUser() user: JwtPayload, @Body() dto: CreateKudosDto) {
    return this.kudosService.createKudos(user.sub, user.orgId!, dto);
  }
}

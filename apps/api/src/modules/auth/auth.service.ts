import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { StringValue } from 'ms';
import { RequestTokenDto } from './dto/request-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueAccessToken(input: RequestTokenDto) {
    const payload: JwtPayload = {
      sub: randomUUID(),
      email: input.email,
      role: input.role,
      orgId: input.orgId,
    };

    const expiresIn = (this.configService.get<string>('jwt.accessExpiry') ??
      '15m') as StringValue;
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }
}

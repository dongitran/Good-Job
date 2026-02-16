import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { StringValue } from 'ms';
import { RequestTokenDto } from './dto/request-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '../../database/entities';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private resolveRoleByEmail(email: string): UserRole {
    if (email.startsWith('owner@')) {
      return UserRole.OWNER;
    }

    if (email.startsWith('admin@')) {
      return UserRole.ADMIN;
    }

    return UserRole.MEMBER;
  }

  async issueAccessToken(input: RequestTokenDto) {
    const allowDevTokenIssue = this.configService.get<boolean>(
      'jwt.allowDevTokenIssue',
      false,
    );

    if (!allowDevTokenIssue) {
      throw new ForbiddenException(
        'Token issuance endpoint is disabled in this environment.',
      );
    }

    const payload: JwtPayload = {
      sub: randomUUID(),
      email: input.email,
      role: this.resolveRoleByEmail(input.email),
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

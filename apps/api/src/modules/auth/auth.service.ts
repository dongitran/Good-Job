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

  private async signAccessTokenForEmail(email: string) {
    const payload: JwtPayload = {
      sub: randomUUID(),
      email,
      role: this.resolveRoleByEmail(email),
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

    return this.signAccessTokenForEmail(input.email);
  }

  async issueOAuthAccessToken(email: string) {
    return this.signAccessTokenForEmail(email);
  }

  buildOAuthRedirectUrl(accessToken: string) {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const params = new URLSearchParams({
      access_token: accessToken,
      token_type: 'Bearer',
    });

    return `${appUrl}/auth/callback#${params.toString()}`;
  }

  buildOAuthErrorRedirectUrl(errorCode: string) {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const params = new URLSearchParams({ auth_error: errorCode });

    return `${appUrl}/?${params.toString()}`;
  }
}

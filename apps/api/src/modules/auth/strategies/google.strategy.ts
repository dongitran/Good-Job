import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthUser } from '../interfaces/oauth-user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('google.clientId'),
      clientSecret: configService.getOrThrow<string>('google.clientSecret'),
      callbackURL: configService.getOrThrow<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Google account has no email.'), false);
      return;
    }

    const user: OAuthUser = {
      email,
      fullName: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
      provider: 'google',
      providerUserId: profile.id,
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // Google access tokens expire in ~1h
    };

    done(null, user);
  }
}

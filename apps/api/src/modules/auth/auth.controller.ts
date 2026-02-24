import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthEmailIpThrottlerGuard } from '../../common/guards/auth-email-ip-throttler.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RequestTokenDto } from './dto/request-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { SignUpWithInvitationDto } from './dto/signup-with-invitation.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthUser } from './interfaces/oauth-user.interface';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from '../../common/cache';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 86_400_000 } }) // 10 per day per IP
  @Post('signup')
  signUp(@Body() body: SignUpDto) {
    return this.authService.signUpWithEmail(body);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } }) // 10 per 15 min per IP
  @HttpCode(200)
  @Post('signin')
  async signIn(@Body() body: SignInDto, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.signInWithEmail(body);
    return this.sendAuthResponse(res, accessToken, refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } }) // 3 per hour per IP
  @UseGuards(AuthEmailIpThrottlerGuard) // also 3 per hour per email+IP
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Public()
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Public()
  @HttpCode(200)
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(body);
    return this.sendAuthResponse(res, accessToken, refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } }) // 3 per hour per IP
  @UseGuards(AuthEmailIpThrottlerGuard) // also 3 per hour per email+IP
  @HttpCode(200)
  @Post('resend-verification')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(body);
  }

  @Public()
  @Post('token')
  issueToken(@Body() body: RequestTokenDto) {
    return this.authService.issueAccessToken(body);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user?: OAuthUser },
    @Res() res: Response,
  ) {
    const oauthUser = req.user;
    if (!oauthUser?.email) {
      return res.redirect(
        this.authService.buildOAuthErrorRedirectUrl('google_email_missing'),
      );
    }

    try {
      const { accessToken, refreshToken } =
        await this.authService.issueOAuthTokens(oauthUser);

      res.setHeader(
        'Set-Cookie',
        this.authService.buildRefreshCookieHeader(refreshToken),
      );

      const redirectUrl = this.authService.buildOAuthRedirectUrl(accessToken);
      return res.redirect(redirectUrl);
    } catch {
      return res.redirect(
        this.authService.buildOAuthErrorRedirectUrl('oauth_failed'),
      );
    }
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = this.extractRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    res.setHeader(
      'Set-Cookie',
      this.authService.buildRefreshCookieHeader(newRefreshToken),
    );

    return res.json({ accessToken, tokenType: 'Bearer' });
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    // Blacklist current access token for immediate revocation
    if (user.jti && user.exp) {
      await this.tokenBlacklist.blacklist(user.jti, user.exp);
    }
    // Revoke all refresh tokens server-side, then clear the cookie
    await this.authService.revokeRefreshTokens(user.sub);
    res.setHeader('Set-Cookie', this.authService.clearRefreshCookieHeader());
    return res.json({ message: 'Logged out.' });
  }

  @HttpCode(200)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Public()
  @HttpCode(200)
  @Post('accept-invitation')
  async acceptInvitation(
    @Body() body: AcceptInvitationDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.acceptInvitation(body.token);
    if (result.status === 'joined') {
      res.setHeader(
        'Set-Cookie',
        this.authService.buildRefreshCookieHeader(result.refreshToken),
      );
      return res.json({ status: 'joined', accessToken: result.accessToken });
    }
    return res.json(result);
  }

  @Public()
  @HttpCode(200)
  @Post('signup-with-invitation')
  async signUpWithInvitation(
    @Body() body: SignUpWithInvitationDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.signUpWithInvitation(body);
    res.setHeader(
      'Set-Cookie',
      this.authService.buildRefreshCookieHeader(result.refreshToken),
    );
    return res.json({ accessToken: result.accessToken });
  }

  private extractRefreshTokenFromCookie(req: Request): string | undefined {
    const cookieHeader = req.headers.cookie ?? '';
    const match = /(?:^|;\s*)refresh_token=([^;]+)/.exec(cookieHeader);
    return match?.[1];
  }

  private sendAuthResponse(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.setHeader(
      'Set-Cookie',
      this.authService.buildRefreshCookieHeader(refreshToken),
    );

    return res.json({ accessToken, tokenType: 'Bearer' });
  }
}

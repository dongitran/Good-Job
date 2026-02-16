import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestTokenDto } from './dto/request-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthUser } from './interfaces/oauth-user.interface';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const email = req.user?.email;
    if (!email) {
      return res.redirect(
        this.authService.buildOAuthErrorRedirectUrl('google_email_missing'),
      );
    }

    const { accessToken } = await this.authService.issueOAuthAccessToken(email);
    const redirectUrl = this.authService.buildOAuthRedirectUrl(accessToken);
    return res.redirect(redirectUrl);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}

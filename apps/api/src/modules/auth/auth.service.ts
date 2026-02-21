import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { StringValue } from 'ms';
import { randomUUID } from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RequestTokenDto } from './dto/request-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthUser } from './interfaces/oauth-user.interface';
import {
  EmailVerificationToken,
  User,
  OAuthConnection,
  OAuthProvider,
  Organization,
  OrganizationMembership,
  PasswordResetToken,
  UserRole,
  OrgPlan,
} from '../../database/entities';
import { AuthEmailService } from './auth-email.service';

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  version: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authEmailService: AuthEmailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OAuthConnection)
    private readonly oauthConnectionRepo: Repository<OAuthConnection>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly membershipRepo: Repository<OrganizationMembership>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepo: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  // ─── OAuth User Provisioning ───────────────────────────────────────────────

  /**
   * Find or create a User + OAuthConnection from the OAuth provider payload.
   * If the user has no org membership, auto-creates a personal organization.
   */
  async findOrCreateOAuthUser(oauthUser: OAuthUser): Promise<{
    user: User;
    membership: OrganizationMembership | null;
  }> {
    // 1. Try to find by existing OAuth connection (most common path)
    let connection = await this.oauthConnectionRepo.findOne({
      where: { providerUserId: oauthUser.providerUserId },
      relations: ['user'],
    });

    let user: User;
    let isNewUser = false;

    if (connection) {
      user = connection.user;
      // Update provider tokens in case they were refreshed by Google
      connection.accessToken = oauthUser.accessToken ?? connection.accessToken;
      connection.refreshToken =
        oauthUser.refreshToken ?? connection.refreshToken;
      connection.tokenExpiresAt =
        oauthUser.tokenExpiresAt ?? connection.tokenExpiresAt;
      await this.oauthConnectionRepo.save(connection);
    } else {
      // 2. Check if a user with this email already exists (password or other OAuth)
      const existingUser = await this.userRepo.findOne({
        where: { email: oauthUser.email },
      });

      if (!existingUser) {
        // 3. Brand-new user — create account
        user = await this.userRepo.save(
          this.userRepo.create({
            email: oauthUser.email,
            fullName: oauthUser.fullName,
            avatarUrl: oauthUser.avatarUrl ?? undefined,
            passwordHash: undefined, // OAuth-only user
            emailVerifiedAt: new Date(), // OAuth emails are pre-verified
            isActive: true,
          }),
        );
        isNewUser = true;
        this.logger.log(`New OAuth user created: ${user.email}`);
      } else {
        user = existingUser;
        if (!user.emailVerifiedAt) {
          // Existing user linking OAuth — mark email as verified
          user.emailVerifiedAt = new Date();
          await this.userRepo.save(user);
        }
      }

      // 4. Create OAuth connection record
      connection = await this.oauthConnectionRepo.save(
        this.oauthConnectionRepo.create({
          userId: user.id,
          provider:
            OAuthProvider[
              oauthUser.provider.toUpperCase() as keyof typeof OAuthProvider
            ],
          providerUserId: oauthUser.providerUserId,
          accessToken: oauthUser.accessToken ?? '',
          refreshToken: oauthUser.refreshToken ?? undefined,
          tokenExpiresAt: oauthUser.tokenExpiresAt ?? new Date(),
        }),
      );
    }

    // 5. Load the user's first active membership for JWT context
    let membership = await this.getPrimaryMembership(user.id);

    // 6. Auto-create a personal org if user has no membership
    if (!membership && isNewUser) {
      membership = await this.createPersonalOrg(user);
    }

    return { user, membership };
  }

  /**
   * Creates a personal organization for a new user with no existing org.
   * The user becomes the owner of their personal workspace.
   */
  private async createPersonalOrg(user: User): Promise<OrganizationMembership> {
    const slug = this.generateOrgSlug(user.email);

    const org = this.orgRepo.create({
      name: `${user.fullName}'s Workspace`,
      slug,
      plan: OrgPlan.PRO_TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 14-day trial
      settings: {},
    });
    const savedOrg = await this.orgRepo.save(org);

    const membership = this.membershipRepo.create({
      userId: user.id,
      orgId: savedOrg.id,
      role: UserRole.OWNER,
      isActive: true,
      joinedAt: new Date(),
    });
    const savedMembership = await this.membershipRepo.save(membership);
    this.logger.log(
      `Auto-created personal org "${savedOrg.name}" for ${user.email}`,
    );
    return savedMembership;
  }

  private generateOrgSlug(email: string): string {
    const local = email.split('@')[0] ?? 'user';
    const base = local
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    // Add random suffix to avoid conflicts
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }

  // ─── Token Issuance ────────────────────────────────────────────────────────

  private async buildAccessPayload(
    user: User,
    membership: OrganizationMembership | null,
  ): Promise<JwtPayload> {
    let onboardingCompletedAt: string | null = null;
    if (membership?.orgId) {
      const org = await this.orgRepo.findOne({
        where: { id: membership.orgId },
        select: ['id', 'onboardingCompletedAt'],
      });
      onboardingCompletedAt = org?.onboardingCompletedAt?.toISOString() ?? null;
    }
    return {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? undefined,
      role: membership?.role ?? UserRole.MEMBER,
      orgId: membership?.orgId ?? undefined,
      onboardingCompletedAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async getPrimaryMembership(
    userId: string,
  ): Promise<OrganizationMembership | null> {
    return this.membershipRepo.findOne({
      where: { userId, isActive: true },
      order: { joinedAt: 'ASC' },
    });
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    const expiresIn = (this.configService.get<string>('jwt.accessExpiry') ??
      '15m') as StringValue;
    return this.jwtService.signAsync(payload, { expiresIn });
  }

  private async signRefreshToken(
    userId: string,
    tokenVersion: number,
  ): Promise<string> {
    const expiresIn = (this.configService.get<string>('jwt.refreshExpiry') ??
      '7d') as StringValue;
    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      version: tokenVersion,
    };
    return this.jwtService.signAsync(payload, { expiresIn });
  }

  private async issueTokenPair(
    user: User,
    membership: OrganizationMembership | null,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = await this.buildAccessPayload(user, membership);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(user.id, user.refreshTokenVersion),
    ]);

    return { accessToken, refreshToken };
  }

  async issueOAuthTokens(oauthUser: OAuthUser): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { user, membership } = await this.findOrCreateOAuthUser(oauthUser);
    return this.issueTokenPair(user, membership);
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let decoded: RefreshTokenPayload;
    try {
      decoded =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Token type mismatch.');
    }

    const user = await this.userRepo.findOne({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated.');
    }

    // Verify token version — logout increments this, invalidating old tokens
    if (decoded.version !== user.refreshTokenVersion) {
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    const membership = await this.getPrimaryMembership(user.id);
    return this.issueTokenPair(user, membership);
  }

  /**
   * Invalidate all refresh tokens for a user by incrementing the token version.
   */
  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'refreshTokenVersion', 1);
    this.logger.log(`Revoked all refresh tokens for user ${userId}`);
  }

  // ─── Email/Password Auth ───────────────────────────────────────────────────

  async signUpWithEmail(input: SignUpDto): Promise<{
    message: string;
  }> {
    const email = this.normalizeEmail(input.email);
    const fullName = input.fullName.trim();
    if (!fullName) {
      throw new BadRequestException('Full name is required.');
    }
    const existing = await this.userRepo.findOne({ where: { email } });

    if (existing?.passwordHash) {
      throw new ConflictException('Email is already registered.');
    }

    if (existing && !existing.passwordHash) {
      throw new ConflictException(
        'Email already exists via Google. Please sign in with Google.',
      );
    }

    const passwordHash = await hash(input.password, 12);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email,
        fullName,
        passwordHash,
        emailVerifiedAt: undefined,
        isActive: true,
      }),
    );

    await this.createPersonalOrg(user);
    await this.createAndSendVerificationToken(user);

    return {
      message:
        'Account created. Please check your email and verify your account before signing in.',
    };
  }

  async signInWithEmail(input: SignInDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const email = this.normalizeEmail(input.email);
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is deactivated.');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Email is not verified. Please check your inbox for the verification link.',
      );
    }

    const matched = await compare(input.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const membership =
      (await this.getPrimaryMembership(user.id)) ??
      (await this.createPersonalOrg(user));
    return this.issueTokenPair(user, membership);
  }

  async verifyEmail(input: VerifyEmailDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const record = await this.emailVerificationTokenRepo.findOne({
      where: { token: input.token },
      relations: ['user'],
    });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const user = record.user;
    if (!user || !user.isActive) {
      throw new ForbiddenException('User not found or deactivated.');
    }

    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await this.userRepo.save(user);
    }
    await this.emailVerificationTokenRepo.delete({ id: record.id });

    const membership =
      (await this.getPrimaryMembership(user.id)) ??
      (await this.createPersonalOrg(user));

    return this.issueTokenPair(user, membership);
  }

  async resendVerificationEmail(input: ResendVerificationDto): Promise<{
    message: string;
  }> {
    const email = this.normalizeEmail(input.email);
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.passwordHash || user.emailVerifiedAt || !user.isActive) {
      return {
        message:
          'If this account exists and is unverified, a verification email has been sent.',
      };
    }

    await this.createAndSendVerificationToken(user);
    return {
      message:
        'If this account exists and is unverified, a verification email has been sent.',
    };
  }

  async requestPasswordReset(input: ForgotPasswordDto): Promise<{
    message: string;
  }> {
    const email = this.normalizeEmail(input.email);
    const user = await this.userRepo.findOne({ where: { email } });

    if (user && user.passwordHash && user.isActive) {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.passwordResetTokenRepo.save(
        this.passwordResetTokenRepo.create({
          userId: user.id,
          token,
          expiresAt,
        }),
      );
      await this.authEmailService.sendPasswordResetEmail(
        user.email,
        user.fullName,
        token,
      );
    }

    return {
      message:
        'If this email exists, a password reset link will be sent shortly.',
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated.');
    }
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password change is not available for OAuth-only accounts.',
      );
    }
    const matched = await compare(dto.currentPassword, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    user.passwordHash = await hash(dto.newPassword, 12);
    await this.userRepo.save(user);
    await this.revokeRefreshTokens(userId);
    return { message: 'Password changed successfully.' };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: { token: input.token },
      relations: ['user'],
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (!resetToken.user || !resetToken.user.isActive) {
      throw new ForbiddenException('User not found or deactivated.');
    }

    resetToken.user.passwordHash = await hash(input.newPassword, 12);
    resetToken.user.emailVerifiedAt =
      resetToken.user.emailVerifiedAt ?? new Date();

    await this.userRepo.save(resetToken.user);
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepo.save(resetToken);
    await this.revokeRefreshTokens(resetToken.user.id);

    return { message: 'Password reset successful.' };
  }

  private async createAndSendVerificationToken(user: User): Promise<void> {
    await this.emailVerificationTokenRepo.delete({ userId: user.id });
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.emailVerificationTokenRepo.save(
      this.emailVerificationTokenRepo.create({
        userId: user.id,
        token,
        expiresAt,
      }),
    );

    await this.authEmailService.sendVerificationEmail(
      user.email,
      user.fullName,
      token,
    );
  }

  // ─── Dev Token Issuance (guarded by flag) ─────────────────────────────────

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

    // Look up actual user from DB to avoid fake user IDs in tokens
    const email = this.normalizeEmail(input.email);
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new ForbiddenException(
        `No user found with email: ${input.email}. Register first via OAuth.`,
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is deactivated.');
    }

    const membership = await this.getPrimaryMembership(user.id);

    const payload = await this.buildAccessPayload(user, membership);
    const expiresIn = (this.configService.get<string>('jwt.accessExpiry') ??
      '15m') as StringValue;
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });
    return { accessToken, tokenType: 'Bearer', expiresIn };
  }

  // ─── Redirect URL Builders ─────────────────────────────────────────────────

  buildOAuthRedirectUrl(accessToken: string): string {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const params = new URLSearchParams({
      access_token: accessToken,
      token_type: 'Bearer',
    });
    return `${appUrl}/auth/callback#${params.toString()}`;
  }

  buildOAuthErrorRedirectUrl(errorCode: string): string {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const params = new URLSearchParams({ auth_error: errorCode });
    return `${appUrl}/?${params.toString()}`;
  }

  buildRefreshCookieHeader(refreshToken: string): string {
    const refreshExpiry = this.configService.get<string>(
      'jwt.refreshExpiry',
      '7d',
    );
    const maxAgeSeconds = this.parseExpiryToSeconds(refreshExpiry);
    const cookieAttrs = this.getRefreshCookieAttributes();
    return [
      `refresh_token=${refreshToken}`,
      `Max-Age=${maxAgeSeconds}`,
      ...cookieAttrs,
    ].join('; ');
  }

  clearRefreshCookieHeader(): string {
    const cookieAttrs = this.getRefreshCookieAttributes();
    return ['refresh_token=', 'Max-Age=0', ...cookieAttrs].join('; ');
  }

  private getRefreshCookieAttributes(): string[] {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const appUrl = this.configService.getOrThrow<string>('app.url');
    const cookieDomain = `.${new URL(appUrl).hostname}`;
    return [
      'Path=/api/auth/refresh',
      'HttpOnly',
      isProduction ? 'SameSite=None' : 'SameSite=Strict',
      isProduction ? `Domain=${cookieDomain}` : '',
      isProduction ? 'Secure' : '',
    ].filter(Boolean);
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 3600; // default 7d
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 86400);
  }
}

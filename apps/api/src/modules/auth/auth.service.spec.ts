import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import { ObjectLiteral, Repository } from 'typeorm';
import {
  EmailVerificationToken,
  User,
  OAuthConnection,
  Organization,
  OrganizationMembership,
  PasswordResetToken,
  UserRole,
  OrgPlan,
  Invitation,
} from '../../database/entities';
import { AuthService } from './auth.service';
import { AuthEmailService } from './auth-email.service';
import { OAuthUser } from './interfaces/oauth-user.interface';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createMockRepo<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    create: jest.fn((entity) => entity as T),
    save: jest.fn((entity) => Promise.resolve(entity as T)),
    delete: jest.fn(),
    increment: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Repository<T>>;
}

function createMockAuthEmailService(): jest.Mocked<AuthEmailService> {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthEmailService>;
}

function createMockJwtService(): jest.Mocked<JwtService> {
  return {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
}

function createMockConfigService(
  overrides: Record<string, unknown> = {},
): jest.Mocked<ConfigService> {
  const defaults: Record<string, unknown> = {
    'jwt.accessExpiry': '15m',
    'jwt.refreshExpiry': '7d',
    'jwt.allowDevTokenIssue': false,
    'app.url': 'http://localhost:5174',
    NODE_ENV: 'development',
  };
  const config = { ...defaults, ...overrides };

  return {
    get: jest.fn(
      (key: string, defaultValue?: unknown) => config[key] ?? defaultValue,
    ),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in config)) throw new Error(`Missing config key: ${key}`);
      return config[key];
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

function buildService(deps?: {
  jwtService?: jest.Mocked<JwtService>;
  configService?: jest.Mocked<ConfigService>;
  userRepo?: jest.Mocked<Repository<User>>;
  oauthConnectionRepo?: jest.Mocked<Repository<OAuthConnection>>;
  orgRepo?: jest.Mocked<Repository<Organization>>;
  membershipRepo?: jest.Mocked<Repository<OrganizationMembership>>;
  emailVerificationTokenRepo?: jest.Mocked<Repository<EmailVerificationToken>>;
  passwordResetTokenRepo?: jest.Mocked<Repository<PasswordResetToken>>;
  invitationRepo?: jest.Mocked<Repository<Invitation>>;
  authEmailService?: jest.Mocked<AuthEmailService>;
}) {
  const jwtService = deps?.jwtService ?? createMockJwtService();
  const configService = deps?.configService ?? createMockConfigService();
  const userRepo = deps?.userRepo ?? createMockRepo<User>();
  const oauthConnectionRepo =
    deps?.oauthConnectionRepo ?? createMockRepo<OAuthConnection>();
  const orgRepo = deps?.orgRepo ?? createMockRepo<Organization>();
  const membershipRepo =
    deps?.membershipRepo ?? createMockRepo<OrganizationMembership>();
  const emailVerificationTokenRepo =
    deps?.emailVerificationTokenRepo ??
    createMockRepo<EmailVerificationToken>();
  const passwordResetTokenRepo =
    deps?.passwordResetTokenRepo ?? createMockRepo<PasswordResetToken>();
  const invitationRepo = deps?.invitationRepo ?? createMockRepo<Invitation>();
  const authEmailService =
    deps?.authEmailService ?? createMockAuthEmailService();

  const service = new AuthService(
    jwtService,
    configService,
    authEmailService,
    userRepo,
    oauthConnectionRepo,
    orgRepo,
    membershipRepo,
    emailVerificationTokenRepo,
    passwordResetTokenRepo,
    invitationRepo,
  );

  return {
    service,
    jwtService,
    configService,
    userRepo,
    oauthConnectionRepo,
    orgRepo,
    membershipRepo,
    emailVerificationTokenRepo,
    passwordResetTokenRepo,
    invitationRepo,
    authEmailService,
  };
}

const sampleOAuthUser: OAuthUser = {
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  avatarUrl: 'https://example.com/avatar.png',
  provider: 'google',
  providerUserId: 'google-123',
  accessToken: 'goog-access',
  refreshToken: 'goog-refresh',
  tokenExpiresAt: new Date('2030-01-01'),
};

const sampleUser: User = {
  id: 'user-uuid-1',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  avatarUrl: 'https://example.com/avatar.png',
  passwordHash: null as unknown as string,
  emailVerifiedAt: new Date(),
  isActive: true,
  refreshTokenVersion: 0,
  memberships: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as User;

const sampleMembership: OrganizationMembership = {
  id: 'membership-uuid-1',
  userId: 'user-uuid-1',
  orgId: 'org-uuid-1',
  role: UserRole.OWNER,
  isActive: true,
  joinedAt: new Date(),
} as OrganizationMembership;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  describe('findOrCreateOAuthUser', () => {
    it('returns existing user when OAuth connection already exists', async () => {
      const { service, oauthConnectionRepo, membershipRepo } = buildService();
      oauthConnectionRepo.findOne.mockResolvedValue({
        user: sampleUser,
        accessToken: 'old',
        refreshToken: 'old',
        tokenExpiresAt: new Date(),
      } as unknown as OAuthConnection);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);

      const result = await service.findOrCreateOAuthUser(sampleOAuthUser);

      expect(result.user.id).toBe(sampleUser.id);
      expect(result.membership?.orgId).toBe('org-uuid-1');
      expect(oauthConnectionRepo.save).toHaveBeenCalled();
    });

    it('creates new user and OAuth connection for brand-new email', async () => {
      const {
        service,
        oauthConnectionRepo,
        userRepo,
        orgRepo,
        membershipRepo,
      } = buildService();

      oauthConnectionRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(sampleUser);
      orgRepo.save.mockResolvedValue({
        id: 'new-org-id',
        name: "Alice Smith's Workspace",
      } as Organization);
      membershipRepo.findOne.mockResolvedValue(null);
      membershipRepo.save.mockResolvedValue(sampleMembership);

      const result = await service.findOrCreateOAuthUser(sampleOAuthUser);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@example.com',
          fullName: 'Alice Smith',
          passwordHash: undefined,
        }),
      );
      expect(userRepo.save).toHaveBeenCalled();
      expect(oauthConnectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          providerUserId: 'google-123',
          accessToken: 'goog-access',
        }),
      );
      // Auto-creates personal org for new user
      expect(orgRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ plan: OrgPlan.PRO_TRIAL }),
      );
      expect(result.membership).toBeTruthy();
    });

    it('links OAuth to existing user found by email', async () => {
      const { service, oauthConnectionRepo, userRepo, membershipRepo } =
        buildService();

      oauthConnectionRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        emailVerifiedAt: null,
      } as unknown as User);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);

      await service.findOrCreateOAuthUser(sampleOAuthUser);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
      );
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(oauthConnectionRepo.create).toHaveBeenCalled();
    });
  });

  describe('issueOAuthTokens', () => {
    it('returns access and refresh tokens with correct payloads', async () => {
      const { service, oauthConnectionRepo, membershipRepo, jwtService } =
        buildService();

      oauthConnectionRepo.findOne.mockResolvedValue({
        user: sampleUser,
        accessToken: 'old',
        refreshToken: 'old',
        tokenExpiresAt: new Date(),
      } as unknown as OAuthConnection);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);
      jwtService.signAsync
        .mockResolvedValueOnce('access-jwt')
        .mockResolvedValueOnce('refresh-jwt');

      const result = await service.issueOAuthTokens(sampleOAuthUser);

      expect(result).toEqual({
        accessToken: 'access-jwt',
        refreshToken: 'refresh-jwt',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: sampleUser.id,
          role: UserRole.OWNER,
          orgId: 'org-uuid-1',
        }),
        expect.any(Object),
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: sampleUser.id,
          type: 'refresh',
          version: 0,
        }),
        expect.any(Object),
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('issues new token pair when refresh token is valid', async () => {
      const { service, jwtService, userRepo, membershipRepo } = buildService();

      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'refresh',
        version: 0,
      });
      userRepo.findOne.mockResolvedValue(sampleUser);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('rejects revoked token (version mismatch)', async () => {
      const { service, jwtService, userRepo } = buildService();

      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'refresh',
        version: 0,
      });
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        refreshTokenVersion: 1,
      });

      await expect(service.refreshAccessToken('old-token')).rejects.toThrow(
        'Refresh token has been revoked.',
      );
    });

    it('rejects expired JWT', async () => {
      const { service, jwtService } = buildService();
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshAccessToken('expired')).rejects.toThrow(
        'Invalid or expired refresh token.',
      );
    });

    it('rejects wrong token type', async () => {
      const { service, jwtService } = buildService();
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'access',
      });

      await expect(service.refreshAccessToken('wrong-type')).rejects.toThrow(
        'Token type mismatch.',
      );
    });

    it('rejects deactivated user', async () => {
      const { service, jwtService, userRepo } = buildService();
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid-1',
        type: 'refresh',
        version: 0,
      });
      userRepo.findOne.mockResolvedValue({ ...sampleUser, isActive: false });

      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        'User not found or deactivated.',
      );
    });
  });

  describe('revokeRefreshTokens', () => {
    it('increments user refresh token version', async () => {
      const { service, userRepo } = buildService();

      await service.revokeRefreshTokens('user-uuid-1');

      expect(userRepo.increment).toHaveBeenCalledWith(
        { id: 'user-uuid-1' },
        'refreshTokenVersion',
        1,
      );
    });
  });

  describe('email/password auth', () => {
    it('creates account and sends verification email on sign up', async () => {
      const {
        service,
        userRepo,
        orgRepo,
        membershipRepo,
        emailVerificationTokenRepo,
        authEmailService,
      } = buildService();

      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({
        ...sampleUser,
        passwordHash: 'hashed',
        emailVerifiedAt: null,
      } as unknown as User);
      orgRepo.save.mockResolvedValue({
        id: 'org-1',
        name: "Alice's Workspace",
      } as Organization);
      membershipRepo.save.mockResolvedValue(sampleMembership);
      emailVerificationTokenRepo.save.mockResolvedValue({
        id: 'verify-token-id',
        userId: sampleUser.id,
        token: 'verify-token',
        expiresAt: new Date(Date.now() + 86_400_000),
      } as EmailVerificationToken);

      const result = await service.signUpWithEmail({
        email: 'Alice@Example.com',
        fullName: 'Alice',
        password: 'password123',
      });

      expect(result).toEqual({
        message:
          'Account created. Please check your email and verify your account before signing in.',
      });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@example.com',
          fullName: 'Alice',
          passwordHash: expect.any(String),
        }),
      );
      expect(authEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'alice@example.com',
        'Alice Smith',
        expect.any(String),
      );
    });

    it('signs in existing user with valid password', async () => {
      const { service, userRepo, membershipRepo, jwtService } = buildService();
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        passwordHash: hashSync('password123', 10),
      } as User);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);
      jwtService.signAsync
        .mockResolvedValueOnce('access-signin')
        .mockResolvedValueOnce('refresh-signin');

      const result = await service.signInWithEmail({
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-signin',
        refreshToken: 'refresh-signin',
      });
    });

    it('rejects invalid password on sign in', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        passwordHash: hashSync('different-password', 10),
      } as User);

      await expect(
        service.signInWithEmail({
          email: 'alice@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('rejects signin when email is not verified', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        passwordHash: hashSync('password123', 10),
        emailVerifiedAt: null,
      } as unknown as User);

      await expect(
        service.signInWithEmail({
          email: 'alice@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Email is not verified');
    });
  });

  describe('issueAccessToken (dev endpoint)', () => {
    it('issues token for existing user when enabled', async () => {
      const configService = createMockConfigService({
        'jwt.allowDevTokenIssue': true,
      });
      const { service, userRepo, membershipRepo, jwtService } = buildService({
        configService,
      });

      userRepo.findOne.mockResolvedValue(sampleUser);
      membershipRepo.findOne.mockResolvedValue(sampleMembership);
      jwtService.signAsync.mockResolvedValue('dev-token');

      const result = await service.issueAccessToken({
        email: 'alice@example.com',
      });

      expect(result.accessToken).toBe('dev-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-uuid-1' }),
        expect.any(Object),
      );
    });

    it('blocks when disabled by config', async () => {
      const { service } = buildService();

      await expect(
        service.issueAccessToken({ email: 'alice@example.com' }),
      ).rejects.toThrow('Token issuance endpoint is disabled');
    });

    it('rejects nonexistent user', async () => {
      const configService = createMockConfigService({
        'jwt.allowDevTokenIssue': true,
      });
      const { service, userRepo } = buildService({ configService });
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.issueAccessToken({ email: 'nobody@example.com' }),
      ).rejects.toThrow('No user found with email');
    });
  });

  describe('URL builders', () => {
    it('buildOAuthRedirectUrl includes token in fragment', () => {
      const { service } = buildService();
      const url = service.buildOAuthRedirectUrl('test-token');
      expect(url).toBe(
        'http://localhost:5174/auth/callback#access_token=test-token&token_type=Bearer',
      );
    });

    it('buildOAuthErrorRedirectUrl includes error code', () => {
      const { service } = buildService();
      const url = service.buildOAuthErrorRedirectUrl('google_email_missing');
      expect(url).toContain('auth_error=google_email_missing');
    });
  });

  describe('cookie headers', () => {
    it('buildRefreshCookieHeader has HttpOnly and SameSite', () => {
      const { service } = buildService();
      const header = service.buildRefreshCookieHeader('token');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Strict');
      expect(header).toContain('Path=/api/auth/refresh');
      expect(header).not.toContain('Secure');
    });

    it('buildRefreshCookieHeader includes Secure in production', () => {
      const configService = createMockConfigService({
        NODE_ENV: 'production',
      });
      const { service } = buildService({ configService });
      expect(service.buildRefreshCookieHeader('token')).toContain('Secure');
    });

    it('clearRefreshCookieHeader sets Max-Age=0 and correct path', () => {
      const { service } = buildService();
      const header = service.clearRefreshCookieHeader();
      expect(header).toContain('Max-Age=0');
      expect(header).toContain('Path=/api/auth/refresh');
    });
  });

  describe('signUpWithInvitation', () => {
    const validInvitation = {
      id: 'inv-uuid-1',
      orgId: 'org-uuid-1',
      email: 'invitee@example.com',
      role: 'member',
      token: 'invite-token-123',
      expiresAt: new Date(Date.now() + 86_400_000), // 24h from now
      acceptedAt: null,
      invitedBy: 'admin-uuid',
      createdAt: new Date(),
    } as unknown as Invitation;

    it('creates user with emailVerifiedAt set and returns tokens', async () => {
      const {
        service,
        invitationRepo,
        userRepo,
        membershipRepo,
        jwtService,
        authEmailService,
      } = buildService();

      invitationRepo.findOne.mockResolvedValue({ ...validInvitation });
      userRepo.findOne.mockResolvedValue(null); // no existing user
      userRepo.save.mockResolvedValue({
        ...sampleUser,
        id: 'new-user-id',
        email: 'invitee@example.com',
        emailVerifiedAt: new Date(),
      } as User);
      membershipRepo.save.mockResolvedValue({
        ...sampleMembership,
        userId: 'new-user-id',
        orgId: 'org-uuid-1',
        role: UserRole.MEMBER,
      } as OrganizationMembership);
      membershipRepo.findOne.mockResolvedValue({
        ...sampleMembership,
        userId: 'new-user-id',
        orgId: 'org-uuid-1',
        role: UserRole.MEMBER,
      } as OrganizationMembership);
      jwtService.signAsync
        .mockResolvedValueOnce('access-jwt')
        .mockResolvedValueOnce('refresh-jwt');

      const result = await service.signUpWithInvitation({
        inviteToken: 'invite-token-123',
        fullName: 'New Member',
        password: 'Password123!',
      });

      // Should return tokens, not a message
      expect(result).toEqual({
        accessToken: 'access-jwt',
        refreshToken: 'refresh-jwt',
      });

      // Should create user with emailVerifiedAt set
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'invitee@example.com',
          fullName: 'New Member',
          emailVerifiedAt: expect.any(Date),
        }),
      );

      // Should NOT send verification email
      expect(authEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('rejects expired invitation', async () => {
      const { service, invitationRepo } = buildService();

      invitationRepo.findOne.mockResolvedValue({
        ...validInvitation,
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      await expect(
        service.signUpWithInvitation({
          inviteToken: 'invite-token-123',
          fullName: 'New Member',
          password: 'Password123!',
        }),
      ).rejects.toThrow('This invitation link has expired.');
    });

    it('rejects already accepted invitation', async () => {
      const { service, invitationRepo } = buildService();

      invitationRepo.findOne.mockResolvedValue({
        ...validInvitation,
        acceptedAt: new Date(), // already accepted
      });

      await expect(
        service.signUpWithInvitation({
          inviteToken: 'invite-token-123',
          fullName: 'New Member',
          password: 'Password123!',
        }),
      ).rejects.toThrow('Invalid or expired invitation link.');
    });

    it('rejects if user with password already exists', async () => {
      const { service, invitationRepo, userRepo } = buildService();

      invitationRepo.findOne.mockResolvedValue({ ...validInvitation });
      userRepo.findOne.mockResolvedValue({
        ...sampleUser,
        email: 'invitee@example.com',
        passwordHash: 'existing-hash',
      } as User);

      await expect(
        service.signUpWithInvitation({
          inviteToken: 'invite-token-123',
          fullName: 'New Member',
          password: 'Password123!',
        }),
      ).rejects.toThrow(
        'An account with this email already exists. Please sign in.',
      );
    });
  });
});

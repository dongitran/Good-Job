import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ObjectLiteral, Repository } from 'typeorm';
import {
  User,
  OAuthConnection,
  Organization,
  OrganizationMembership,
  UserRole,
  OrgPlan,
} from '../../database/entities';
import { AuthService } from './auth.service';
import { OAuthUser } from './interfaces/oauth-user.interface';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createMockRepo<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
  return {
    findOne: jest.fn(),
    create: jest.fn((entity) => entity as T),
    save: jest.fn((entity) => Promise.resolve(entity as T)),
    increment: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Repository<T>>;
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
}) {
  const jwtService = deps?.jwtService ?? createMockJwtService();
  const configService = deps?.configService ?? createMockConfigService();
  const userRepo = deps?.userRepo ?? createMockRepo<User>();
  const oauthConnectionRepo =
    deps?.oauthConnectionRepo ?? createMockRepo<OAuthConnection>();
  const orgRepo = deps?.orgRepo ?? createMockRepo<Organization>();
  const membershipRepo =
    deps?.membershipRepo ?? createMockRepo<OrganizationMembership>();

  const service = new AuthService(
    jwtService,
    configService,
    userRepo,
    oauthConnectionRepo,
    orgRepo,
    membershipRepo,
  );

  return {
    service,
    jwtService,
    configService,
    userRepo,
    oauthConnectionRepo,
    orgRepo,
    membershipRepo,
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
});

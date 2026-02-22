import { appConfig } from './app.config';
import { jwtConfig, googleConfig } from './auth.config';
import { geminiConfig } from './ai.config';
import { dbConfig, typeormConfig } from './database.config';
import { pointsConfig } from './points.config';
import { redisConfig } from './redis.config';
import { getEnv, getEnvBoolean, getEnvInt, requireEnv } from './helpers';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.API_PORT = '3000';
    process.env.APP_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/callback';
    process.env.GCP_GCS_PROJECT_ID = 'demo-project';
    process.env.GCP_GCS_CREDENTIALS =
      '{"client_email":"uploader@demo-project.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\\\ndemo\\\\n-----END PRIVATE KEY-----\\\\n"}';
    process.env.GEMINI_API_KEYS = 'gemini-key1,gemini-key2';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/goodjob';
    process.env.DEFAULT_MONTHLY_BUDGET = '1000';
    process.env.DEFAULT_MIN_POINTS = '1';
    process.env.DEFAULT_MAX_POINTS = '100';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.REDIS_PORT = '6379';
    process.env.AUTH_ALLOW_DEV_TOKEN_ISSUE = 'true';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads app config', () => {
    const cfg = (appConfig as unknown as () => Record<string, unknown>)();
    expect(cfg.port).toBe(3000);
    expect(cfg.url).toBe('http://localhost:5173');
    expect(cfg.env).toBe('test');
  });

  it('loads auth config', () => {
    const jwt = (jwtConfig as unknown as () => Record<string, unknown>)();
    const google = (googleConfig as unknown as () => Record<string, unknown>)();
    expect(jwt.secret).toBe('secret');
    expect(jwt.accessExpiry).toBe('15m');
    expect(jwt.refreshExpiry).toBe('7d');
    expect(jwt.allowDevTokenIssue).toBe(true);
    expect(google.clientId).toBe('google-id');
  });

  it('loads ai and points config', () => {
    const ai = (geminiConfig as unknown as () => Record<string, unknown>)();
    const points = (pointsConfig as unknown as () => Record<string, unknown>)();
    expect(ai.apiKeys).toEqual(['gemini-key1', 'gemini-key2']);
    expect(points.defaultMonthlyBudget).toBe(1000);
    expect(points.minPoints).toBe(1);
    expect(points.maxPoints).toBe(100);
  });

  it('loads db and redis config', () => {
    const db = (dbConfig as unknown as () => Record<string, unknown>)();
    const orm = (typeormConfig as unknown as () => Record<string, unknown>)();
    const redis = (redisConfig as unknown as () => Record<string, unknown>)();
    expect(db.url).toContain('postgresql://');
    expect(orm.type).toBe('postgres');
    expect(redis.url).toBe('redis://localhost:6379');
  });

  it('requireEnv handles missing and fallback values', () => {
    expect(requireEnv('APP_URL')).toBe('http://localhost:5173');
    expect(getEnv('MISSING_OPTIONAL', 'fallback')).toBe('fallback');
    expect(getEnvInt('REDIS_PORT', 0)).toBe(6379);
    expect(getEnvBoolean('AUTH_ALLOW_DEV_TOKEN_ISSUE', false)).toBe(true);
    expect(() => requireEnv('MISSING_REQUIRED')).toThrow(
      'Missing required environment variable: MISSING_REQUIRED',
    );
  });

  it('helper parsers handle edge and invalid values', () => {
    delete process.env.REDIS_PORT;
    expect(getEnvInt('REDIS_PORT', 6380)).toBe(6380);

    process.env.REDIS_PORT = 'invalid';
    expect(getEnvInt('REDIS_PORT', 6379)).toBe(6379);

    process.env.AUTH_ALLOW_DEV_TOKEN_ISSUE = 'false';
    expect(getEnvBoolean('AUTH_ALLOW_DEV_TOKEN_ISSUE', true)).toBe(false);

    process.env.AUTH_ALLOW_DEV_TOKEN_ISSUE = 'invalid';
    expect(() => getEnvBoolean('AUTH_ALLOW_DEV_TOKEN_ISSUE', true)).toThrow(
      'Environment variable AUTH_ALLOW_DEV_TOKEN_ISSUE must be "true" or "false".',
    );
  });
});

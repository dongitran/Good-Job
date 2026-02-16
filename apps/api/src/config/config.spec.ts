import { appConfig } from './app.config';
import { jwtConfig, googleConfig } from './auth.config';
import { geminiConfig } from './ai.config';
import { dbConfig, typeormConfig } from './database.config';
import { pointsConfig } from './points.config';
import { redisConfig } from './redis.config';
import { requireEnv } from './helpers';

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
    process.env.GEMINI_API_KEY = 'gemini-key';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/goodjob';
    process.env.DEFAULT_MONTHLY_BUDGET = '1000';
    process.env.DEFAULT_MIN_POINTS = '1';
    process.env.DEFAULT_MAX_POINTS = '100';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
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
    expect(google.clientId).toBe('google-id');
  });

  it('loads ai and points config', () => {
    const ai = (geminiConfig as unknown as () => Record<string, unknown>)();
    const points = (pointsConfig as unknown as () => Record<string, unknown>)();
    expect(ai.apiKey).toBe('gemini-key');
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
    expect(redis.host).toBe('localhost');
    expect(redis.port).toBe(6379);
  });

  it('requireEnv handles missing and fallback values', () => {
    expect(requireEnv('APP_URL')).toBe('http://localhost:5173');
    expect(requireEnv('MISSING_OPTIONAL', 'fallback')).toBe('fallback');
    expect(() => requireEnv('MISSING_REQUIRED')).toThrow(
      'Missing required environment variable: MISSING_REQUIRED',
    );
  });
});

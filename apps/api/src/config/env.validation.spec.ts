import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    APP_URL: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/goodjob_test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'google-id',
    GOOGLE_CLIENT_SECRET: 'google-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
    DEFAULT_MONTHLY_BUDGET: '1000',
    DEFAULT_MIN_POINTS: '1',
    DEFAULT_MAX_POINTS: '100',
    GEMINI_API_KEYS: 'gemini-key',
  };

  it('applies sane defaults for optional values', () => {
    const validated = validateEnv(validEnv);
    expect(validated.API_PORT).toBe('3000');
    expect(validated.JWT_ACCESS_EXPIRY).toBe('15m');
    expect(validated.AUTH_ALLOW_DEV_TOKEN_ISSUE).toBe('true');
  });

  it('throws when required variables are missing', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        DATABASE_URL: '',
      }),
    ).toThrow('Environment variable DATABASE_URL is required.');
  });

  it('throws when NODE_ENV is invalid', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        NODE_ENV: 'staging',
      }),
    ).toThrow('Environment variable NODE_ENV must be one of');
  });
});

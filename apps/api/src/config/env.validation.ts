type EnvMap = Record<string, unknown>;

const NODE_ENVS = ['development', 'test', 'production'] as const;

function ensureString(env: EnvMap, key: string): string {
  const value = env[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Environment variable ${key} is required.`);
  }
  return value;
}

function ensureIntegerWithDefault(
  env: EnvMap,
  key: string,
  defaultValue: number,
): number {
  const value = env[key];
  if (typeof value === 'undefined' || value === null || value === '') {
    return defaultValue;
  }
  // K8s injects service-discovery env vars like API_PORT=tcp://10.x.x.x:3000
  // for services named "api". Fall back to default for non-numeric values.
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return parsed;
}

function ensureNodeEnv(env: EnvMap): string {
  const value = ensureString(env, 'NODE_ENV');
  if (!NODE_ENVS.includes(value as (typeof NODE_ENVS)[number])) {
    throw new Error(
      `Environment variable NODE_ENV must be one of: ${NODE_ENVS.join(', ')}.`,
    );
  }
  return value;
}

export function validateEnv(config: EnvMap): EnvMap {
  const normalized = { ...config };

  normalized.NODE_ENV = ensureNodeEnv(normalized);
  normalized.API_PORT = String(
    ensureIntegerWithDefault(normalized, 'API_PORT', 3000),
  );
  normalized.REDIS_PORT = String(
    ensureIntegerWithDefault(normalized, 'REDIS_PORT', 6379),
  );

  ensureString(normalized, 'APP_URL');
  ensureString(normalized, 'DATABASE_URL');
  ensureString(normalized, 'REDIS_URL');
  ensureString(normalized, 'JWT_SECRET');
  ensureString(normalized, 'GOOGLE_CLIENT_ID');
  ensureString(normalized, 'GOOGLE_CLIENT_SECRET');
  ensureString(normalized, 'GOOGLE_CALLBACK_URL');
  normalized.GCP_GCS_PROJECT_ID = ensureString(
    normalized,
    'GCP_GCS_PROJECT_ID',
  );
  normalized.GCP_GCS_CREDENTIALS = ensureString(
    normalized,
    'GCP_GCS_CREDENTIALS',
  );
  normalized.GCP_GCS_BUCKET = String(normalized.GCP_GCS_BUCKET ?? '');
  normalized.DEFAULT_MONTHLY_BUDGET = String(
    ensureIntegerWithDefault(normalized, 'DEFAULT_MONTHLY_BUDGET', 1000),
  );
  normalized.DEFAULT_MIN_POINTS = String(
    ensureIntegerWithDefault(normalized, 'DEFAULT_MIN_POINTS', 1),
  );
  normalized.DEFAULT_MAX_POINTS = String(
    ensureIntegerWithDefault(normalized, 'DEFAULT_MAX_POINTS', 100),
  );
  ensureString(normalized, 'GEMINI_API_KEYS');
  normalized.RESEND_TOKEN = String(normalized.RESEND_TOKEN ?? '');
  normalized.ADMIN_EMAIL = String(normalized.ADMIN_EMAIL ?? '');
  normalized.EMAIL_SKIP_DOMAINS = String(normalized.EMAIL_SKIP_DOMAINS ?? '');

  normalized.JWT_ACCESS_EXPIRY = String(normalized.JWT_ACCESS_EXPIRY ?? '15m');
  normalized.JWT_REFRESH_EXPIRY = String(normalized.JWT_REFRESH_EXPIRY ?? '7d');
  normalized.AUTH_ALLOW_DEV_TOKEN_ISSUE = String(
    normalized.AUTH_ALLOW_DEV_TOKEN_ISSUE ??
      normalized.NODE_ENV !== 'production',
  );

  return normalized;
}

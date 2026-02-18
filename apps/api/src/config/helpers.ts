function missingEnvMessage(key: string): string {
  return `Missing required environment variable: ${key}. Please set it in your .env file.`;
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(missingEnvMessage(key));
  }
  return value;
}

export function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function getEnvOptional(key: string): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export function getEnvInt(key: string, fallback: number): number {
  const rawValue = process.env[key];
  if (!rawValue) {
    return fallback;
  }

  // K8s injects service-discovery env vars like API_PORT=tcp://10.x.x.x:3000
  // for services named "api". Fall back to default for non-numeric values.
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

export function getEnvBoolean(key: string, fallback: boolean): boolean {
  const rawValue = process.env[key];
  if (!rawValue) {
    return fallback;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${key} must be "true" or "false".`);
}

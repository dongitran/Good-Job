/**
 * Helper function to require environment variables
 * Throws error if variable is not set
 */
export function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. Please set it in your .env file.`,
    );
  }
  return value || defaultValue!;
}

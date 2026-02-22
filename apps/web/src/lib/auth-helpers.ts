import { api } from './api';

/**
 * Safely narrow an unknown role value to one of the valid user roles.
 * Defaults to `'member'` for any unrecognised input.
 */
export function roleFromUnknown(input: unknown): 'member' | 'admin' | 'owner' {
  if (input === 'owner' || input === 'admin' || input === 'member') {
    return input;
  }
  return 'member';
}

/**
 * Derive a human-readable display name from an email address.
 * Splits the local-part on `.`, `_`, and `-`, capitalises each word.
 *
 * @example nameFromEmail('jane.doe@acme.com') → 'Jane Doe'
 */
export function nameFromEmail(email: string): string {
  const [local = 'User'] = email.split('@');
  return local
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * User shape that matches the Zustand auth store's `User` interface.
 * Kept here so callers don't need to import from the store directly.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin' | 'owner';
  orgId: string;
  avatarUrl?: string;
  onboardingCompletedAt?: string | null;
}

/**
 * Fetch `/auth/me` and map the server response to an `AuthUser` object.
 * Throws if the response doesn't contain an email address.
 */
export async function fetchAndMapAuthUser(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me');
  const email = String(data?.email ?? '');
  if (!email) {
    throw new Error('Authenticated user payload is missing email.');
  }

  return {
    id: String(data?.sub ?? crypto.randomUUID()),
    email,
    fullName: String(data?.fullName ?? nameFromEmail(email)),
    role: roleFromUnknown(data?.role),
    orgId: data?.orgId ? String(data.orgId) : '',
    avatarUrl: data?.avatarUrl ? String(data.avatarUrl) : undefined,
    onboardingCompletedAt: data?.onboardingCompletedAt ?? null,
  };
}

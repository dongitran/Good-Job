export interface OAuthUser {
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider: 'google';
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

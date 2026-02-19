import { UserRole } from '../../../database/entities';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  orgId?: string;
  onboardingCompletedAt?: string | null;
}

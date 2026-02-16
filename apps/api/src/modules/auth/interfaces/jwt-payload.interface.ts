import { UserRole } from '../../../database/entities';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  orgId?: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Department } from './department.entity';
import { UserRole } from './user.entity';

/**
 * Invitations - Team member invitations
 *
 * Sent during onboarding (step 4) or from Admin panel
 * Invitee clicks link → creates organization_membership record
 * Tokens expire after 7 days
 *
 * Acceptance Flow:
 * 1. User accepts invitation (clicks link with token)
 * 2. If user exists: Create organization_membership
 * 3. If new user: Create user + create organization_membership
 * 4. Set invitation.accepted_at = NOW()
 *
 * Creates membership with:
 * - user_id: From invitation acceptor
 * - org_id: invitation.org_id
 * - role: invitation.role
 * - department_id: invitation.department_id
 * - joined_at: NOW()
 */
@Entity('invitations')
@Unique('idx_invitation_org_email', ['orgId', 'email'])
@Index('idx_invitation_token', ['token'], { unique: true })
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  email: string; // Lowercase, normalized

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole; // member | admin (not owner - only one owner per org)

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Column({ name: 'invited_by' })
  invitedBy: string; // User ID of inviter

  @Column()
  token: string; // Random UUID for accept link

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date; // 7 days from creation

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt: Date; // NULL = pending, timestamp = accepted

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}

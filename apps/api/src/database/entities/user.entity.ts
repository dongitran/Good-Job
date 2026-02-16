import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  department: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}

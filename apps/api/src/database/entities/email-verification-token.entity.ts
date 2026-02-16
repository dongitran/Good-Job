import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Email Verification Tokens
 *
 * Used to verify user email addresses during signup
 * Tokens expire after 24 hours
 * OAuth users skip this (email already verified by provider)
 */
@Entity('email_verification_tokens')
@Index('idx_email_verification_token', ['token'], { unique: true })
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  token: string; // Random UUID sent via email

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date; // 24 hours from creation

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

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
 * Password Reset Tokens
 *
 * Used for "Forgot Password" flow
 * Tokens expire after 1 hour (short window for security)
 * Tokens are single-use (used_at prevents reuse)
 */
@Entity('password_reset_tokens')
@Index('idx_password_reset_token', ['token'], { unique: true })
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  token: string; // Random UUID sent via email

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date; // 1 hour from creation

  @Column({ type: 'timestamptz', name: 'used_at', nullable: true })
  usedAt: Date; // NULL = unused, timestamp = used

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

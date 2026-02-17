import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { encryptedColumn } from '../../common/transformers/encrypted-column.transformer';

export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

/**
 * OAuth Connections - Links users to external OAuth providers
 *
 * Supports multiple OAuth providers per user (Google AND Microsoft)
 * Stores encrypted access/refresh tokens for API calls
 * One user can have one connection per provider
 */
@Entity('oauth_connections')
@Unique('idx_oauth_user_provider', ['userId', 'provider'])
@Index('idx_oauth_provider_user', ['providerUserId'], { unique: true })
export class OAuthConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider: OAuthProvider;

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @Column({ type: 'text', name: 'access_token', transformer: encryptedColumn })
  accessToken: string;

  @Column({
    type: 'text',
    name: 'refresh_token',
    nullable: true,
    transformer: encryptedColumn,
  })
  refreshToken: string;

  @Column({ type: 'timestamptz', name: 'token_expires_at' })
  tokenExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

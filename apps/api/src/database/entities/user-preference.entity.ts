import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Per-user preferences — one row per user, created lazily on first update.
 *
 * Stores:
 * - Theme preference (light/dark/system)
 * - Email notification toggles (JSONB)
 *
 * Row is created on first GET (default values applied) or on first PATCH.
 */
export interface NotificationPreferences {
  kudosReceived: boolean;
  weeklyDigest: boolean;
  redemptionStatus: boolean;
  newAnnouncements: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  kudosReceived: true,
  weeklyDigest: true,
  redemptionStatus: true,
  newAnnouncements: false,
};

export enum ThemePreference {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: ThemePreference,
    default: ThemePreference.SYSTEM,
  })
  theme: ThemePreference;

  @Column({
    name: 'notification_settings',
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES),
  })
  notificationSettings: NotificationPreferences;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

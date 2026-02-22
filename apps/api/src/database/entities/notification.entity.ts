import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * In-app notification record.
 *
 * One row per notification per user. Notifications are ephemeral (no soft-delete)
 * and should be cleaned up after 90 days.
 *
 * Created server-side when events occur:
 * - Kudos received → type 'kudos_received'
 * - Redemption status change → type 'redemption_status'
 * - System/admin announcements → type 'announcement'
 */
export enum NotificationType {
  KUDOS_RECEIVED = 'kudos_received',
  REDEMPTION_STATUS = 'redemption_status',
  POINTS_RECEIVED = 'points_received',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index('idx_notifications_user_unread', ['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'reference_type', type: 'varchar', nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

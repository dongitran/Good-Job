import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationType } from '../../database/entities';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../../common/cache';
import {
  CacheEvents,
  NotificationPayload,
} from '../../common/events/cache-events';

export interface CreateNotificationDto {
  orgId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new notification for a user.
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.repo.create(dto);
    const saved = await this.repo.save(notif);
    this.logger.log(`Notification created: ${dto.type} for user ${dto.userId}`);

    this.eventEmitter.emit(CacheEvents.NOTIFICATION_CREATED, {
      userId: dto.userId,
    } satisfies NotificationPayload);

    return saved;
  }

  /**
   * List notifications for a user (newest first), with pagination.
   */
  async list(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  /**
   * Get unread notification count for bell badge.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.cache.getOrSet(
      CACHE_KEYS.notificationUnread(userId),
      CACHE_TTL.NOTIFICATION_UNREAD,
      () => this.repo.count({ where: { userId, isRead: false } }),
    );
  }

  /**
   * Mark a single notification as read.
   */
  async markRead(userId: string, notificationId: string): Promise<void> {
    const notif = await this.repo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notif) throw new NotFoundException('Notification not found.');

    if (!notif.isRead) {
      notif.isRead = true;
      notif.readAt = new Date();
      await this.repo.save(notif);

      this.eventEmitter.emit(CacheEvents.NOTIFICATION_READ, {
        userId,
      } satisfies NotificationPayload);
    }
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllRead(userId: string): Promise<void> {
    await this.repo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    this.eventEmitter.emit(CacheEvents.NOTIFICATION_READ, {
      userId,
    } satisfies NotificationPayload);
  }
}

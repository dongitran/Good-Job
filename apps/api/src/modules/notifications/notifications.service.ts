import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities';

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
  ) {}

  /**
   * Create a new notification for a user.
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.repo.create(dto);
    const saved = await this.repo.save(notif);
    this.logger.log(`Notification created: ${dto.type} for user ${dto.userId}`);
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
    return this.repo.count({ where: { userId, isRead: false } });
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
  }
}

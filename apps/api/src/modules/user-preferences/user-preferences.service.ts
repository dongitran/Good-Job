import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationPreferences,
  Organization,
  UserPreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../database/entities';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly repo: Repository<UserPreference>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  /**
   * Get preferences for user. Lazily creates default row if none exists.
   */
  async get(userId: string, orgId?: string): Promise<UserPreference> {
    let prefs = await this.repo.findOne({ where: { userId } });

    if (!prefs) {
      const notificationDefaults =
        await this.resolveNotificationDefaultsForOrganization(orgId);
      prefs = await this.repo.save(
        this.repo.create({
          userId,
          notificationSettings: notificationDefaults,
        }),
      );
    }

    return prefs;
  }

  /**
   * Partial-update preferences. Merges notification settings with existing values.
   */
  async update(
    userId: string,
    dto: UpdatePreferencesDto,
    orgId?: string,
  ): Promise<UserPreference> {
    const prefs = await this.get(userId, orgId);

    if (dto.theme !== undefined) {
      prefs.theme = dto.theme;
    }

    if (dto.notificationSettings) {
      // class-transformer sets missing optional DTO properties to undefined.
      // Filter them out so only explicitly provided values overwrite existing ones.
      const explicit = Object.fromEntries(
        Object.entries(dto.notificationSettings).filter(
          ([, v]) => v !== undefined,
        ),
      );
      prefs.notificationSettings = {
        ...prefs.notificationSettings,
        ...explicit,
      };
    }

    return this.repo.save(prefs);
  }

  private async resolveNotificationDefaultsForOrganization(
    orgId?: string,
  ): Promise<NotificationPreferences> {
    if (!orgId) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: ['id', 'settings'],
    });
    const orgNotifications = org?.settings?.notifications;

    return {
      kudosReceived:
        orgNotifications?.pushNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.kudosReceived,
      weeklyDigest:
        orgNotifications?.emailDigest ??
        DEFAULT_NOTIFICATION_PREFERENCES.weeklyDigest,
      redemptionStatus: DEFAULT_NOTIFICATION_PREFERENCES.redemptionStatus,
      newAnnouncements:
        orgNotifications?.monthlyLeaderboard ??
        DEFAULT_NOTIFICATION_PREFERENCES.newAnnouncements,
    };
  }
}

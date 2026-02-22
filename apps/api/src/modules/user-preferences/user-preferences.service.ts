import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserPreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../database/entities';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly repo: Repository<UserPreference>,
  ) {}

  /**
   * Get preferences for user. Lazily creates default row if none exists.
   */
  async get(userId: string): Promise<UserPreference> {
    let prefs = await this.repo.findOne({ where: { userId } });

    if (!prefs) {
      prefs = await this.repo.save(
        this.repo.create({
          userId,
          notificationSettings: { ...DEFAULT_NOTIFICATION_PREFERENCES },
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
  ): Promise<UserPreference> {
    const prefs = await this.get(userId);

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
}

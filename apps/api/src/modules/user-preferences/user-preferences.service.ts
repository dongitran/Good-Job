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
      prefs.notificationSettings = {
        ...prefs.notificationSettings,
        ...dto.notificationSettings,
      };
    }

    return this.repo.save(prefs);
  }
}

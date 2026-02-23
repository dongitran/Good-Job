import { ConfigService } from '@nestjs/config';
import { OrganizationSettings } from '../database/entities';

export function getDefaultOrganizationSettings(
  config: Pick<ConfigService, 'get'>,
): OrganizationSettings {
  return {
    points: {
      minPerKudo: config.get<number>('points.minPoints', 1),
      maxPerKudo: config.get<number>('points.maxPoints', 100),
      valueInCurrency: 1000,
      currency: 'VND',
    },
    budget: {
      monthlyGivingBudget: config.get<number>(
        'points.defaultMonthlyBudget',
        1000,
      ),
      resetDay: 1,
      allowRollover: false,
      managerBonusEnabled: false,
      managerBonusAmount: 100,
    },
    notifications: {
      emailDigest: true,
      pushNotifications: true,
      slackPosts: true,
      monthlyLeaderboard: false,
    },
  };
}

export function mergeOrganizationSettings(
  base: OrganizationSettings,
  override?: OrganizationSettings | null,
): OrganizationSettings {
  return {
    ...base,
    ...override,
    points: { ...(base.points ?? {}), ...(override?.points ?? {}) },
    budget: { ...(base.budget ?? {}), ...(override?.budget ?? {}) },
    notifications: {
      ...(base.notifications ?? {}),
      ...(override?.notifications ?? {}),
    },
  };
}

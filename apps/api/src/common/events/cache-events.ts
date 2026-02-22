export const CacheEvents = {
  KUDOS_CREATED: 'cache.kudos.created',
  REWARD_REDEEMED: 'cache.reward.redeemed',
  REDEMPTION_STATUS_CHANGED: 'cache.redemption.status_changed',
  ORG_UPDATED: 'cache.org.updated',
  NOTIFICATION_CREATED: 'cache.notification.created',
  NOTIFICATION_READ: 'cache.notification.read',
} as const;

export interface KudosCreatedPayload {
  orgId: string;
  giverId: string;
  receiverId: string;
}

export interface RewardRedeemedPayload {
  orgId: string;
  userId: string;
  rewardId: string;
}

export interface RedemptionStatusChangedPayload {
  orgId: string;
  userId: string;
  rewardId: string;
}

export interface OrgUpdatedPayload {
  orgId: string;
}

export interface NotificationPayload {
  userId: string;
}

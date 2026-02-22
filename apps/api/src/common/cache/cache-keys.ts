export const CACHE_KEYS = {
  adminAnalytics: (orgId: string, days: number) =>
    `cache:admin:analytics:${orgId}:${days}`,
  adminUsers: (orgId: string) => `cache:admin:users:${orgId}`,
  pointsBalance: (userId: string, orgId: string) =>
    `cache:points:balance:${userId}:${orgId}`,
  userProfile: (userId: string, orgId: string) =>
    `cache:users:profile:${userId}:${orgId}`,
  notificationUnread: (userId: string) =>
    `cache:notifications:unread:${userId}`,
  feedPage: (orgId: string, page: number, limit: number, valueId?: string) =>
    `cache:feed:${orgId}:${page}:${limit}:${valueId ?? 'all'}`,
  orgData: (orgId: string) => `cache:org:data:${orgId}`,
  tokenBlacklist: (jti: string) => `blacklist:token:${jti}`,

  patterns: {
    adminAnalytics: (orgId: string) => `cache:admin:analytics:${orgId}:*`,
    pointsBalance: (userId: string) => `cache:points:balance:${userId}:*`,
    userProfile: (userId: string) => `cache:users:profile:${userId}:*`,
    feedAll: (orgId: string) => `cache:feed:${orgId}:*`,
  },
} as const;

export const CACHE_TTL = {
  ADMIN_ANALYTICS: 600,
  ADMIN_USERS: 900,
  POINTS_BALANCE: 60,
  USER_PROFILE: 180,
  NOTIFICATION_UNREAD: 30,
  FEED_PAGE: 30,
  ORG_DATA: 300,
} as const;

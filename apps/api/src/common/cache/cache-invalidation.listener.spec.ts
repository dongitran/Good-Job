import { CacheInvalidationListener } from './cache-invalidation.listener';
import { CacheService } from './cache.service';
import { CACHE_KEYS } from './cache-keys';

describe('CacheInvalidationListener', () => {
  let listener: CacheInvalidationListener;
  let mockCache: jest.Mocked<Pick<CacheService, 'del' | 'delByPattern'>>;

  beforeEach(() => {
    mockCache = {
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(0),
    };
    listener = new CacheInvalidationListener(
      mockCache as unknown as CacheService,
    );
  });

  describe('onKudosCreated', () => {
    it('should invalidate analytics, feed, profiles, balances, admin users, and notification caches', async () => {
      await listener.onKudosCreated({
        orgId: 'org1',
        giverId: 'giver1',
        receiverId: 'receiver1',
      });

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.adminAnalytics('org1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.feedAll('org1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.userProfile('giver1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.userProfile('receiver1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.pointsBalance('giver1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.pointsBalance('receiver1'),
      );
      expect(mockCache.del).toHaveBeenCalledWith(CACHE_KEYS.adminUsers('org1'));
      expect(mockCache.del).toHaveBeenCalledWith(
        CACHE_KEYS.notificationUnread('receiver1'),
      );
    });
  });

  describe('onRewardRedeemed', () => {
    it('should invalidate profile, balance, and analytics caches', async () => {
      await listener.onRewardRedeemed({
        orgId: 'org1',
        userId: 'user1',
        rewardId: 'reward1',
      });

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.userProfile('user1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.pointsBalance('user1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.adminAnalytics('org1'),
      );
    });
  });

  describe('onRedemptionStatusChanged', () => {
    it('should invalidate profile and balance caches', async () => {
      await listener.onRedemptionStatusChanged({
        orgId: 'org1',
        userId: 'user1',
        rewardId: 'reward1',
      });

      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.userProfile('user1'),
      );
      expect(mockCache.delByPattern).toHaveBeenCalledWith(
        CACHE_KEYS.patterns.pointsBalance('user1'),
      );
    });
  });

  describe('onOrgUpdated', () => {
    it('should invalidate org data cache', async () => {
      await listener.onOrgUpdated({ orgId: 'org1' });

      expect(mockCache.del).toHaveBeenCalledWith(CACHE_KEYS.orgData('org1'));
    });
  });

  describe('onNotificationChange', () => {
    it('should invalidate notification unread cache', async () => {
      await listener.onNotificationChange({ userId: 'user1' });

      expect(mockCache.del).toHaveBeenCalledWith(
        CACHE_KEYS.notificationUnread('user1'),
      );
    });
  });
});

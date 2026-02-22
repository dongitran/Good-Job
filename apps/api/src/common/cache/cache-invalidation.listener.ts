import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from './cache.service';
import { CACHE_KEYS } from './cache-keys';
import {
  CacheEvents,
  KudosCreatedPayload,
  RewardRedeemedPayload,
  RedemptionStatusChangedPayload,
  OrgUpdatedPayload,
  NotificationPayload,
} from '../events/cache-events';

@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(private readonly cache: CacheService) {}

  @OnEvent(CacheEvents.KUDOS_CREATED)
  async onKudosCreated(payload: KudosCreatedPayload): Promise<void> {
    this.logger.debug(`Invalidating caches for kudos in org ${payload.orgId}`);
    await Promise.all([
      this.cache.delByPattern(
        CACHE_KEYS.patterns.adminAnalytics(payload.orgId),
      ),
      this.cache.delByPattern(CACHE_KEYS.patterns.feedAll(payload.orgId)),
      this.cache.delByPattern(CACHE_KEYS.patterns.userProfile(payload.giverId)),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.userProfile(payload.receiverId),
      ),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.pointsBalance(payload.giverId),
      ),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.pointsBalance(payload.receiverId),
      ),
      this.cache.del(CACHE_KEYS.adminUsers(payload.orgId)),
      this.cache.del(CACHE_KEYS.notificationUnread(payload.receiverId)),
    ]);
  }

  @OnEvent(CacheEvents.REWARD_REDEEMED)
  async onRewardRedeemed(payload: RewardRedeemedPayload): Promise<void> {
    this.logger.debug(
      `Invalidating caches for reward redeemed by ${payload.userId}`,
    );
    await Promise.all([
      this.cache.delByPattern(CACHE_KEYS.patterns.userProfile(payload.userId)),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.pointsBalance(payload.userId),
      ),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.adminAnalytics(payload.orgId),
      ),
    ]);
  }

  @OnEvent(CacheEvents.REDEMPTION_STATUS_CHANGED)
  async onRedemptionStatusChanged(
    payload: RedemptionStatusChangedPayload,
  ): Promise<void> {
    this.logger.debug(
      `Invalidating caches for redemption status change of ${payload.userId}`,
    );
    await Promise.all([
      this.cache.delByPattern(CACHE_KEYS.patterns.userProfile(payload.userId)),
      this.cache.delByPattern(
        CACHE_KEYS.patterns.pointsBalance(payload.userId),
      ),
    ]);
  }

  @OnEvent(CacheEvents.ORG_UPDATED)
  async onOrgUpdated(payload: OrgUpdatedPayload): Promise<void> {
    this.logger.debug(`Invalidating org cache for ${payload.orgId}`);
    await this.cache.del(CACHE_KEYS.orgData(payload.orgId));
  }

  @OnEvent(CacheEvents.NOTIFICATION_CREATED)
  @OnEvent(CacheEvents.NOTIFICATION_READ)
  async onNotificationChange(payload: NotificationPayload): Promise<void> {
    await this.cache.del(CACHE_KEYS.notificationUnread(payload.userId));
  }
}

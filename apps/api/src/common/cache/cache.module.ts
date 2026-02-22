import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInvalidationListener } from './cache-invalidation.listener';
import { TokenBlacklistService } from './token-blacklist.service';

@Global()
@Module({
  providers: [CacheService, CacheInvalidationListener, TokenBlacklistService],
  exports: [CacheService, TokenBlacklistService],
})
export class CacheModule {}

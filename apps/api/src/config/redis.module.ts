import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisLifecycle } from './redis.lifecycle';
import { REDIS_CLIENT } from './redis.constants';

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const url = configService.getOrThrow<string>('redis.url');
        const redis = new Redis(url, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        redis.on('connect', () => {
          logger.log('Redis connected');
        });

        redis.on('error', (err) => {
          logger.error(`Redis error: ${err.message}`);
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisLifecycle,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

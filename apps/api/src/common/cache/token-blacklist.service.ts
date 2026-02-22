import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.constants';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async blacklist(jti: string, expiresAt: number): Promise<void> {
    const ttl = Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);
    if (ttl > 0) {
      await this.redis.set(`blacklist:token:${jti}`, '1', 'EX', ttl);
    }
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:token:${jti}`);
    return result !== null;
  }
}

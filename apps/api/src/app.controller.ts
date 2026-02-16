import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Public } from './common/decorators/public.decorator';
import { REDIS_CLIENT } from './config/redis.constants';

@Controller()
export class AppController {
  constructor(
    @Optional() private readonly dataSource?: DataSource,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  @Public()
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Good Job API',
    };
  }

  @Public()
  @Get('ready')
  async readinessCheck() {
    const checks = {
      database: this.dataSource ? 'unknown' : 'skipped',
      redis: this.redis ? 'unknown' : 'skipped',
    };

    if (this.dataSource) {
      try {
        await this.dataSource.query('SELECT 1');
        checks.database = 'up';
      } catch {
        checks.database = 'down';
      }
    }

    if (this.redis) {
      try {
        const pingResult = await this.redis.ping();
        checks.redis = pingResult === 'PONG' ? 'up' : 'down';
      } catch {
        checks.redis = 'down';
      }
    }

    const isReady = !Object.values(checks).includes('down');

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

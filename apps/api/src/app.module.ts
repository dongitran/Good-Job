import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'node:path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  dbConfig,
  redisConfig,
  jwtConfig,
  googleConfig,
  pointsConfig,
  geminiConfig,
  typeormConfig,
} from './config';
import { validateEnv } from './config/env.validation';
import { RedisModule } from './config/redis.module';
import { REDIS_CLIENT } from './config/redis.constants';
import { CacheModule } from './common/cache';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PointsModule } from './modules/points/points.module';
import { KudosModule } from './modules/kudos/kudos.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { FeedModule } from './modules/feed/feed.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OrgContextGuard } from './common/guards/org-context.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../.env'),
      cache: true,
      validate: validateEnv,
      load: [
        appConfig,
        dbConfig,
        redisConfig,
        jwtConfig,
        googleConfig,
        pointsConfig,
        geminiConfig,
        typeormConfig,
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),

    RedisModule,

    CacheModule,

    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (config: ConfigService, redis: Redis) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),

    EventEmitterModule.forRoot(),

    ScheduleModule.forRoot(),

    AuthModule,

    UsersModule,

    OrganizationsModule,

    PointsModule,

    KudosModule,

    RewardsModule,

    FeedModule,

    AdminModule,

    AiModule,

    NotificationsModule,

    UserPreferencesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OrgContextGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}

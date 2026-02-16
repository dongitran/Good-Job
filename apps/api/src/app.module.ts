import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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
} from './config/app.config';
import { RedisModule } from './config/redis.module';
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

@Module({
  imports: [
    // Environment - Load all configs
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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

    // Database - Use typeorm config
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),

    // Redis - Global module
    RedisModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Event bus
    EventEmitterModule.forRoot(),

    // CRON scheduler
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

    // Feature modules (to be added)
    // AuthModule,
    // UsersModule,
    // OrganizationsModule,
    // KudosModule,
    // RewardsModule,
    // PointsModule,
    // FeedModule,
    // AdminModule,
    // AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

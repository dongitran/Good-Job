import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OrgContextGuard } from './common/guards/org-context.guard';
import { AuthEmailIpThrottlerGuard } from './common/guards/auth-email-ip-throttler.guard';

@Injectable()
class NoopThrottlerGuard extends ThrottlerGuard {
  async canActivate(): Promise<boolean> {
    return true;
  }
}
import {
  appConfig,
  dbConfig,
  typeormConfig,
  googleConfig,
  jwtConfig,
  redisConfig,
} from './config';
import { RedisModule } from './config/redis.module';
import { CacheModule } from './common/cache';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [
        appConfig,
        dbConfig,
        typeormConfig,
        jwtConfig,
        googleConfig,
        redisConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    RedisModule,
    CacheModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: NoopThrottlerGuard,
    },
    { provide: AuthEmailIpThrottlerGuard, useClass: NoopThrottlerGuard },
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
export class AppE2eModule {}

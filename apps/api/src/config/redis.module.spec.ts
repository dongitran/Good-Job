const redisConstructorSpy = jest.fn();

type RedisEventHandler = (payload?: unknown) => void;

type MockRedisClient = {
  on: jest.MockedFunction<
    (event: string, cb: RedisEventHandler) => MockRedisClient
  >;
  handlers: Record<string, RedisEventHandler>;
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((url: unknown, opts?: unknown) => {
    const handlers: Record<string, RedisEventHandler> = {};
    const instance: MockRedisClient = {
      on: jest.fn((event: string, cb: RedisEventHandler): MockRedisClient => {
        handlers[event] = cb;
        return instance;
      }),
      handlers,
    };
    redisConstructorSpy(url, opts, instance);
    return instance;
  }),
}));

import { REDIS_CLIENT } from './redis.constants';
import { RedisModule } from './redis.module';
import { Logger } from '@nestjs/common';

describe('RedisModule', () => {
  it('builds redis client from config and registers handlers', () => {
    const providers = Reflect.getMetadata('providers', RedisModule) as Array<{
      provide?: string;
      useFactory?: (configService: {
        getOrThrow: (key: string) => unknown;
      }) => {
        on: jest.Mock;
        handlers: Record<string, RedisEventHandler>;
      };
    }>;

    const redisProvider = providers.find(
      (provider) => provider.provide === REDIS_CLIENT,
    );
    expect(redisProvider).toBeDefined();

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'redis.url') return 'redis://:pwd@localhost:6379';
        return undefined;
      }),
    };

    const redis = redisProvider!.useFactory!(configService);
    const [url, options] = redisConstructorSpy.mock.calls[0];

    expect(url).toBe('redis://:pwd@localhost:6379');
    expect(
      typeof (options as { retryStrategy: (times: number) => number })
        .retryStrategy,
    ).toBe('function');
    expect(
      (options as { retryStrategy: (times: number) => number }).retryStrategy(
        1,
      ),
    ).toBe(50);
    expect(
      (options as { retryStrategy: (times: number) => number }).retryStrategy(
        100,
      ),
    ).toBe(2000);

    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    redis.handlers.connect();
    redis.handlers.error?.(new Error('redis fail'));
    expect(logSpy).toHaveBeenCalledWith('Redis connected');
    expect(errorSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

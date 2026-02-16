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
  default: jest.fn().mockImplementation((options: unknown) => {
    const handlers: Record<string, RedisEventHandler> = {};
    const instance: MockRedisClient = {
      on: jest.fn((event: string, cb: RedisEventHandler): MockRedisClient => {
        handlers[event] = cb;
        return instance;
      }),
      handlers,
    };
    redisConstructorSpy(options, instance);
    return instance;
  }),
}));

import { REDIS_CLIENT } from './redis.constants';
import { RedisModule } from './redis.module';

describe('RedisModule', () => {
  it('builds redis client from config and registers handlers', () => {
    const providers = Reflect.getMetadata('providers', RedisModule) as Array<{
      provide?: string;
      useFactory?: (configService: { get: (key: string) => unknown }) => {
        on: jest.Mock;
        handlers: Record<string, RedisEventHandler>;
      };
    }>;

    const redisProvider = providers.find(
      (provider) => provider.provide === REDIS_CLIENT,
    );
    expect(redisProvider).toBeDefined();

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'redis.host') return 'localhost';
        if (key === 'redis.port') return 6379;
        if (key === 'redis.password') return 'pwd';
        return undefined;
      }),
    };

    const redis = redisProvider!.useFactory!(configService);
    const [options] = redisConstructorSpy.mock.calls[0];

    expect(options).toMatchObject({
      host: 'localhost',
      port: 6379,
      password: 'pwd',
    });
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

    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    redis.handlers.connect();
    redis.handlers.error?.(new Error('redis fail'));
    expect(logSpy).toHaveBeenCalledWith('✅ Redis connected');
    expect(errorSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

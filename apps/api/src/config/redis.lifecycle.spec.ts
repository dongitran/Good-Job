import Redis from 'ioredis';
import { RedisLifecycle } from './redis.lifecycle';

describe('RedisLifecycle', () => {
  it('skips shutdown when redis is already ended', async () => {
    const redis = {
      status: 'end',
      quit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const lifecycle = new RedisLifecycle(redis);

    await lifecycle.onApplicationShutdown();

    expect((redis as never as { quit: jest.Mock }).quit).not.toHaveBeenCalled();
    expect(
      (redis as never as { disconnect: jest.Mock }).disconnect,
    ).not.toHaveBeenCalled();
  });

  it('quits redis gracefully when possible', async () => {
    const redis = {
      status: 'ready',
      quit: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const lifecycle = new RedisLifecycle(redis);

    await lifecycle.onApplicationShutdown();

    expect((redis as never as { quit: jest.Mock }).quit).toHaveBeenCalled();
    expect(
      (redis as never as { disconnect: jest.Mock }).disconnect,
    ).not.toHaveBeenCalled();
  });

  it('falls back to disconnect when quit fails', async () => {
    const redis = {
      status: 'ready',
      quit: jest.fn().mockRejectedValue(new Error('quit failed')),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const lifecycle = new RedisLifecycle(redis);

    await lifecycle.onApplicationShutdown();

    expect((redis as never as { quit: jest.Mock }).quit).toHaveBeenCalled();
    expect(
      (redis as never as { disconnect: jest.Mock }).disconnect,
    ).toHaveBeenCalled();
  });
});

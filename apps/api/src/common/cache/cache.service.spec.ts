import { CacheService } from './cache.service';
import Redis from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: Partial<Record<keyof Redis, jest.Mock>>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
    };
    service = new CacheService(mockRedis as unknown as Redis);
  });

  describe('get', () => {
    it('should return parsed JSON on cache hit', async () => {
      mockRedis.get!.mockResolvedValue('{"foo":"bar"}');
      const result = await service.get<{ foo: string }>('key1');
      expect(result).toEqual({ foo: 'bar' });
      expect(mockRedis.get).toHaveBeenCalledWith('key1');
    });

    it('should return null on cache miss', async () => {
      mockRedis.get!.mockResolvedValue(null);
      const result = await service.get('key1');
      expect(result).toBeNull();
    });

    it('should return null and log warning on parse error', async () => {
      mockRedis.get!.mockResolvedValue('not-json');
      const result = await service.get('key1');
      expect(result).toBeNull();
    });

    it('should return null on Redis error', async () => {
      mockRedis.get!.mockRejectedValue(new Error('connection lost'));
      const result = await service.get('key1');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should serialize and store with TTL', async () => {
      mockRedis.set!.mockResolvedValue('OK');
      await service.set('key1', { foo: 'bar' }, 60);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'key1',
        '{"foo":"bar"}',
        'EX',
        60,
      );
    });

    it('should not throw on Redis error', async () => {
      mockRedis.set!.mockRejectedValue(new Error('connection lost'));
      await expect(service.set('key1', 'val', 60)).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      mockRedis.del!.mockResolvedValue(1);
      await service.del('key1');
      expect(mockRedis.del).toHaveBeenCalledWith('key1');
    });

    it('should not throw on Redis error', async () => {
      mockRedis.del!.mockRejectedValue(new Error('connection lost'));
      await expect(service.del('key1')).resolves.toBeUndefined();
    });
  });

  describe('delByPattern', () => {
    it('should scan and delete matching keys', async () => {
      mockRedis
        .scan!.mockResolvedValueOnce(['5', ['key:1', 'key:2']])
        .mockResolvedValueOnce(['0', ['key:3']]);
      mockRedis.del!.mockResolvedValue(1);

      const deleted = await service.delByPattern('key:*');

      expect(deleted).toBe(3);
      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('key:1', 'key:2');
      expect(mockRedis.del).toHaveBeenCalledWith('key:3');
    });

    it('should return 0 when no keys match', async () => {
      mockRedis.scan!.mockResolvedValue(['0', []]);
      const deleted = await service.delByPattern('nokeys:*');
      expect(deleted).toBe(0);
    });

    it('should return 0 on Redis error', async () => {
      mockRedis.scan!.mockRejectedValue(new Error('connection lost'));
      const deleted = await service.delByPattern('key:*');
      expect(deleted).toBe(0);
    });
  });

  describe('delMany', () => {
    it('should delete multiple keys', async () => {
      mockRedis.del!.mockResolvedValue(2);
      await service.delMany(['key1', 'key2']);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should skip when array is empty', async () => {
      await service.delMany([]);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value on hit', async () => {
      mockRedis.get!.mockResolvedValue('{"cached":true}');
      const factory = jest.fn();

      const result = await service.getOrSet('key1', 60, factory);

      expect(result).toEqual({ cached: true });
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache on miss', async () => {
      mockRedis.get!.mockResolvedValue(null);
      mockRedis.set!.mockResolvedValue('OK');
      const factory = jest.fn().mockResolvedValue({ fresh: true });

      const result = await service.getOrSet('key1', 60, factory);

      expect(result).toEqual({ fresh: true });
      expect(factory).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'key1',
        '{"fresh":true}',
        'EX',
        60,
      );
    });

    it('should call factory when Redis get fails (graceful degradation)', async () => {
      mockRedis.get!.mockRejectedValue(new Error('connection lost'));
      mockRedis.set!.mockResolvedValue('OK');
      const factory = jest.fn().mockResolvedValue({ fallback: true });

      const result = await service.getOrSet('key1', 60, factory);

      expect(result).toEqual({ fallback: true });
      expect(factory).toHaveBeenCalled();
    });
  });
});

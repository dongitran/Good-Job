import { TokenBlacklistService } from './token-blacklist.service';
import Redis from 'ioredis';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let mockRedis: Partial<Record<keyof Redis, jest.Mock>>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };
    service = new TokenBlacklistService(mockRedis as unknown as Redis);
  });

  describe('blacklist', () => {
    it('should store jti with remaining TTL', async () => {
      mockRedis.set!.mockResolvedValue('OK');
      const futureExp = Math.floor(Date.now() / 1000) + 300; // 5 min from now

      await service.blacklist('test-jti', futureExp);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'blacklist:token:test-jti',
        '1',
        'EX',
        expect.any(Number),
      );
      const ttl = mockRedis.set!.mock.calls[0][3] as unknown as number;
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('should not store when token already expired', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 10;

      await service.blacklist('expired-jti', pastExp);

      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('isBlacklisted', () => {
    it('should return true when jti is blacklisted', async () => {
      mockRedis.get!.mockResolvedValue('1');
      const result = await service.isBlacklisted('test-jti');
      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('blacklist:token:test-jti');
    });

    it('should return false when jti is not blacklisted', async () => {
      mockRedis.get!.mockResolvedValue(null);
      const result = await service.isBlacklisted('unknown-jti');
      expect(result).toBe(false);
    });
  });
});

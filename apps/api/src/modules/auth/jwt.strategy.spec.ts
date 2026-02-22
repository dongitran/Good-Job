import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../database/entities';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from '../../common/cache';

describe('JwtStrategy', () => {
  it('validates and returns payload when not blacklisted', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const tokenBlacklist = {
      isBlacklisted: jest.fn().mockResolvedValue(false),
    } as unknown as TokenBlacklistService;
    const strategy = new JwtStrategy(configService, tokenBlacklist);
    const payload = {
      jti: 'test-jti',
      sub: 'u-1',
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    };

    const result = await strategy.validate(payload);
    expect(result).toEqual(payload);
    expect(tokenBlacklist.isBlacklisted).toHaveBeenCalledWith('test-jti');
  });

  it('throws UnauthorizedException when token is blacklisted', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const tokenBlacklist = {
      isBlacklisted: jest.fn().mockResolvedValue(true),
    } as unknown as TokenBlacklistService;
    const strategy = new JwtStrategy(configService, tokenBlacklist);
    const payload = {
      jti: 'revoked-jti',
      sub: 'u-1',
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      'Token has been revoked.',
    );
  });

  it('skips blacklist check when no jti present', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const tokenBlacklist = {
      isBlacklisted: jest.fn(),
    } as unknown as TokenBlacklistService;
    const strategy = new JwtStrategy(configService, tokenBlacklist);
    const payload = {
      sub: 'u-1',
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    };

    const result = await strategy.validate(payload);
    expect(result).toEqual(payload);
    expect(tokenBlacklist.isBlacklisted).not.toHaveBeenCalled();
  });
});

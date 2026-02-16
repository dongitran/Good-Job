import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../database/entities';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('issues access token using payload and expiry config', async () => {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as JwtService;
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'jwt.accessExpiry') {
          return '15m';
        }
        if (key === 'jwt.allowDevTokenIssue') {
          return true;
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;
    const service = new AuthService(jwtService, configService);

    const result = await service.issueAccessToken({
      email: 'admin@goodjob.dev',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@goodjob.dev',
        role: UserRole.ADMIN,
      }),
      { expiresIn: '15m' },
    );
    expect(result).toEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
    });
  });

  it('blocks token issuance when disabled by config', async () => {
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'jwt.allowDevTokenIssue') {
          return false;
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;
    const service = new AuthService(jwtService, configService);

    await expect(
      service.issueAccessToken({
        email: 'member@goodjob.dev',
      }),
    ).rejects.toThrow('Token issuance endpoint is disabled');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});

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
      get: jest.fn().mockReturnValue('15m'),
    } as unknown as ConfigService;
    const service = new AuthService(jwtService, configService);

    const result = await service.issueAccessToken({
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'member@goodjob.dev',
        role: UserRole.MEMBER,
      }),
      { expiresIn: '15m' },
    );
    expect(result).toEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
    });
  });
});

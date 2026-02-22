import { UserRole } from '../../database/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from '../../common/cache';

describe('AuthController', () => {
  it('delegates token issuance to AuthService', async () => {
    const authService = {
      issueAccessToken: jest.fn().mockResolvedValue({
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: '15m',
      }),
    } as unknown as AuthService;
    const controller = new AuthController(
      authService,
      {} as TokenBlacklistService,
    );

    const result = await controller.issueToken({
      email: 'admin@goodjob.dev',
    });

    expect(authService.issueAccessToken).toHaveBeenCalledWith({
      email: 'admin@goodjob.dev',
    });
    expect(result.accessToken).toBe('token');
  });

  it('returns current user in me endpoint', () => {
    const controller = new AuthController(
      {} as AuthService,
      {} as TokenBlacklistService,
    );
    const user = {
      sub: 'u-1',
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    };

    expect(controller.me(user)).toEqual(user);
  });
});

import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../database/entities';
import { JwtStrategy } from './strategies/jwt.strategy';

describe('JwtStrategy', () => {
  it('validates and returns payload', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);
    const payload = {
      sub: 'u-1',
      email: 'member@goodjob.dev',
      role: UserRole.MEMBER,
    };

    expect(strategy.validate(payload)).toEqual(payload);
  });
});

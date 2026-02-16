import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { IS_PUBLIC_KEY, Public } from './public.decorator';
import { ROLES_KEY, Roles } from './roles.decorator';
import { UserRole } from '../../database/entities';

describe('decorators', () => {
  it('sets public metadata', () => {
    class TestClass {
      // noop
      handler() {}
    }
    const descriptor = Object.getOwnPropertyDescriptor(
      TestClass.prototype,
      'handler',
    );
    Public()(TestClass.prototype.handler);

    expect(Public).toBeDefined();
    expect(IS_PUBLIC_KEY).toBe('isPublic');
    expect(descriptor).toBeDefined();
  });

  it('sets roles metadata', () => {
    class TestClass {
      // noop
      handler() {}
    }
    Roles(UserRole.ADMIN)(TestClass.prototype.handler);
    expect(ROLES_KEY).toBe('roles');
  });

  it('exports current user decorator', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'u-1',
            email: 'member@goodjob.dev',
          },
        }),
      }),
    } as ExecutionContext;

    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
    expect(ctx.switchToHttp().getRequest().user.email).toBe(
      'member@goodjob.dev',
    );
  });
});

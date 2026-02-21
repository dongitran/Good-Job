import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ORG_KEY } from '../decorators/require-org.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type RequestUser = {
  orgId?: string;
};

@Injectable()
export class OrgContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requireOrg = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ORG_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireOrg) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const orgId = request.user?.orgId;

    if (!orgId) {
      throw new ForbiddenException(
        'Organization context required. Please join an organization first.',
      );
    }

    return true;
  }
}

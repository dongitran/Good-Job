import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttler guard that uses email + IP as the rate-limit key.
 *
 * Apply via @UseGuards(AuthEmailIpThrottlerGuard) on auth endpoints
 * that accept an email in the request body (forgot-password, resend-verification).
 * Pair with @Throttle({ default: { limit, ttl } }) to set the limits.
 */
@Injectable()
export class AuthEmailIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = (req.body?.email ?? 'unknown').toLowerCase().trim();
    return `${email}:${req.ip}`;
  }
}

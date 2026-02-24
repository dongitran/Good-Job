import { createConnection, type Socket } from 'node:net';

/**
 * Redis URL used exclusively by E2E tests to flush rate-limit state.
 *
 * Locally: defaults to redis://localhost:6379
 * CI:      set via the E2E_REDIS_URL GitHub secret
 */
const redisUrl = process.env.E2E_REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string): { host: string; port: number } {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || 'localhost',
            port: Number(parsed.port) || 6379,
        };
    } catch {
        return { host: 'localhost', port: 6379 };
    }
}

/**
 * Flush all NestJS Throttler keys from Redis so that parallel E2E
 * workers don't exhaust the per-IP rate limits.
 *
 * Uses a single atomic FLUSHDB command instead of KEYS scan + DEL
 * to eliminate race conditions between parallel workers.
 *
 * Uses raw TCP (no ioredis dependency). Silently skips if the
 * connection fails (e.g. no Redis in CI without the secret).
 */
export async function flushThrottleKeys(): Promise<void> {
    const { host, port } = parseRedisUrl(redisUrl);

    let socket: Socket | null = null;
    try {
        socket = await new Promise<Socket>((resolve, reject) => {
            const conn = createConnection({ host, port }, () => resolve(conn));
            conn.setTimeout(3_000);
            conn.on('error', reject);
            conn.on('timeout', () => {
                conn.destroy();
                reject(new Error('Redis connection timed out'));
            });
        });

        // Atomic flush — eliminates the race window that existed with
        // the previous KEYS scan + DEL approach (~900 ms gap).
        await new Promise<void>((resolve, reject) => {
            socket!.once('data', () => resolve());
            socket!.once('error', reject);
            socket!.write('FLUSHDB\r\n');
            // Safety timeout in case the response never arrives
            setTimeout(resolve, 500);
        });
    } catch (error) {
        console.warn(
            '[redis-helpers] could not flush throttle keys (Redis unavailable):',
            (error as Error).message,
        );
    } finally {
        if (socket) {
            socket.destroy();
        }
    }
}

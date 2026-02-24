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
 * Send a raw Redis command via TCP and wait for the full RESP response.
 */
function sendRedisCommand(
    socket: Socket,
    command: string,
): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        const timeout = setTimeout(() => {
            socket.removeAllListeners('data');
            resolve(data);
        }, 2_000);

        const onData = (chunk: Buffer) => {
            data += chunk.toString();
        };

        socket.on('data', onData);
        socket.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        socket.write(command + '\r\n');

        // Wait a short moment for all chunks to arrive, then resolve
        setTimeout(() => {
            clearTimeout(timeout);
            socket.removeListener('data', onData);
            resolve(data);
        }, 300);
    });
}

/**
 * Parse a RESP bulk-array response of strings into an array.
 * Handles the format: *N\r\n$len\r\nvalue\r\n...
 */
function parseRespArray(raw: string): string[] {
    const lines = raw.split('\r\n');
    if (!lines[0]?.startsWith('*')) return [];
    const count = parseInt(lines[0].slice(1), 10);
    if (count <= 0) return [];

    const results: string[] = [];
    let i = 1;
    while (results.length < count && i < lines.length) {
        if (lines[i]?.startsWith('$')) {
            i++;
            if (i < lines.length && lines[i] !== undefined) {
                results.push(lines[i]);
            }
        }
        i++;
    }
    return results;
}

/**
 * Flush all NestJS Throttler keys from Redis so that rate-limit tests
 * don't contaminate subsequent test suites running from the same IP.
 *
 * NestJS Throttler (with Redis storage) uses keys like:
 *   {sha256hash:default}:hits
 *   {sha256hash:default}:blocked
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

        // Find throttler "hits" and "blocked" keys
        const hitsResp = await sendRedisCommand(socket, 'KEYS *:default}:hits');
        const blockedResp = await sendRedisCommand(socket, 'KEYS *:default}:blocked');
        const keys = [
            ...parseRespArray(hitsResp),
            ...parseRespArray(blockedResp),
        ];

        if (keys.length > 0) {
            await sendRedisCommand(socket, `DEL ${keys.join(' ')}`);
        }
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

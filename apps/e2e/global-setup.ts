import { cleanupE2eDatabase } from './test-utils/e2e-db-cleanup';
import { flushThrottleKeys } from './test-utils/redis-helpers';

export default async function globalSetup(): Promise<void> {
  await cleanupE2eDatabase('before test run');
  // Flush any stale throttle keys so rate-limiting tests start clean.
  await flushThrottleKeys();
}

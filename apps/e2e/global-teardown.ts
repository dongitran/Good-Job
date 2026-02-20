import { cleanupE2eDatabase } from './test-utils/e2e-db-cleanup';

export default async function globalTeardown(): Promise<void> {
  await cleanupE2eDatabase('after test run');
}

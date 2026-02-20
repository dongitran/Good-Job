import { cleanupE2eDatabase } from './test-utils/e2e-db-cleanup';

export default async function globalSetup(): Promise<void> {
  await cleanupE2eDatabase('before test run');
}

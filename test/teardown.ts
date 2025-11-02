import { teardownTestDatabase } from './test-database.config';

export default async function globalTeardown() {
  console.log('Global teardown started');
  await teardownTestDatabase();
  console.log('Global teardown completed');
}

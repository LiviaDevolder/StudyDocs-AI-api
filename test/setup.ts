import { setupTestDatabase } from './test-database.config';

export default async function globalSetup() {
  console.log('Global setup started');
  await setupTestDatabase();
  console.log('Global setup completed');
}

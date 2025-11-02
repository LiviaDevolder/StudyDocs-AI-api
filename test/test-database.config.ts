import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

let container: StartedPostgreSqlContainer;
let dataSource: DataSource;

export async function setupTestDatabase() {
  console.log('Starting PostgreSQL container...');
  
  container = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .withExposedPorts(5432)
    .start();

  console.log('PostgreSQL container started');
  console.log(`Database URL: ${container.getConnectionUri()}`);

  dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('DataSource initialized');
  
  return { container, dataSource };
}

export async function teardownTestDatabase() {
  console.log('Tearing down test database...');
  
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    console.log('DataSource destroyed');
  }
  
  if (container) {
    await container.stop();
    console.log('PostgreSQL container stopped');
  }
}

export function getTestDataSource() {
  return dataSource;
}

export function getTestContainer() {
  return container;
}

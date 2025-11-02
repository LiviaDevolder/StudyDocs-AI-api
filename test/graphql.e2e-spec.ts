import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTestDataSource } from './test-database.config';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('GraphQL E2E Tests with Testcontainers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const dataSource = getTestDataSource();
    const options = dataSource.options as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          database: options.database,
          autoLoadEntities: true,
          synchronize: true,
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const registerMutation = `
        mutation Register($createUserInput: CreateUserInput!) {
          register(createUserInput: $createUserInput) {
            user {
              id
              name
              email
              createdAt
              updatedAt
            }
            token
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            createUserInput: {
              name: 'Test User',
              email: 'test@example.com',
              password: 'Test@1234',
            },
          },
        })
        .expect(200);

      expect(response.body.data.register).toBeDefined();
      expect(response.body.data.register.user.email).toBe('test@example.com');
      expect(response.body.data.register.user.name).toBe('Test User');
      expect(response.body.data.register.token).toBeDefined();
    });

    it('should not register user with duplicate email', async () => {
      const registerMutation = `
        mutation Register($createUserInput: CreateUserInput!) {
          register(createUserInput: $createUserInput) {
            user {
              id
              email
            }
            token
          }
        }
      `;

      // First registration
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            createUserInput: {
              name: 'User One',
              email: 'duplicate@example.com',
              password: 'Test@1234',
            },
          },
        });

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            createUserInput: {
              name: 'User Two',
              email: 'duplicate@example.com',
              password: 'Test@5678',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('User Login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      const registerMutation = `
        mutation Register($createUserInput: CreateUserInput!) {
          register(createUserInput: $createUserInput) {
            user {
              id
            }
            token
          }
        }
      `;

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            createUserInput: {
              name: 'Login User',
              email: 'login@example.com',
              password: 'Login@1234',
            },
          },
        });
    });

    it('should login with valid credentials', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            user {
              id
              email
            }
            token
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'login@example.com',
              password: 'Login@1234',
            },
          },
        })
        .expect(200);

      expect(response.body.data.login).toBeDefined();
      expect(response.body.data.login.user.email).toBe('login@example.com');
      expect(response.body.data.login.token).toBeDefined();
    });

    it('should not login with invalid password', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            user {
              id
            }
            token
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'login@example.com',
              password: 'WrongPassword',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });
});

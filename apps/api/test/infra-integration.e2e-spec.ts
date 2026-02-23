import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/app-bootstrap';

jest.setTimeout(30_000);

const runInfraE2E = process.env.RUN_INFRA_E2E === 'true';
const describeInfra = runInfraE2E ? describe : describe.skip;

describeInfra('Infra Integration (e2e, app module)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_URL = process.env.APP_URL || 'http://localhost:5173';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET =
      process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback';
    process.env.GCP_GCS_PROJECT_ID =
      process.env.GCP_GCS_PROJECT_ID || 'test-project-id';
    process.env.GCP_GCS_CREDENTIALS =
      process.env.GCP_GCS_CREDENTIALS ||
      '{"client_email":"test-uploader@test-project-id.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n"}';
    process.env.DEFAULT_MONTHLY_BUDGET =
      process.env.DEFAULT_MONTHLY_BUDGET || '1000';
    process.env.DEFAULT_MIN_POINTS = process.env.DEFAULT_MIN_POINTS || '1';
    process.env.DEFAULT_MAX_POINTS = process.env.DEFAULT_MAX_POINTS || '100';
    process.env.GEMINI_API_KEYS =
      process.env.GEMINI_API_KEYS || 'test-gemini-key';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/goodjob';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('boots with infrastructure and serves health endpoint', async () => {
    await request(app.getHttpServer()).get('/api').expect(200);
  });
});

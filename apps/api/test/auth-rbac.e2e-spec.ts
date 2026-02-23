import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppE2eModule } from './../src/app.e2e.module';
import { configureApp } from './../src/bootstrap/app-bootstrap';
import {
  User,
  Organization,
  OrganizationMembership,
  UserRole,
  OrgPlan,
} from './../src/database/entities';

describe('Auth/RBAC (e2e, isolated)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_URL = 'http://localhost:5173';
    process.env.JWT_SECRET = 'e2e-secret-key';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.AUTH_ALLOW_DEV_TOKEN_ISSUE = 'true';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:3000/api/auth/google/callback';
    process.env.GCP_GCS_PROJECT_ID = 'test-project-id';
    process.env.GCP_GCS_CREDENTIALS =
      '{"client_email":"test-uploader@test-project-id.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n"}';
    process.env.GEMINI_API_KEYS = 'test-gemini-key';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/goodjob_test';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.DEFAULT_MONTHLY_BUDGET = '1000';
    process.env.DEFAULT_MIN_POINTS = '1';
    process.env.DEFAULT_MAX_POINTS = '100';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Seed test users with org memberships
    await seedTestData(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await cleanTestData(dataSource);
    }
    await app?.close();
  });

  it('/api (GET) should stay public', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('service', 'Good Job API');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/api/ready (GET) should stay public', () => {
    return request(app.getHttpServer())
      .get('/api/ready')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ready');
        expect(res.body).toHaveProperty('checks');
      });
  });

  it('/api/auth/me (GET) should require authentication', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('/api/auth/me (GET) should return current user with valid token', async () => {
    const tokenResponse = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({ email: 'member@goodjob.dev' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenResponse.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email', 'member@goodjob.dev');
        expect(res.body).toHaveProperty('role', 'member');
      });
  });

  it('/api/admin/health (GET) should enforce role-based access', async () => {
    const memberToken = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({ email: 'member@goodjob.dev' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${memberToken.body.accessToken}`)
      .expect(403);

    const adminToken = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({ email: 'admin@goodjob.dev' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          status: 'ok',
          scope: 'admin',
        });
      });
  });

  it('/api/auth/token (POST) should reject unknown fields', () => {
    return request(app.getHttpServer())
      .post('/api/auth/token')
      .send({
        email: 'user@goodjob.dev',
        role: 'super_admin',
      })
      .expect(400);
  });
});

// ─── Test Data Helpers ───────────────────────────────────────────────────────

const TEST_ORG_SLUG = 'e2e-test-org';
const TEST_EMAILS = [
  'member@goodjob.dev',
  'admin@goodjob.dev',
  'user@goodjob.dev',
];

async function seedTestData(ds: DataSource) {
  const orgRepo = ds.getRepository(Organization);
  const userRepo = ds.getRepository(User);
  const membershipRepo = ds.getRepository(OrganizationMembership);

  // Create test org
  let org = await orgRepo.findOne({ where: { slug: TEST_ORG_SLUG } });
  if (!org) {
    org = await orgRepo.save(
      orgRepo.create({
        name: 'E2E Test Org',
        slug: TEST_ORG_SLUG,
        plan: OrgPlan.PRO_TRIAL,
        settings: {},
      }),
    );
  }

  // Create test users with memberships
  const userRoles: Record<string, UserRole> = {
    'member@goodjob.dev': UserRole.MEMBER,
    'admin@goodjob.dev': UserRole.ADMIN,
    'user@goodjob.dev': UserRole.MEMBER,
  };

  for (const email of TEST_EMAILS) {
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          email,
          fullName: email.split('@')[0],
          isActive: true,
          emailVerifiedAt: new Date(),
        }),
      );
    }

    const existing = await membershipRepo.findOne({
      where: { userId: user.id, orgId: org.id },
    });
    if (!existing) {
      await membershipRepo.save(
        membershipRepo.create({
          userId: user.id,
          orgId: org.id,
          role: userRoles[email],
          isActive: true,
          joinedAt: new Date(),
        }),
      );
    }
  }
}

async function cleanTestData(ds: DataSource) {
  const userRepo = ds.getRepository(User);
  const orgRepo = ds.getRepository(Organization);

  for (const email of TEST_EMAILS) {
    const user = await userRepo.findOne({ where: { email } });
    if (user) {
      await ds
        .getRepository(OrganizationMembership)
        .delete({ userId: user.id });
      await userRepo.delete({ id: user.id });
    }
  }
  await orgRepo.delete({ slug: TEST_ORG_SLUG });
}

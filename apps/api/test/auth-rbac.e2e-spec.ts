import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppE2eModule } from './../src/app.e2e.module';
import { configureApp } from './../src/bootstrap/app-bootstrap';
import { UserRole } from '../src/database/entities';

describe('Auth/RBAC (e2e, isolated)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_URL = 'http://localhost:5173';
    process.env.JWT_SECRET = 'e2e-secret-key';
    process.env.JWT_ACCESS_EXPIRY = '15m';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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

  it('/api/auth/me (GET) should require authentication', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('/api/auth/me (GET) should return current user with valid token', async () => {
    const tokenResponse = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({
        email: 'member@goodjob.dev',
        role: UserRole.MEMBER,
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenResponse.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email', 'member@goodjob.dev');
        expect(res.body).toHaveProperty('role', UserRole.MEMBER);
      });
  });

  it('/api/admin/health (GET) should enforce role-based access', async () => {
    const memberToken = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({
        email: 'member@goodjob.dev',
        role: UserRole.MEMBER,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${memberToken.body.accessToken}`)
      .expect(403);

    const adminToken = await request(app.getHttpServer())
      .post('/api/auth/token')
      .send({
        email: 'admin@goodjob.dev',
        role: UserRole.ADMIN,
      })
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

  it('/api/auth/token (POST) should reject invalid role', () => {
    return request(app.getHttpServer())
      .post('/api/auth/token')
      .send({
        email: 'user@goodjob.dev',
        role: 'super_admin',
      })
      .expect(400);
  });
});

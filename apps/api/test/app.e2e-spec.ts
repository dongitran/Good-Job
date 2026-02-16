import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole } from '../src/database/entities';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('service', 'Good Job API');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/auth/me (GET) should require authentication', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('/auth/me (GET) should return current user with valid token', async () => {
    const tokenResponse = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        email: 'member@goodjob.dev',
        role: UserRole.MEMBER,
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${tokenResponse.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email', 'member@goodjob.dev');
        expect(res.body).toHaveProperty('role', UserRole.MEMBER);
      });
  });

  it('/admin/health (GET) should enforce role-based access', async () => {
    const memberToken = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        email: 'member@goodjob.dev',
        role: UserRole.MEMBER,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Authorization', `Bearer ${memberToken.body.accessToken}`)
      .expect(403);

    const adminToken = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        email: 'admin@goodjob.dev',
        role: UserRole.ADMIN,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Authorization', `Bearer ${adminToken.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          status: 'ok',
          scope: 'admin',
        });
      });
  });
});

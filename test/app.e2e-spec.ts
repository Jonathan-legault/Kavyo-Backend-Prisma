import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `e2e-${Date.now()}@kavyo.ca`;
  const adminEmail = `e2e-admin-${Date.now()}@kavyo.ca`;
  const testPassword = 'TestPassword123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testEmail, adminEmail],
        },
      },
    });

    await app.close();
  });

  it('POST /auth/register should register a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body.email).toBe(testEmail);
    expect(response.body.firstName).toBe('E2E');
    expect(response.body.lastName).toBe('User');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/register should reject a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'User',
      })
      .expect(409);
  });

  it('POST /auth/login should log in with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.roles).toContain('USER');
  });

  it('POST /auth/login should reject an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword123',
      })
      .expect(401);
  });

  it('GET /users/me should reject a request without a token', async () => {
    await request(app.getHttpServer())
      .get('/users/me')
      .expect(401);
  });

  it('GET /users/me should return the authenticated user', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.email).toBe(testEmail);
    expect(response.body.roles).toContain('USER');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('PATCH /users/me should reject fields that are not allowed', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Kavyo',
        admin: true,
      })
      .expect(400);

    expect(response.body.message).toContain(
      'property admin should not exist',
    );
  });

  it('GET /users/me/preferences should require authentication', async () => {
    await request(app.getHttpServer())
      .get('/users/me/preferences')
      .expect(401);
  });

  it('PATCH /users/me/preferences should reject a negative distance', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        maxTravelDistanceKm: -5,
      })
      .expect(400);
  });

  it('PATCH /users/me/preferences should save valid preferences', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        maxTravelDistanceKm: 5,
        maxExtraTravelMinutes: 10,
      })
      .expect(200);

    expect(response.body.maxTravelDistanceKm).toBe('5');
    expect(response.body.maxExtraTravelMinutes).toBe(10);
  });

  it('PATCH /users/me/preferences should reject a missing store', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .patch('/users/me/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usualStoreId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(404);

    expect(response.body.message).toBe('Store not found');
  });

  it('GET /auth/admin-test should reject a USER with 403', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /auth/admin-test should allow an ADMIN', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'Admin',
      })
      .expect(201);

    const adminUser = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });

    const adminRole = await prisma.role.findUnique({
      where: {
        name: 'ADMIN',
      },
    });

    expect(adminUser).not.toBeNull();
    expect(adminRole).not.toBeNull();

    if (!adminUser || !adminRole) {
      throw new Error('ADMIN test setup failed');
    }

    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: testPassword,
      })
      .expect(200);

    expect(loginResponse.body.user.roles).toContain('ADMIN');

    const token = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe(
      'ADMIN authorization successful',
    );
  });
});
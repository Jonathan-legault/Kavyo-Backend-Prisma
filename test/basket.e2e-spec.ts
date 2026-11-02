import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'kavyo-basket-e2e-secret';

const PRODUCT_IDS = [
  '63ddbba5-e68b-4c09-9fa8-321b8bb0531c',
  '9b465a81-10bd-4976-8104-5ca45ee1f405',
  '042713f7-46b6-432f-aabc-7d4dd982352a',
  '29de5628-e857-4442-8c2c-a0818071a531',
  '5d9baa7c-9c37-4182-96d6-0f16881672ad',
];

const TEST_PASSWORD = 'TestPassword123';

describe('Basket comparison (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let basketId: string;
  let accessToken: string;
  let userId: string;

  const testEmail = `e2e-basket-${Date.now()}@kavyo.ca`;
  const otherEmail = `e2e-basket-other-${Date.now()}@kavyo.ca`;

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

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: TEST_PASSWORD,
        firstName: 'Basket',
        lastName: 'Owner',
      })
      .expect(201);

    userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: TEST_PASSWORD,
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;

    const basketResponse = await request(app.getHttpServer())
      .post('/baskets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ postalCode: 'T3M 1T4' })
      .expect(201);

    basketId = basketResponse.body.id;

    for (const productId of PRODUCT_IDS) {
      await request(app.getHttpServer())
        .post(`/baskets/${basketId}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId, quantity: 1 })
        .expect(201);
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testEmail, otherEmail],
        },
      },
    });

    await app.close();
  });

  it('rejects basket creation without authentication', async () => {
    await request(app.getHttpServer())
      .post('/baskets')
      .send({ postalCode: 'T3M 1T4' })
      .expect(401);
  });

  it('rejects reading a basket without authentication', async () => {
    await request(app.getHttpServer())
      .get(`/baskets/${basketId}`)
      .expect(401);
  });

  it('creates a user-owned basket and stores a normalized postal code', async () => {
    const response = await request(app.getHttpServer())
      .get(`/baskets/${basketId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.postalCode).toBe('T3M1T4');
    expect(response.body.itemCount).toBe(PRODUCT_IDS.length);
    expect(response.body.items).toHaveLength(PRODUCT_IDS.length);

    const storedBasket = await prisma.basket.findUnique({
      where: { id: basketId },
      select: { userId: true },
    });

    expect(storedBasket?.userId).toBe(userId);
  });

  it('compares a persisted basket with travel cost included', async () => {
    const response = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(response.body.basketId).toBe(basketId);
    expect(response.body.postalCode).toBe('T3M1T4');
    expect(response.body.customerLocation.fsa).toBe('T3M');
    expect(response.body.comparisons).toHaveLength(3);

    for (const comparison of response.body.comparisons) {
      expect(comparison.isComplete).toBe(true);
      expect(comparison.storeLocation.precision).toBe('STORE_RECORD');
      expect(comparison.distanceKm).toBeGreaterThan(0);
      expect(comparison.travelCost).toBeGreaterThan(0);
      expect(comparison.estimatedTotal).toBe(
        Math.round(
          (comparison.productSubtotal + comparison.travelCost) * 100,
        ) / 100,
      );
    }

    const totals = response.body.comparisons.map(
      (comparison: { estimatedTotal: number }) => comparison.estimatedTotal,
    );
    expect(response.body.cheapestCompleteStore.estimatedTotal).toBe(
      Math.min(...totals),
    );
    expect(response.body.recommendation.action).toBe('GO_TO_STORE');
    expect(response.body.recommendation.estimatedTotal).toBe(
      response.body.cheapestCompleteStore.estimatedTotal,
    );
    expect(response.body.recommendation.travelCost).toBeGreaterThan(0);
  });

  it('uses regular prices after a sale expires', async () => {
    const response = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(response.body.warnings).toContain(
      'One or more flyer sale prices have expired. The regular price was used instead.',
    );

    const comparisonsWithExpiredSales = response.body.comparisons.filter(
      (comparison: { hasExpiredSale: boolean }) => comparison.hasExpiredSale,
    );

    expect(comparisonsWithExpiredSales.length).toBeGreaterThan(0);

    for (const comparison of comparisonsWithExpiredSales) {
      for (const item of comparison.items) {
        if (item.saleStatus === 'EXPIRED') {
          expect(item.priceType).toBe('REGULAR');
          expect(item.unitPrice).toBe(item.regularPrice);
        }
      }
    }
  });

  it('recommends switching when the baseline store is not cheapest', async () => {
    const initial = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    const baseline = initial.body.comparisons.find(
      (comparison: { storeId: string }) =>
        comparison.storeId !==
        initial.body.cheapestCompleteStore.storeId,
    );

    const response = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ baselineStoreId: baseline.storeId })
      .expect(201);

    expect(response.body.recommendation.action).toBe('SWITCH');
    expect(response.body.recommendation.baselineStoreId).toBe(
      baseline.storeId,
    );
    expect(response.body.recommendation.savingsVsBaseline).toBeGreaterThan(0);
  });

  it('keeps the stateless compare endpoint public', async () => {
    const response = await request(app.getHttpServer())
      .post('/basket/compare')
      .send({
        postalCode: 'T3M 1T4',
        items: PRODUCT_IDS.map((productId) => ({
          productId,
          quantity: 1,
        })),
      })
      .expect(201);

    expect(response.body.basketId).toBeNull();
    expect(response.body.postalCode).toBe('T3M1T4');
    expect(response.body.recommendation.action).toBe('GO_TO_STORE');
    expect(response.body.cheapestCompleteStore.estimatedTotal).toBeGreaterThan(
      0,
    );
  });

  it('rejects an unsupported or malformed postal code', async () => {
    await request(app.getHttpServer())
      .post('/baskets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ postalCode: 'T4A 0A1' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/baskets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ postalCode: 'not-a-postal-code' })
      .expect(400);
  });

  it('requires a postal code for a persisted comparison', async () => {
    const basketResponse = await request(app.getHttpServer())
      .post('/baskets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/baskets/${basketResponse.body.id}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: PRODUCT_IDS[0], quantity: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/baskets/${basketResponse.body.id}/compare`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    await prisma.basket.delete({ where: { id: basketResponse.body.id } });
  });

  it("does not expose another user's basket", async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: otherEmail,
        password: TEST_PASSWORD,
        firstName: 'Other',
        lastName: 'User',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: otherEmail,
        password: TEST_PASSWORD,
      })
      .expect(200);

    const otherToken = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .get(`/baskets/${basketId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/baskets/${basketId}/items`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ productId: PRODUCT_IDS[0], quantity: 1 })
      .expect(404);

    await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({})
      .expect(404);
  });
});

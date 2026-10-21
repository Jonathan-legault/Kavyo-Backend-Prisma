import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const PRODUCT_IDS = [
  '63ddbba5-e68b-4c09-9fa8-321b8bb0531c',
  '9b465a81-10bd-4976-8104-5ca45ee1f405',
  '042713f7-46b6-432f-aabc-7d4dd982352a',
  '29de5628-e857-4442-8c2c-a0818071a531',
  '5d9baa7c-9c37-4182-96d6-0f16881672ad',
];

describe('Basket comparison (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let basketId: string;

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

    const basketResponse = await request(app.getHttpServer())
      .post('/baskets')
      .send({ postalCode: 'T3M 1T4' })
      .expect(201);

    basketId = basketResponse.body.id;

    for (const productId of PRODUCT_IDS) {
      await request(app.getHttpServer())
        .post(`/baskets/${basketId}/items`)
        .send({ productId, quantity: 1 })
        .expect(201);
    }
  });

  afterAll(async () => {
    if (basketId) {
      await prisma.basket.deleteMany({ where: { id: basketId } });
    }

    await app.close();
  });

  it('creates an anonymous basket and stores a normalized postal code', async () => {
    const response = await request(app.getHttpServer())
      .get(`/baskets/${basketId}`)
      .expect(200);

    expect(response.body.postalCode).toBe('T3M1T4');
    expect(response.body.itemCount).toBe(PRODUCT_IDS.length);
    expect(response.body.items).toHaveLength(PRODUCT_IDS.length);
  });

  it('compares a persisted basket with travel cost included', async () => {
    const response = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
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
      .send({})
      .expect(201);

    const baseline = initial.body.comparisons.find(
      (comparison: { storeId: string }) =>
        comparison.storeId !==
        initial.body.cheapestCompleteStore.storeId,
    );

    const response = await request(app.getHttpServer())
      .post(`/baskets/${basketId}/compare`)
      .send({ baselineStoreId: baseline.storeId })
      .expect(201);

    expect(response.body.recommendation.action).toBe('SWITCH');
    expect(response.body.recommendation.baselineStoreId).toBe(
      baseline.storeId,
    );
    expect(response.body.recommendation.savingsVsBaseline).toBeGreaterThan(0);
  });

  it('keeps the stateless compare endpoint working', async () => {
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
      .send({ postalCode: 'T4A 0A1' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/baskets')
      .send({ postalCode: 'not-a-postal-code' })
      .expect(400);
  });

  it('requires a postal code for a persisted comparison', async () => {
    const basketResponse = await request(app.getHttpServer())
      .post('/baskets')
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/baskets/${basketResponse.body.id}/items`)
      .send({ productId: PRODUCT_IDS[0], quantity: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/baskets/${basketResponse.body.id}/compare`)
      .send({})
      .expect(400);

    await prisma.basket.delete({ where: { id: basketResponse.body.id } });
  });
});

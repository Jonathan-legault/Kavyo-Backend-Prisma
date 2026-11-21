import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

process.env.JWT_SECRET ??= "kavyo-advertised-offer-e2e-secret";

describe("Basket advertised-offer estimates (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productId: string;
  let expiredProductId: string;
  let offerId: string;
  let expiredOfferId: string;
  let sourceSystemId: string;
  let storeId: string;

  const suffix = Date.now();
  const catalogKey = `E2E|ADVERTISED|${suffix}`;
  const expiredCatalogKey = `E2E|EXPIRED|${suffix}`;

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
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const store = await prisma.store.findFirstOrThrow({
      where: {
        retailer: { name: "Real Canadian Superstore" },
      },
    });
    storeId = store.id;

    const sourceSystem = await prisma.sourceSystem.create({
      data: {
        name: `E2E_ADVERTISED_OFFER_${suffix}`,
        sourceType: "FLYER_AGGREGATOR",
        isActive: true,
      },
    });
    sourceSystemId = sourceSystem.id;

    const product = await prisma.product.create({
      data: {
        catalogKey,
        productName: "E2E Advertised Offer Apples",
        brand: "Kavyo E2E",
        quantityText: "1 kg",
        categories: "GROCERY",
        isActive: true,
      },
    });
    productId = product.id;

    const offer = await prisma.advertisedOffer.create({
      data: {
        stableKey: `e2e-advertised-${suffix}`,
        sourceSystemId,
        retailerId: store.retailerId,
        productId,
        flyerExternalId: `e2e-flyer-${suffix}`,
        sourceRecordId: `e2e-record-${suffix}`,
        marketKey: "T3M1T4",
        productName: product.productName,
        packageSizeText: product.quantityText,
        advertisedPriceAmount: 3.49,
        regularPriceAmount: 5.99,
        currency: "CAD",
        conditionEvidence: {
          isMemberPrice: false,
          isMultibuy: false,
          isPriceRange: false,
          isMultiVariant: false,
          reviewReasons: [],
        },
        observedAt: new Date(),
        validFrom: new Date(Date.now() - 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(),
      },
    });
    offerId = offer.id;

    const expiredProduct = await prisma.product.create({
      data: {
        catalogKey: expiredCatalogKey,
        productName: "E2E Expired Offer Apples",
        brand: "Kavyo E2E",
        quantityText: "1 kg",
        categories: "GROCERY",
        isActive: true,
      },
    });
    expiredProductId = expiredProduct.id;

    const expiredOffer = await prisma.advertisedOffer.create({
      data: {
        stableKey: `e2e-expired-${suffix}`,
        sourceSystemId,
        retailerId: store.retailerId,
        productId: expiredProductId,
        flyerExternalId: `e2e-flyer-${suffix}`,
        sourceRecordId: `e2e-expired-record-${suffix}`,
        marketKey: "T3M1T4",
        productName: expiredProduct.productName,
        packageSizeText: expiredProduct.quantityText,
        advertisedPriceAmount: 1.11,
        regularPriceAmount: 4.44,
        currency: "CAD",
        conditionEvidence: {
          isMemberPrice: false,
          isMultibuy: false,
          isPriceRange: false,
          isMultiVariant: false,
          reviewReasons: [],
        },
        observedAt: new Date(),
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(),
      },
    });
    expiredOfferId = expiredOffer.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.advertisedOffer.deleteMany({
        where: { id: { in: [offerId, expiredOfferId] } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: [productId, expiredProductId] } },
      });
      await prisma.sourceSystem.deleteMany({ where: { id: sourceSystemId } });
    }

    if (app) {
      await app.close();
    }
  });

  it("uses a current advertised offer as a retailer-level estimate", async () => {
    const response = await request(app.getHttpServer())
      .post("/basket/compare")
      .send({
        postalCode: "T3M 1T4",
        items: [{ productId, quantity: 2 }],
      })
      .expect(201);

    expect(response.body.hasAdvertisedEstimate).toBe(true);
    expect(response.body.advertisedOfferItemCount).toBe(1);
    expect(response.body.warnings).toContain(
      "Some basket items use retailer-level flyer estimates, not store-verified shelf prices. Confirm availability and price before travelling.",
    );

    const comparison = response.body.comparisons.find(
      (entry: { storeId: string }) => entry.storeId === storeId,
    );

    expect(comparison).toBeTruthy();
    expect(comparison).toMatchObject({
      isComplete: true,
      productSubtotal: 6.98,
      advertisedItemCount: 1,
      hasAdvertisedEstimate: true,
    });
    expect(comparison.items[0]).toMatchObject({
      productId,
      unitPrice: 3.49,
      lineTotal: 6.98,
      priceSource: "ADVERTISED_OFFER",
      priceConfidence: "RETAILER_ADVERTISED",
      advertisedOfferId: offerId,
      offerMarketKey: "T3M1T4",
      offerMarketMatch: "CUSTOMER_POSTAL",
    });
  });

  it("ignores an expired advertised offer", async () => {
    const response = await request(app.getHttpServer())
      .post("/basket/compare")
      .send({
        postalCode: "T3M 1T4",
        items: [{ productId: expiredProductId, quantity: 1 }],
      })
      .expect(201);

    expect(response.body.hasAdvertisedEstimate).toBe(false);
    expect(response.body.advertisedOfferItemCount).toBe(0);

    const comparison = response.body.comparisons.find(
      (entry: { storeId: string }) => entry.storeId === storeId,
    );

    expect(comparison).toMatchObject({
      isComplete: false,
      advertisedItemCount: 0,
      hasAdvertisedEstimate: false,
    });
    expect(comparison.missingProducts).toEqual([
      expect.objectContaining({
        productId: expiredProductId,
        quantity: 1,
      }),
    ]);
  });
});

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module.js";
import type { Prisma } from "../src/generated/prisma/client.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

process.env.JWT_SECRET ??= "kavyo-admin-flyers-e2e-secret";

describe("Admin flyer offer review (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let offerId: string;
  let batchId: string;
  let retailerId: string;
  let storeId: string;
  let sourceSystemId: string;
  let flyerId: string;
  let mainProductId: string;

  const suffix = Date.now();
  const email = `e2e-admin-flyers-${suffix}@kavyo.ca`;
  const password = "TestPassword123";
  const catalogKey = `E2E|ADMIN|${suffix}`;
  let offerSequence = 0;

  async function createTestOffer(
    overrides: Partial<Prisma.StagedOfferUncheckedCreateInput> = {},
  ) {
    const sequence = ++offerSequence;

    return prisma.stagedOffer.create({
      data: {
        ingestBatchId: batchId,
        sourceSystemId,
        flyerId,
        retailerId,
        sourceRecordId: `e2e-offer-${suffix}-${sequence}`,
        retailerName: "Real Canadian Superstore",
        productName: `E2E Test Item ${sequence}`,
        brand: "Kavyo",
        descriptionText: "500 g",
        packageSizeText: "500 g",
        quantityValue: 500,
        quantityUnit: "g",
        family: "test",
        advertisedPriceText: "$9.99",
        advertisedPriceAmount: 9.99,
        regularPriceAmount: 12.99,
        pricingBasis: "FIXED",
        isMemberPrice: false,
        isMultibuy: false,
        isMultiVariant: false,
        isPriceRange: false,
        unitPrice: 1.998,
        unitPriceBasis: "100g",
        currency: "CAD",
        promotionType: "NONE",
        promotionConditions: {},
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        observedAt: new Date(),
        matchKey: `e2e|test|${sequence}|500g|${suffix}`,
        familyKey: "test|100g",
        status: "PENDING_REVIEW",
        reviewRequired: true,
        reviewReasons: ["NO_GTIN"],
        normalizedPayload: {},
        ...overrides,
      },
    });
  }

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

    const sourceSystem = await prisma.sourceSystem.create({
      data: {
        name: `E2E_ADMIN_FLYERS_${suffix}`,
        sourceType: "FLYER_AGGREGATOR",
        isActive: true,
      },
    });
    sourceSystemId = sourceSystem.id;

    const store = await prisma.store.findFirstOrThrow({
      where: {
        retailer: { name: "Real Canadian Superstore" },
      },
      include: { retailer: true },
    });
    storeId = store.id;
    retailerId = store.retailerId;

    const batch = await prisma.ingestBatch.create({
      data: {
        sourceSystemId,
        status: "COMPLETED",
        completedAt: new Date(),
        sourceReference: `E2E ${suffix}`,
      },
    });
    batchId = batch.id;

    const flyer = await prisma.flyer.create({
      data: {
        sourceSystemId,
        retailerId,
        externalId: `e2e-flyer-${suffix}`,
        name: "E2E Flyer",
        postalCode: "T3M1T4",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sourceUrl: "https://example.com/e2e-flyer",
      },
    });
    flyerId = flyer.id;

    const offer = await prisma.stagedOffer.create({
      data: {
        ingestBatchId: batchId,
        sourceSystemId,
        flyerId,
        retailerId,
        sourceRecordId: `e2e-offer-${suffix}`,
        retailerName: "Real Canadian Superstore",
        productName: "E2E Test Cereal",
        brand: "Kavyo",
        descriptionText: "500 g",
        packageSizeText: "500 g",
        quantityValue: 500,
        quantityUnit: "g",
        family: "cereal",
        advertisedPriceText: "$9.99",
        advertisedPriceAmount: 9.99,
        regularPriceAmount: 12.99,
        pricingBasis: "FIXED",
        isMemberPrice: false,
        isMultibuy: false,
        isMultiVariant: false,
        isPriceRange: false,
        unitPrice: 1.998,
        unitPriceBasis: "100g",
        currency: "CAD",
        promotionText: null,
        promotionType: "NONE",
        conditionsText: null,
        promotionConditions: {},
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        observedAt: new Date(),
        matchKey: `e2e|test|cereal|500g|${suffix}`,
        familyKey: "cereal|100g",
        status: "PENDING_REVIEW",
        reviewRequired: true,
        reviewReasons: ["NO_GTIN"],
        normalizedPayload: {},
      },
    });
    offerId = offer.id;

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email,
        password,
        firstName: "E2E",
        lastName: "Admin",
      })
      .expect(201);

    const adminRole = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", description: "Administrator" },
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.priceObservation.deleteMany({
        where: { sourceSystemId },
      });
      await prisma.advertisedOffer.deleteMany({ where: { sourceSystemId } });
      await prisma.stagedOffer.deleteMany({ where: { ingestBatchId: batchId } });
      await prisma.flyer.deleteMany({ where: { sourceSystemId } });
      await prisma.ingestBatch.deleteMany({ where: { sourceSystemId } });
      await prisma.product.deleteMany({
        where: { catalogKey: { startsWith: catalogKey } },
      });
      await prisma.sourceSystem.deleteMany({ where: { id: sourceSystemId } });
      await prisma.user.deleteMany({ where: { email } });
    }

    if (app) {
      await app.close();
    }
  });

  it("requires authentication for the review queue", async () => {
    await request(app.getHttpServer())
      .get("/admin/flyer-offers")
      .expect(401);
  });

  it("lists pending offers for an administrator", async () => {
    const response = await request(app.getHttpServer())
      .get("/admin/flyer-offers")
      .query({ batchId, status: "PENDING_REVIEW" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.batchId).toBe(batchId);
    expect(response.body.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: offerId,
          productName: "E2E Test Cereal",
          status: "PENDING_REVIEW",
        }),
      ]),
    );
  });

  it("filters public offers to promotional rows", async () => {
    const promoOffer = await createTestOffer({
      productName: "E2E Multi-Buy Item",
      sourceRecordId: `e2e-promo-filter-${suffix}`,
      advertisedPriceText: "2 for $5.00",
      advertisedPriceAmount: 5,
      isMultibuy: true,
      promotionText: "2 for $5.00",
      promotionType: "MULTIBUY",
      promotionQuantity: 2,
      promotionTotalPrice: 5,
      promotionUnitPrice: 2.5,
      conditionsText: "2 for $5.00",
    });

    const anyPromotion = await request(app.getHttpServer())
      .get("/flyers/offers")
      .query({ batchId, status: "ALL", promotionType: "ANY", limit: 200 })
      .expect(200);

    expect(anyPromotion.body.offers.length).toBeGreaterThan(0);
    expect(
      anyPromotion.body.offers.every(
        (offer: { promotionType: string }) => offer.promotionType !== "NONE",
      ),
    ).toBe(true);
    expect(anyPromotion.body.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: promoOffer.id,
          promotionType: "MULTIBUY",
          promotionQuantity: 2,
          promotionTotalPrice: 5,
          promotionUnitPrice: 2.5,
        }),
      ]),
    );

    const multibuyOnly = await request(app.getHttpServer())
      .get("/flyers/offers")
      .query({ batchId, status: "ALL", promotionType: "MULTIBUY", limit: 200 })
      .expect(200);

    expect(multibuyOnly.body.offers.length).toBeGreaterThan(0);
    expect(
      multibuyOnly.body.offers.every(
        (offer: { promotionType: string }) =>
          offer.promotionType === "MULTIBUY",
      ),
    ).toBe(true);
  });

  it("approves an offer, creates a canonical product, and publishes a price observation", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${offerId}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey,
        storeId,
        publishPrice: true,
        notes: "Reviewed in e2e",
      })
      .expect(200);

    expect(response.body.decision).toBe("APPROVE");
    expect(response.body.offer).toMatchObject({
      id: offerId,
      status: "NORMALIZED",
      reviewRequired: false,
      reviewDecision: "APPROVED",
      matchedProductId: expect.any(String),
    });
    expect(response.body.product.catalogKey).toBe(catalogKey);
    expect(response.body.advertisedOffer).toMatchObject({
      productId: response.body.offer.matchedProductId,
      marketKey: "T3M1T4",
      advertisedPrice: 9.99,
      currency: "CAD",
    });
    expect(response.body.priceObservation).toMatchObject({
      productId: response.body.offer.matchedProductId,
      storeId,
      regularPrice: 12.99,
      salePrice: 9.99,
    });

    mainProductId = response.body.product.id;

    const offer = await prisma.stagedOffer.findUniqueOrThrow({
      where: { id: offerId },
    });
    expect(offer.reviewedByUserId).not.toBeNull();

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: mainProductId },
    });
    expect(product.barcode).toBeNull();
    expect(product.catalogKey).toBe(catalogKey);

    const observations = await prisma.priceObservation.findMany({
      where: { productId: mainProductId, storeId },
    });
    expect(observations).toHaveLength(1);
  });

  it("updates the advertised offer instead of duplicating it on re-review", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${offerId}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        productId: mainProductId,
        storeId,
        publishPrice: true,
        unitPrice: 7.77,
        notes: "Corrected price during re-review",
      })
      .expect(200);

    expect(response.body.advertisedOffer).toMatchObject({
      productId: mainProductId,
      advertisedPrice: 7.77,
    });

    const advertisedOffers = await prisma.advertisedOffer.findMany({
      where: {
        sourceSystemId,
        sourceRecordId: `e2e-offer-${suffix}`,
      },
    });
    expect(advertisedOffers).toHaveLength(1);
    expect(advertisedOffers[0].advertisedPriceAmount?.toNumber()).toBe(7.77);

    const observations = await prisma.priceObservation.findMany({
      where: { productId: mainProductId, storeId },
    });
    expect(observations).toHaveLength(1);
    expect(observations[0].salePrice.toNumber()).toBe(7.77);
  });

  it("does not publish a price unless explicitly requested", async () => {
    const noPriceOffer = await createTestOffer({
      productName: "E2E No-Price Item",
      sourceRecordId: `e2e-no-price-${suffix}`,
    });

    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${noPriceOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey: `${catalogKey}-no-price`,
        storeId,
        notes: "Catalogue only; price unresolved",
      })
      .expect(200);

    expect(response.body.priceObservation).toBeNull();

    const observations = await prisma.priceObservation.findMany({
      where: { productId: response.body.product.id, storeId },
    });
    expect(observations).toHaveLength(0);
  });

  it("reuses the same canonical product for a later weekly offer", async () => {
    const weeklyOffer = await createTestOffer({
      productName: "E2E Test Cereal",
      sourceRecordId: `e2e-weekly-${suffix}`,
      matchKey: `e2e|test|cereal|500g|${suffix}`,
      advertisedPriceAmount: 8.99,
    });

    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${weeklyOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey,
        storeId,
        publishPrice: true,
      })
      .expect(200);

    expect(response.body.product.id).toBe(mainProductId);

    const observations = await prisma.priceObservation.findMany({
      where: { productId: mainProductId, storeId },
    });
    expect(observations).toHaveLength(2);
  });

  it("withdraws a store price when an offer is re-approved as catalogue-only", async () => {
    await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${offerId}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        productId: mainProductId,
        publishPrice: false,
        notes: "Keep the flyer estimate, withdraw the store price",
      })
      .expect(200);

    const observations = await prisma.priceObservation.findMany({
      where: {
        sourceSystemId,
        sourceRecordId: `e2e-offer-${suffix}`,
      },
    });
    expect(observations).toHaveLength(0);

    const advertisedOffers = await prisma.advertisedOffer.findMany({
      where: {
        sourceSystemId,
        sourceRecordId: `e2e-offer-${suffix}`,
      },
    });
    expect(advertisedOffers).toHaveLength(1);
  });

  it("refuses to publish member-only or multibuy prices as general sale prices", async () => {
    const memberOffer = await createTestOffer({
      productName: "E2E Member Item",
      sourceRecordId: `e2e-member-${suffix}`,
      isMemberPrice: true,
      promotionType: "MEMBER_PRICE",
      memberProgram: "Scene+",
      memberPriceAmount: 8.99,
      nonMemberPriceAmount: 10.99,
    });
    const memberResponse = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${memberOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey: `${catalogKey}-member`,
        storeId,
        publishPrice: true,
      })
      .expect(400);

    expect(memberResponse.body.message).toContain("Member-only pricing");

    const multibuyOffer = await createTestOffer({
      productName: "E2E Multibuy Item",
      sourceRecordId: `e2e-multibuy-${suffix}`,
      isMultibuy: true,
      promotionType: "MULTIBUY",
      promotionQuantity: 3,
      promotionTotalPrice: 7,
      promotionUnitPrice: 2.3333,
    });
    const multibuyResponse = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${multibuyOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey: `${catalogKey}-multibuy`,
        storeId,
        publishPrice: true,
      })
      .expect(400);

    expect(multibuyResponse.body.message).toContain("Multibuy pricing");
  });

  it("requires an explicit product for a multi-variant offer", async () => {
    const variantOffer = await createTestOffer({
      productName: "E2E Variant Item",
      sourceRecordId: `e2e-variant-${suffix}`,
      isMultiVariant: true,
      promotionType: "NONE",
    });

    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${variantOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey: `${catalogKey}-variant`,
        storeId,
        publishPrice: false,
      })
      .expect(400);

    expect(response.body.message).toContain("Multi-variant offer");
  });

  it("withdraws a published price when an approved offer is rejected", async () => {
    const withdrawOffer = await createTestOffer({
      productName: "E2E Withdraw Item",
      sourceRecordId: `e2e-withdraw-${suffix}`,
    });

    const approved = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${withdrawOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "APPROVE",
        createProduct: true,
        catalogKey: `${catalogKey}-withdraw`,
        storeId,
        publishPrice: true,
      })
      .expect(200);

    const withdrawnProductId = approved.body.product.id;
    const beforeReject = await prisma.priceObservation.findMany({
      where: { productId: withdrawnProductId, storeId },
    });
    expect(beforeReject).toHaveLength(1);
    expect(
      await prisma.advertisedOffer.count({
        where: { sourceRecordId: `e2e-withdraw-${suffix}` },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${withdrawOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "REJECT",
        notes: "Price was not valid for this store",
      })
      .expect(200);

    const afterReject = await prisma.priceObservation.findMany({
      where: { productId: withdrawnProductId, storeId },
    });
    expect(afterReject).toHaveLength(0);
    expect(
      await prisma.advertisedOffer.count({
        where: { sourceRecordId: `e2e-withdraw-${suffix}` },
      }),
    ).toBe(0);
  });

  it("records a rejection without publishing a price", async () => {
    const rejectedOffer = await prisma.stagedOffer.create({
      data: {
        ingestBatchId: batchId,
        sourceSystemId,
        flyerId,
        retailerId,
        sourceRecordId: `e2e-rejected-${suffix}`,
        retailerName: "E2E Admin Retailer",
        productName: "E2E Rejected Item",
        advertisedPriceAmount: 4.99,
        pricingBasis: "FIXED",
        observedAt: new Date(),
        status: "PENDING_REVIEW",
        reviewRequired: true,
        reviewReasons: ["PRICE_MISSING"],
        normalizedPayload: {},
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/admin/flyer-offers/${rejectedOffer.id}/review`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        decision: "REJECT",
        notes: "Not a grocery product",
      })
      .expect(200);

    expect(response.body.offer).toMatchObject({
      status: "REJECTED",
      reviewRequired: false,
      reviewDecision: "REJECTED",
    });

    const observations = await prisma.priceObservation.findMany({
      where: { sourceRecordId: `e2e-rejected-${suffix}` },
    });
    expect(observations).toHaveLength(0);
  });
});

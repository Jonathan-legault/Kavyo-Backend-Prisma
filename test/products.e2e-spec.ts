import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module.js";

describe("Product catalogue (e2e)", () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns active products with catalogue metadata", async () => {
    const response = await request(app.getHttpServer())
      .get("/products")
      .query({ limit: 5 })
      .expect(200);

    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.products).toHaveLength(5);
    expect(response.body.products[0]).toMatchObject({
      id: expect.any(String),
      productName: expect.any(String),
      category: expect.any(String),
      verifiedStorePriceCount: expect.any(Number),
      currentOfferCount: expect.any(Number),
    });
  });

  it("searches by product name or brand", async () => {
    const response = await request(app.getHttpServer())
      .get("/products")
      .query({ q: "candle", postalCode: "T3M 1T4" })
      .expect(200);

    expect(response.body.postalCode).toBe("T3M 1T4");
    expect(response.body.total).toBeGreaterThan(0);

    for (const product of response.body.products) {
      expect(
        `${product.productName} ${product.brand ?? ""}`.toLowerCase(),
      ).toContain("candle");

      if (product.latestAdvertisedOffer) {
        expect(product.latestAdvertisedOffer).toMatchObject({
          retailerName: expect.any(String),
          marketKey: expect.any(String),
          marketMatch: expect.any(String),
          advertisedPrice: expect.any(Number),
          currency: "CAD",
          validUntil: expect.any(String),
        });
      }
    }
  });

  it("rejects invalid pagination", async () => {
    await request(app.getHttpServer())
      .get("/products")
      .query({ limit: 0 })
      .expect(400);
  });
});

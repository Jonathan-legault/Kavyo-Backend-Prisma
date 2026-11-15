import {
  AdvertisedOfferInput,
  evaluateAdvertisedOffer,
  selectBestAdvertisedOffer,
} from "./advertised-offer-pricing.js";
import {
  calculateStoreBasket,
  PriceObservationInput,
  RequestedBasketItem,
} from "./pricing.js";

const now = new Date("2026-11-15T18:00:00.000Z");

function advertisedOffer(
  overrides: Partial<AdvertisedOfferInput> = {},
): AdvertisedOfferInput {
  return {
    id: "offer-1",
    productId: "product-1",
    retailerId: "retailer-1",
    marketKey: "T3M1T4",
    advertisedPriceAmount: 2.5,
    regularPriceAmount: 4,
    currency: "CAD",
    promotionText: null,
    conditionEvidence: {
      isMemberPrice: false,
      isMultibuy: false,
      isPriceRange: false,
      isMultiVariant: false,
      reviewReasons: [],
    },
    observedAt: new Date("2026-11-14T12:00:00.000Z"),
    validFrom: new Date("2026-11-13T00:00:00.000Z"),
    validUntil: new Date("2026-11-20T00:00:00.000Z"),
    ...overrides,
  };
}

describe("advertised offer eligibility", () => {
  it("accepts a current, single-unit offer in the customer market", () => {
    const result = evaluateAdvertisedOffer(advertisedOffer(), now, {
      customerPostalCode: "T3M 1T4",
    });

    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.value.unitPrice).toBe(2.5);
      expect(result.value.marketMatch).toBe("CUSTOMER_POSTAL");
    }
  });

  it("rejects expired and not-yet-valid offers", () => {
    const expired = evaluateAdvertisedOffer(
      advertisedOffer({ validUntil: new Date("2026-11-15T12:00:00.000Z") }),
      now,
      {},
    );
    const future = evaluateAdvertisedOffer(
      advertisedOffer({ validFrom: new Date("2026-11-16T00:00:00.000Z") }),
      now,
      {},
    );

    expect(expired).toEqual({ eligible: false, reason: "EXPIRED" });
    expect(future).toEqual({ eligible: false, reason: "NOT_YET_VALID" });
  });

  it("rejects member, multibuy, price-range, and multi-variant offers", () => {
    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            isMemberPrice: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "MEMBER_PRICE" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            isMultibuy: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "MULTIBUY" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            isPriceRange: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "PRICE_RANGE" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            isMultiVariant: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "MULTI_VARIANT" });
  });

  it("rejects BOGO, free-item, coupon, and minimum-spend offers", () => {
    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            bogo: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "BOGO" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            freeItem: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "FREE_ITEM" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            requiresCoupon: true,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "COUPON" });

    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            minSpend: 25,
            reviewReasons: [],
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "MIN_SPEND" });
  });

  it("rejects an offer with unresolved review reasons", () => {
    expect(
      evaluateAdvertisedOffer(
        advertisedOffer({
          conditionEvidence: {
            reviewReasons: ["MEMBER_PRICE"],
            isMemberPrice: false,
          },
        }),
        now,
        {},
      ),
    ).toEqual({ eligible: false, reason: "REVIEW_REQUIRED" });
  });

  it("ranks exact postal code before FSA and marks other markets", () => {
    const exact = evaluateAdvertisedOffer(advertisedOffer(), now, {
      customerPostalCode: "T3M 1T4",
    });
    const fsa = evaluateAdvertisedOffer(
      advertisedOffer({ marketKey: "T3M9Z9" }),
      now,
      { customerPostalCode: "T3M 1T4" },
    );
    const storeFsa = evaluateAdvertisedOffer(
      advertisedOffer({ marketKey: "T3M9Z9" }),
      now,
      { storePostalCode: "T3M 2N9" },
    );
    const other = evaluateAdvertisedOffer(advertisedOffer(), now, {
      customerPostalCode: "T2A 4T8",
    });

    expect(exact.eligible && exact.value.marketRank).toBe(0);
    expect(fsa.eligible && fsa.value.marketRank).toBe(1);
    expect(storeFsa.eligible && storeFsa.value.marketRank).toBe(2);
    expect(other.eligible && other.value.marketMatch).toBe("OTHER_MARKET");
  });

  it("selects the closer market before a cheaper, newer other-market offer", () => {
    const best = selectBestAdvertisedOffer(
      [
        advertisedOffer({
          id: "exact",
          advertisedPriceAmount: 5,
          observedAt: new Date("2026-11-10T00:00:00.000Z"),
        }),
        advertisedOffer({
          id: "other",
          marketKey: "T2A4T8",
          advertisedPriceAmount: 1,
          observedAt: new Date("2026-11-15T00:00:00.000Z"),
        }),
      ],
      now,
      { customerPostalCode: "T3M 1T4" },
    );

    expect(best?.offer.id).toBe("exact");
  });
});

describe("basket pricing with advertised offers", () => {
  const requestedItems: RequestedBasketItem[] = [
    {
      productId: "product-1",
      productName: "Test product",
      quantity: 2,
    },
  ];

  it("uses a current flyer estimate and marks it as retailer-advertised", () => {
    const flyerObservation: PriceObservationInput = {
      productId: "product-1",
      storeId: "store-1",
      regularPrice: 4,
      salePrice: 2.5,
      currency: "CAD",
      observedAt: new Date("2026-11-12T00:00:00.000Z"),
      validFrom: new Date("2026-11-10T00:00:00.000Z"),
      validUntil: new Date("2026-11-20T00:00:00.000Z"),
      priceSource: "ADVERTISED_OFFER",
      advertisedOfferId: "offer-1",
      offerRetailerName: "Test Retailer",
      offerMarketKey: "T3M1T4",
      offerMarketMatch: "CUSTOMER_FSA",
      offerPromotionText: "2 for $5",
    };

    const result = calculateStoreBasket(
      "store-1",
      requestedItems,
      [flyerObservation],
      now,
    );

    expect(result.items[0]).toMatchObject({
      unitPrice: 2.5,
      lineTotal: 5,
      priceSource: "ADVERTISED_OFFER",
      priceConfidence: "RETAILER_ADVERTISED",
      advertisedOfferId: "offer-1",
      offerMarketMatch: "CUSTOMER_FSA",
    });
    expect(result.advertisedItemCount).toBe(1);
    expect(result.hasAdvertisedEstimate).toBe(true);
    // An older flyer observation is not a stale shelf-price observation.
    expect(result.hasStalePrice).toBe(false);
  });

  it("prefers a verified store observation over a cheaper advertised offer", () => {
    const verified: PriceObservationInput = {
      productId: "product-1",
      storeId: "store-1",
      regularPrice: 4,
      salePrice: 3.5,
      currency: "CAD",
      observedAt: new Date("2026-11-14T00:00:00.000Z"),
      validFrom: new Date("2026-11-13T00:00:00.000Z"),
      validUntil: new Date("2026-11-20T00:00:00.000Z"),
    };
    const advertised: PriceObservationInput = {
      ...verified,
      salePrice: 1.5,
      observedAt: new Date("2026-11-15T00:00:00.000Z"),
      priceSource: "ADVERTISED_OFFER",
      advertisedOfferId: "offer-1",
      offerRetailerName: "Test Retailer",
      offerMarketKey: "T3M1T4",
      offerMarketMatch: "CUSTOMER_POSTAL",
    };

    const result = calculateStoreBasket(
      "store-1",
      requestedItems,
      [advertised, verified],
      now,
    );

    expect(result.items[0].unitPrice).toBe(3.5);
    expect(result.items[0].priceSource).toBe("PRICE_OBSERVATION");
    expect(result.items[0].priceConfidence).toBe("STORE_VERIFIED");
    expect(result.hasAdvertisedEstimate).toBe(false);
  });
});

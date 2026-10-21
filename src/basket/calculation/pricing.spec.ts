import {
  calculateStoreBasket,
  pickCheapestCompleteStore,
  PriceObservationInput,
  RequestedBasketItem,
  selectEffectivePrice,
  toFiniteNumber,
  toNumber,
} from "./pricing.js";

const now = new Date("2026-10-21T18:00:00.000Z");

function observation(
  overrides: Partial<PriceObservationInput> = {},
): PriceObservationInput {
  return {
    productId: "product-1",
    storeId: "store-1",
    regularPrice: 8.29,
    salePrice: 5.49,
    currency: "CAD",
    observedAt: new Date("2026-10-20T18:00:00.000Z"),
    validFrom: new Date("2026-10-19T00:00:00.000Z"),
    validUntil: new Date("2026-10-25T00:00:00.000Z"),
    ...overrides,
  };
}

const requestedItems: RequestedBasketItem[] = [
  {
    productId: "product-1",
    productName: "Froot Loops",
    quantity: 2,
  },
  {
    productId: "product-2",
    productName: "Peanut Butter",
    quantity: 1,
  },
];

describe("numeric helpers", () => {
  it("keeps negative values for coordinates but rejects them for money", () => {
    expect(toFiniteNumber("-113.960445")).toBe(-113.960445);
    expect(toNumber("-113.960445")).toBeNull();
  });

  it("rejects non-finite and missing values", () => {
    expect(toFiniteNumber(Number.NaN)).toBeNull();
    expect(toFiniteNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });
});

describe("selectEffectivePrice", () => {
  it("uses an active sale price", () => {
    const result = selectEffectivePrice(observation(), now);

    expect(result).not.toBeNull();
    expect(result?.priceType).toBe("SALE");
    expect(result?.saleStatus).toBe("ACTIVE");
    expect(result?.unitPrice).toBe(5.49);
  });

  it("falls back to the regular price when the sale has expired", () => {
    const result = selectEffectivePrice(
      observation({
        validUntil: new Date("2026-10-08T00:00:00.000Z"),
      }),
      now,
    );

    expect(result).not.toBeNull();
    expect(result?.priceType).toBe("REGULAR");
    expect(result?.saleStatus).toBe("EXPIRED");
    expect(result?.unitPrice).toBe(8.29);
  });

  it("falls back to the regular price before a future sale starts", () => {
    const result = selectEffectivePrice(
      observation({
        validFrom: new Date("2026-10-24T00:00:00.000Z"),
      }),
      now,
    );

    expect(result?.priceType).toBe("REGULAR");
    expect(result?.saleStatus).toBe("SCHEDULED");
  });

  it("uses the regular price when no sale price exists", () => {
    const result = selectEffectivePrice(
      observation({ salePrice: null }),
      now,
    );

    expect(result?.priceType).toBe("REGULAR");
    expect(result?.saleStatus).toBe("NONE");
  });

  it("returns null when neither price is usable", () => {
    expect(
      selectEffectivePrice(
        observation({ regularPrice: null, salePrice: null }),
        now,
      ),
    ).toBeNull();
  });

  it("does not use an expired sale when no regular price exists", () => {
    expect(
      selectEffectivePrice(
        observation({
          regularPrice: null,
          salePrice: 5.49,
          validUntil: new Date("2026-10-08T00:00:00.000Z"),
        }),
        now,
      ),
    ).toBeNull();
  });
});

describe("calculateStoreBasket", () => {
  it("multiplies quantity and totals the basket", () => {
    const result = calculateStoreBasket(
      "store-1",
      requestedItems,
      [
        observation({ productId: "product-1", salePrice: 5.49 }),
        observation({
          productId: "product-2",
          regularPrice: 6.99,
          salePrice: null,
        }),
      ],
      now,
    );

    expect(result.isComplete).toBe(true);
    expect(result.missingItemCount).toBe(0);
    expect(result.items[0].lineTotal).toBe(10.98);
    expect(result.items[1].lineTotal).toBe(6.99);
    expect(result.productSubtotal).toBe(17.97);
  });

  it("reports missing products instead of treating them as free", () => {
    const result = calculateStoreBasket(
      "store-1",
      requestedItems,
      [observation({ productId: "product-1" })],
      now,
    );

    expect(result.isComplete).toBe(false);
    expect(result.availableItemCount).toBe(1);
    expect(result.missingItemCount).toBe(1);
    expect(result.missingProducts[0].productId).toBe("product-2");
    expect(result.productSubtotal).toBe(10.98);
  });

  it("uses the latest observation for a product", () => {
    const result = calculateStoreBasket(
      "store-1",
      [requestedItems[0]],
      [
        observation({
          regularPrice: 9.99,
          salePrice: null,
          observedAt: new Date("2026-10-19T00:00:00.000Z"),
        }),
        observation({
          regularPrice: 7.5,
          salePrice: null,
          observedAt: new Date("2026-10-20T00:00:00.000Z"),
        }),
      ],
      now,
    );

    expect(result.items[0].unitPrice).toBe(7.5);
    expect(result.productSubtotal).toBe(15);
  });

  it("ignores observations from another store", () => {
    const result = calculateStoreBasket(
      "store-1",
      [requestedItems[0]],
      [observation({ storeId: "store-2" })],
      now,
    );

    expect(result.isComplete).toBe(false);
    expect(result.missingItemCount).toBe(1);
  });
});

describe("pickCheapestCompleteStore", () => {
  it("selects the lowest complete total and ignores incomplete stores", () => {
    const stores = [
      { storeId: "a", isComplete: true, estimatedTotal: 40 },
      { storeId: "b", isComplete: true, estimatedTotal: 35 },
      { storeId: "c", isComplete: false, estimatedTotal: 20 },
      { storeId: "d", isComplete: true, estimatedTotal: null },
    ];

    expect(pickCheapestCompleteStore(stores)?.storeId).toBe("b");
  });

  it("returns null when no store is complete", () => {
    expect(
      pickCheapestCompleteStore([
        { storeId: "a", isComplete: false, estimatedTotal: 10 },
      ]),
    ).toBeNull();
  });
});

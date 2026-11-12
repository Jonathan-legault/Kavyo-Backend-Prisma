import { describe, expect, it } from "vitest";
import { parsePromotion, parseRegularPrice } from "./promotion.js";

describe("parsePromotion", () => {
  it("extracts a quantity-first multibuy and its per-item price", () => {
    const result = parsePromotion({
      productName: "Gatorade",
      saleStory: "3 for $7",
      itemPrice: 7,
    });

    expect(result).toMatchObject({
      type: "MULTIBUY",
      quantity: 3,
      totalPrice: 7,
      unitPrice: 2.3333,
      requiresMembership: false,
    });
    expect(result.notes).toContain("Quantity requirement: 3 for $7.00");
    expect(result.reviewReasons).toContain("MULTIBUY");
  });

  it("extracts a 2/$5 multibuy from price text", () => {
    const result = parsePromotion({
      productName: "Pasta sauce",
      priceText: "2/$5",
      itemPrice: 2.5,
    });

    expect(result).toMatchObject({
      type: "MULTIBUY",
      quantity: 2,
      totalPrice: 5,
      unitPrice: 2.5,
    });
  });

  it("extracts a price-first multibuy", () => {
    const result = parsePromotion({
      productName: "Soup",
      priceText: "$5 for 2",
      itemPrice: 5,
    });

    expect(result).toMatchObject({
      type: "MULTIBUY",
      quantity: 2,
      totalPrice: 5,
      unitPrice: 2.5,
    });
  });

  it("preserves a loyalty condition and the non-member price", () => {
    const result = parsePromotion({
      productName: "Cheese",
      priceText: "Scene+ Member Pricing",
      disclaimerText: "$6.99 without Scene+ Card",
      itemPrice: 5.99,
      regularPriceAmount: 6.99,
    });

    expect(result).toMatchObject({
      type: "MEMBER_PRICE",
      memberProgram: "Scene+",
      memberPriceAmount: 5.99,
      nonMemberPriceAmount: 6.99,
      requiresMembership: true,
      requiresLoyaltyCard: true,
    });
    expect(result.reviewReasons).toContain("MEMBER_PRICE");
    expect(result.conditions).toContain("Scene+ Member Pricing");
    expect(result.conditions).toContain("$6.99 without Scene+ Card");
  });

  it("does not treat a package size range as a price range", () => {
    const result = parsePromotion({
      productName: "Potato chips",
      descriptionText: "220-235 g",
      itemPrice: 3,
    });

    expect(result.type).toBe("NONE");
    expect(result.priceMin).toBeNull();
    expect(result.priceMax).toBeNull();
  });

  it("captures an explicit advertised price range", () => {
    const result = parsePromotion({
      productName: "Coffee",
      priceText: "Selected varieties $8.99 - $10.99",
      itemPrice: 8.99,
    });

    expect(result).toMatchObject({
      type: "PRICE_RANGE",
      priceMin: 8.99,
      priceMax: 10.99,
    });
    expect(result.reviewReasons).toContain("PRICE_RANGE");
  });

  it("captures Flipp current_price_range data", () => {
    const result = parsePromotion({
      productName: "Cereal",
      currentPriceRange: [3.99, 4.99],
    });

    expect(result).toMatchObject({
      type: "PRICE_RANGE",
      priceMin: 3.99,
      priceMax: 4.99,
    });
  });

  it("captures purchase limits and spend thresholds", () => {
    const limited = parsePromotion({
      productName: "Eggs",
      disclaimerText: "Limit 2 per customer",
    });
    const spend = parsePromotion({
      productName: "Groceries",
      saleStory: "Spend $50 and get 500 points",
    });

    expect(limited.purchaseLimit).toBe(2);
    expect(limited.reviewReasons).toContain("PURCHASE_LIMIT");
    expect(spend.minSpend).toBe(50);
    expect(spend.reviewReasons).toContain("SPEND_THRESHOLD");
    expect(spend.reviewReasons).toContain("POINTS_OFFER");
  });

  it("does not treat loyalty points as a member-only price", () => {
    const result = parsePromotion({
      productName: "Evaporated Milk",
      saleStory:
        "Get 500 Scene+ PTS When you spend $20 or more on these participating products",
      itemPrice: 1.79,
    });

    expect(result).toMatchObject({
      type: "SPEND_THRESHOLD",
      memberProgram: "Scene+",
      memberPriceAmount: null,
      nonMemberPriceAmount: null,
      requiresMembership: false,
      requiresLoyaltyCard: false,
      minSpend: 20,
    });
    expect(result.reviewReasons).toContain("POINTS_OFFER");
    expect(result.reviewReasons).not.toContain("MEMBER_PRICE");
  });

  it("captures a quantity requirement from a points offer without treating it as a multibuy", () => {
    const result = parsePromotion({
      productName: "Cookies",
      saleStory: "200 Scene+ PTS when you buy 2",
      itemPrice: 2.49,
    });

    expect(result).toMatchObject({
      type: "POINTS_OFFER",
      quantity: 2,
      totalPrice: null,
      unitPrice: null,
      requiresMembership: false,
      memberPriceAmount: null,
    });
    expect(result.reviewReasons).toContain("POINTS_OFFER");
    expect(result.reviewReasons).toContain("QUANTITY_REQUIREMENT");
    expect(result.reviewReasons).not.toContain("MULTIBUY");
  });

  it("treats an each-price quantity threshold as a multibuy", () => {
    const result = parsePromotion({
      productName: "Apple Pie",
      priceText: "$5.99 ea when you buy 2 or more",
      itemPrice: 5.99,
    });

    expect(result).toMatchObject({
      type: "MULTIBUY",
      quantity: 2,
      totalPrice: 11.98,
      unitPrice: 5.99,
    });
    expect(result.reviewReasons).toContain("MULTIBUY");
    expect(result.notes).toContain("Quantity requirement: 2+ at $5.99 each");
  });

  it("treats an explicit each-price multibuy as per-unit pricing", () => {
    const result = parsePromotion({
      productName: "Pasta",
      priceText: "2 for $2.49 each",
      itemPrice: 2.49,
    });

    expect(result).toMatchObject({
      type: "MULTIBUY",
      quantity: 2,
      totalPrice: 4.98,
      unitPrice: 2.49,
    });
  });

  it("captures BOGO and free-item conditions", () => {
    const bogo = parsePromotion({
      productName: "Cereal",
      saleStory: "Buy one get one free",
    });
    const multiBogo = parsePromotion({
      productName: "Cereal",
      saleStory: "Buy 2 get 1 free",
    });
    const free = parsePromotion({
      productName: "Coffee",
      saleStory: "Get a free mug with purchase",
    });

    expect(bogo.bogo).toBe(true);
    expect(bogo.reviewReasons).toContain("BOGO");
    expect(multiBogo.bogo).toBe(true);
    expect(multiBogo.reviewReasons).toContain("BOGO");
    expect(free.freeItem).toBe(true);
    expect(free.reviewReasons).toContain("FREE_ITEM");
  });

  it("captures in-store-only restrictions", () => {
    const result = parsePromotion({
      productName: "Milk",
      inStoreOnly: true,
      itemPrice: 4.99,
    });

    expect(result.inStoreOnly).toBe(true);
    expect(result.type).toBe("IN_STORE_ONLY");
  });

  it("treats a rollback label as a normal sale, not an ambiguous promotion", () => {
    const result = parsePromotion({
      productName: "Pop",
      saleStory: "Rollback",
      itemPrice: 6.94,
    });

    expect(result.type).toBe("NONE");
    expect(result.reviewReasons).toEqual([]);
  });
});

describe("parseRegularPrice", () => {
  it("reads regular price variants", () => {
    expect(parseRegularPrice("$6.99 without Scene+ Card")).toBe(6.99);
    expect(parseRegularPrice("3.49 without Scene+ Card")).toBe(3.49);
    expect(parseRegularPrice("Regular price $4.49")).toBe(4.49);
    expect(parseRegularPrice("Was $3.99")).toBe(3.99);
    expect(parseRegularPrice("Non-member price $5.49")).toBe(5.49);
  });

  it("ignores discounts that are not regular prices", () => {
    expect(parseRegularPrice("Save $3.00")).toBeNull();
  });
});

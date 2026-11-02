import { describe, expect, it } from "vitest";
import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from "../flipp/flipp.types.js";
import { classifyFamily, normalizeFlyerOffer } from "./flyer-normalizer.js";

const flyer: FlippFlyer = {
  id: 8205958,
  flyer_run_id: 1231723,
  name: "Weekly eFlyer",
  merchant: "Safeway",
  merchant_id: 2126,
  valid_from: "2026-10-29T03:00:00-04:00",
  valid_to: "2026-11-04T23:59:59-05:00",
  categories: ["Groceries"],
};

function item(overrides: Partial<FlippFlyerItem> = {}): FlippFlyerItem {
  return {
    id: 1049922801,
    flyer_id: flyer.id,
    name: "COMPLIMENTS Halloumi-Style, Feta or Bocconcini",
    brand: "Compliments",
    price: "5.99",
    valid_from: flyer.valid_from,
    valid_to: flyer.valid_to,
    cutout_image_url: "http://f.wishabi.net/page_items/example.jpg",
    ...overrides,
  };
}

function detail(overrides: Partial<FlippItemDetail> = {}): FlippItemDetail {
  return {
    id: 1049922801,
    flyer_id: flyer.id,
    name: "COMPLIMENTS Halloumi-Style, Feta or Bocconcini",
    description: "200 g",
    price_text: "Scene+ Member Pricing",
    disclaimer_text: "$6.99 without Scene+ Card",
    sale_story: "200 Scene+ PTS when you buy 2",
    sku: null,
    ...overrides,
  };
}

describe("normalizeFlyerOffer", () => {
  it("normalizes a member-priced cheese offer and flags the restriction", () => {
    const result = normalizeFlyerOffer({
      retailerName: "Safeway",
      flyer,
      item: item(),
      detail: detail(),
      observedAt: new Date("2026-10-30T12:00:00.000Z"),
    });

    expect(result).toMatchObject({
      productName: "COMPLIMENTS Halloumi-Style, Feta or Bocconcini",
      brand: "Compliments",
      packageSizeText: "200 g",
      quantityValue: 200,
      quantityUnit: "g",
      advertisedPriceAmount: 5.99,
      regularPriceAmount: 6.99,
      pricingBasis: "FIXED",
      unitPrice: 2.995,
      unitPriceBasis: "100g",
      isMemberPrice: true,
      isMultiVariant: true,
      status: "PENDING_REVIEW",
      reviewRequired: true,
    });
    expect(result.reviewReasons).toContain("MEMBER_PRICE");
    expect(result.reviewReasons).toContain("MULTI_VARIANT");
    expect(result.reviewReasons).toContain("NO_GTIN");
  });

  it("normalizes a fixed-price multi-pack without a barcode", () => {
    const result = normalizeFlyerOffer({
      retailerName: "Walmart",
      flyer: {
        ...flyer,
        id: 8203652,
        merchant: "Walmart",
        merchant_id: 234,
        name: "Flyer",
      },
      item: item({
        id: 1049776974,
        flyer_id: 8203652,
        name: "Coca-Cola Pop",
        brand: "Coca-Cola",
        price: "6.94",
      }),
      detail: detail({
        id: 1049776974,
        flyer_id: 8203652,
        name: "Coca-Cola Pop",
        description: "Pack. 12 x 355 mL. #9210738.",
        price_text: null,
        disclaimer_text: null,
        sale_story: "Rollback",
        sku: null,
      }),
      observedAt: new Date("2026-10-30T12:00:00.000Z"),
    });

    expect(result).toMatchObject({
      packageSizeText: "12 x 355 mL",
      quantityValue: 4260,
      quantityUnit: "ml",
      advertisedPriceAmount: 6.94,
      pricingBasis: "FIXED",
      unitPrice: 0.1629,
      unitPriceBasis: "100ml",
      family: "soft_drinks",
      isMultiVariant: false,
      status: "NORMALIZED",
      reviewRequired: false,
    });
    expect(result.matchKey).toContain("coca cola");
  });

  it("marks produce sold by weight as pending review", () => {
    const result = normalizeFlyerOffer({
      retailerName: "Calgary Co-op",
      flyer: {
        ...flyer,
        id: 8195613,
        merchant: "Calgary Co-op",
        merchant_id: 2051,
      },
      item: item({
        id: 1048929188,
        flyer_id: 8195613,
        name: "Broccoli Crowns",
        brand: null,
        price: "1.99",
      }),
      detail: detail({
        id: 1048929188,
        flyer_id: 8195613,
        name: "Broccoli Crowns",
        description: "Product of USA No. 1 Grade",
        price_text: "/lb $5.49/kg",
        disclaimer_text: null,
        sale_story: null,
      }),
    });

    expect(result).toMatchObject({
      pricingBasis: "PER_LB",
      quantityValue: null,
      unitPrice: 0.4387,
      unitPriceBasis: "100g",
      status: "PENDING_REVIEW",
    });
    expect(result.reviewReasons).toContain("PRICE_BY_WEIGHT");
  });

  it("does not classify a cheese-flavoured prepared snack as cheese", () => {
    expect(
      classifyFamily("Brar's jalapeno and cheese samosas", null),
    ).toBe("snacks");
  });

  it("classifies cream cheese as cheese, not milk", () => {
    expect(classifyFamily("Dairy-Free Cream Cheese", "210 g")).toBe("cheese");
  });

  it("classifies a cheese pizza as pizza", () => {
    expect(classifyFamily("Cheese Pizza", null)).toBe("pizza");
  });

  it("classifies pasta sauce as sauce", () => {
    expect(classifyFamily("Pasta Sauce", null)).toBe("sauce");
  });

  it("keeps a size range explicit and marks it approximate", () => {
    const result = normalizeFlyerOffer({
      retailerName: "Safeway",
      flyer,
      item: item({
        name: "Potato Chips",
        brand: null,
        price: "3.00",
      }),
      detail: detail({
        description: "220-235 g",
        price_text: null,
        disclaimer_text: null,
        sale_story: null,
      }),
    });

    expect(result).toMatchObject({
      quantityValue: 227.5,
      quantityUnit: "g",
      quantityIsApproximate: true,
      isPriceRange: true,
      status: "PENDING_REVIEW",
    });
    expect(result.reviewReasons).toContain("PACKAGE_SIZE_RANGE");
  });
});

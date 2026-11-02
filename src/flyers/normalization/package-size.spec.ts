import { describe, expect, it } from "vitest";
import {
  parsePackageSize,
  parsePriceWeight,
  unitPriceFromPackage,
  unitPriceFromWeight,
} from "./package-size.js";

describe("parsePackageSize", () => {
  it("parses a metric package size", () => {
    expect(parsePackageSize("454 g", "Butter")).toMatchObject({
      quantityValue: 454,
      quantityUnit: "g",
      isRange: false,
    });
  });

  it("normalizes litres to millilitres", () => {
    expect(parsePackageSize("2 L", "Milk")).toMatchObject({
      quantityValue: 2000,
      quantityUnit: "ml",
    });
  });

  it("multiplies a multi-pack", () => {
    expect(parsePackageSize("Pack. 12 x 355 mL. #9210738.", "Coca-Cola Pop"))
      .toMatchObject({
        quantityValue: 4260,
        quantityUnit: "ml",
      });
  });

  it("converts pounds to grams", () => {
    const result = parsePackageSize("4 lb", null);
    expect(result.quantityUnit).toBe("g");
    expect(result.quantityValue).toBeCloseTo(1814.369, 2);
  });

  it("uses the midpoint for a range and marks it approximate", () => {
    expect(parsePackageSize("220-235 g", "Potato Chips")).toMatchObject({
      quantityValue: 227.5,
      quantityUnit: "g",
      isRange: true,
      isApproximate: true,
    });
  });

  it("handles a mixed-unit range", () => {
    expect(parsePackageSize("750g-1kg Select varieties", "Kraft Peanut Butter"))
      .toMatchObject({
        quantityValue: 875,
        quantityUnit: "g",
        isRange: true,
        isApproximate: true,
      });
  });

  it("handles a package with an each price", () => {
    expect(parsePackageSize("Each. 710 mL.", "Bubble bath")).toMatchObject({
      quantityValue: 710,
      quantityUnit: "ml",
    });
  });

  it("handles a count pack", () => {
    expect(parsePackageSize("5 pk", "Avocados")).toMatchObject({
      quantityValue: 5,
      quantityUnit: "each",
    });
  });

  it("returns no quantity when the flyer has no size", () => {
    expect(
      parsePackageSize("Product of Canada", "Avocados"),
    ).toMatchObject({
      quantityValue: null,
      quantityUnit: null,
    });
  });
});

describe("parsePriceWeight", () => {
  it("uses the price text when a flyer advertises a per-pound price", () => {
    expect(
      parsePriceWeight("Product of USA No. 1 Grade", "/lb $5.49/kg"),
    ).toEqual({
      unit: "lb",
      referencePrice: 5.49,
    });
  });

  it("recognizes a sold-by-100g price", () => {
    expect(parsePriceWeight("sold by 100 g", null)).toEqual({
      unit: "100g",
      referencePrice: null,
    });
  });
});

describe("unit price helpers", () => {
  it("calculates a per-100g price", () => {
    expect(unitPriceFromPackage(4.99, 454, "g")).toEqual({
      value: 1.0991,
      basis: "100g",
    });
  });

  it("calculates a per-100ml price", () => {
    expect(unitPriceFromPackage(6.94, 4260, "ml")).toEqual({
      value: 0.1629,
      basis: "100ml",
    });
  });

  it("calculates a per-item price", () => {
    expect(unitPriceFromPackage(4.99, 5, "each")).toEqual({
      value: 0.998,
      basis: "each",
    });
  });

  it("converts a per-pound price to per-100g", () => {
    expect(unitPriceFromWeight(1.99, "lb")).toEqual({
      value: 0.4387,
      basis: "100g",
    });
  });
});

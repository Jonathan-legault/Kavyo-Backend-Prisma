import { describe, expect, it } from "vitest";
import { classifyLivingOffer, offerTemporalStatus, pricePresentation } from "./living-catalog-policy.js";

describe("living-catalog policy", () => {
  it("keeps unbranded produce with unknown package as an offer", () => {
    expect(classifyLivingOffer({ productName: "Blueberries", scopeStatus: "IN_SCOPE" }).decision).toBe("OFFER_ONLY");
  });
  it("does not split a grouped advertisement into canonical SKUs", () => {
    expect(classifyLivingOffer({ productName: "Pizza Pops or Strudels", packageSizeText: "326-380 g", isMultiVariant: true, scopeStatus: "IN_SCOPE" }).decision).toBe("OFFER_ONLY");
  });
  it("keeps complete identity as candidate only, not an insert instruction", () => {
    expect(classifyLivingOffer({ productName: "Rice", packageSizeText: "500 g", scopeStatus: "IN_SCOPE" }).decision).toBe("PRODUCT_CANDIDATE");
  });
  it("retains uncertain scope for review", () => {
    expect(classifyLivingOffer({ productName: "Adult slippers", scopeStatus: "REVIEW" }).decision).toBe("REVIEW_SCOPE");
  });
  it("rejects out-of-scope merchandise", () => {
    expect(classifyLivingOffer({ productName: "Car seat", scopeStatus: "OUT_OF_SCOPE" }).decision).toBe("REJECT_OUT_OF_SCOPE");
  });
  it("rejects missing product name", () => {
    expect(classifyLivingOffer({ productName: " ", scopeStatus: "IN_SCOPE" }).decision).toBe("REJECT_MISSING_NAME");
  });
  it("never fabricates a regular price", () => {
    expect(pricePresentation({ advertisedPriceAmount: 3.99, regularPriceAmount: null })).toEqual({
      advertisedPrice: 3.99, regularPrice: null, regularPriceLabel: "Price unavailable",
    });
  });
  it("preserves an observed regular price", () => {
    expect(pricePresentation({ advertisedPriceAmount: 3.99, regularPriceAmount: 5.49 }).regularPrice).toBe(5.49);
  });
  it("distinguishes upcoming/active/expired at exact instant", () => {
    const from = new Date("2026-11-12T07:00:00Z");
    const until = new Date("2026-11-19T06:59:59Z");
    expect(offerTemporalStatus(new Date("2026-11-12T06:59:59Z"), from, until)).toBe("UPCOMING");
    expect(offerTemporalStatus(from, from, until)).toBe("ACTIVE");
    expect(offerTemporalStatus(until, from, until)).toBe("ACTIVE");
    expect(offerTemporalStatus(new Date("2026-11-19T07:00:00Z"), from, until)).toBe("EXPIRED");
  });
  it("does not invent missing promotion dates", () => {
    expect(offerTemporalStatus(new Date(), null, null)).toBe("UNKNOWN");
  });
  it("rejects inverted date windows as unknown", () => {
    expect(offerTemporalStatus(new Date("2026-11-15T00:00:00Z"), new Date("2026-11-20T00:00:00Z"), new Date("2026-11-10T00:00:00Z"))).toBe("UNKNOWN");
  });
});

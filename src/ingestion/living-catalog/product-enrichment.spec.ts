import { describe, expect, it } from "vitest";
import { proposeProductEnrichment } from "./product-enrichment.js";

const existing = { productName: "Oikos Greek Yogurt", brand: "Oikos", barcode: null, quantityText: null };

describe("product enrichment proposals (no database writes)", () => {
  it("refuses unknown identity", () => {
    expect(proposeProductEnrichment(existing, {quantityText:"4 x 100 g",evidenceTier:"FLYER"},false).safeForAutomaticUpdate).toBe(false);
  });
  it("fills missing package on a confirmed identity", () => {
    const result=proposeProductEnrichment(existing,{quantityText:"4 x 100 g",evidenceTier:"FLYER"},true);
    expect(result.patch.quantityText).toBe("4 x 100 g");
  });
  it("does not treat flyer sku as verified GTIN", () => {
    const result=proposeProductEnrichment(existing,{verifiedBarcode:"12345",evidenceTier:"FLYER"},true);
    expect(result.patch.barcode).toBeUndefined();
  });
  it("permits separately verified barcode evidence", () => {
    const result=proposeProductEnrichment(existing,{verifiedBarcode:"012345678905",evidenceTier:"RETAILER_VERIFIED"},true);
    expect(result.patch.barcode).toBe("012345678905");
  });
  it("rejects a conflicting package identity without partial writes", () => {
    const result=proposeProductEnrichment({...existing,quantityText:"500 g"},{quantityText:"1 kg",evidenceTier:"FLYER"},true);
    expect(result.safeForAutomaticUpdate).toBe(false);
    expect(result.patch).toEqual({});
  });
  it("does not rewrite canonical names from a flyer headline", () => {
    const result=proposeProductEnrichment(existing,{productName:"Oikos various flavours",evidenceTier:"FLYER"},true);
    expect(result.conflicts).toContain("PRODUCT_NAME_CONFLICT");
  });
  it("ignores absent data rather than clearing existing attributes", () => {
    const result=proposeProductEnrichment(existing,{brand:null,evidenceTier:"FLYER"},true);
    expect(result.patch).toEqual({});
  });
});

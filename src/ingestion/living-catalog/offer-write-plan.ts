import { createHash } from "node:crypto";

/** Pure persistence plan. Nothing writes to the database until a reviewed adapter executes it. */
export interface OfferEvidence {
  sourceSystemId: string;
  retailerId: string;
  flyerExternalId: string;
  sourceRecordId: string;
  marketKey: string;
  productName: string;
  advertisedPriceAmount: number | null;
  regularPriceAmount: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  promotionText?: string | null;
  sourceUrl?: string | null;
  rawPayload: unknown;
}
export type PlannedOffer = { action: "UPSERT_OFFER"; stableKey: string; evidence: OfferEvidence }
  | { action: "HOLD"; reasons: string[] };

export function planAdvertisedOffer(evidence: OfferEvidence): PlannedOffer {
  const required = [
    ["SOURCE_SYSTEM", evidence.sourceSystemId],
    ["RETAILER", evidence.retailerId],
    ["FLYER", evidence.flyerExternalId],
    ["SOURCE_ITEM", evidence.sourceRecordId],
    ["MARKET", evidence.marketKey],
    ["PRODUCT_NAME", evidence.productName],
  ] as const;
  const reasons = required.filter(([, value]) => !value.trim()).map(([name]) => name + "_MISSING");
  if (evidence.validFrom && evidence.validUntil && evidence.validFrom.getTime() > evidence.validUntil.getTime()) {
    reasons.push("INVALID_VALIDITY_RANGE");
  }
  if (reasons.length) return { action: "HOLD", reasons };

  // Identity excludes price and batch/capture timestamps to remain stable across repeated captures.
  // Retailer + market are part of identity; overlapping region-specific offers must not collapse.
  const identity = [
    evidence.sourceSystemId.trim(), evidence.retailerId.trim(), evidence.flyerExternalId.trim(),
    evidence.sourceRecordId.trim(), evidence.marketKey.trim().toUpperCase(),
  ];
  const stableKey = createHash("sha256").update(JSON.stringify(identity)).digest("hex");
  return { action: "UPSERT_OFFER", stableKey, evidence };
}

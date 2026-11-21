/**
 * Phase B: pure decisions. Does not touch Prisma or create Product records.
 * An advertised offer and a canonical SKU are deliberately separate concepts.
 */
export type ScopeStatus = "IN_SCOPE" | "REVIEW" | "OUT_OF_SCOPE";
export type OfferDecision = "OFFER_ONLY" | "PRODUCT_CANDIDATE" | "REVIEW_SCOPE" | "REJECT_OUT_OF_SCOPE" | "REJECT_MISSING_NAME";
export type OfferTemporalStatus = "UPCOMING" | "ACTIVE" | "EXPIRED" | "UNKNOWN";

export interface LivingOfferInput {
  productName?: string | null;
  brand?: string | null;
  packageSizeText?: string | null;
  isMultiVariant?: boolean;
  isPriceRange?: boolean;
  quantityIsApproximate?: boolean;
  scopeStatus: ScopeStatus;
  advertisedPriceAmount?: number | null;
  regularPriceAmount?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
}

export function classifyLivingOffer(input: LivingOfferInput): { decision: OfferDecision; reasons: string[] } {
  if (!input.productName?.trim()) return { decision: "REJECT_MISSING_NAME", reasons: ["PRODUCT_NAME_MISSING"] };
  if (input.scopeStatus === "OUT_OF_SCOPE") return { decision: "REJECT_OUT_OF_SCOPE", reasons: ["OUT_OF_SCOPE"] };
  if (input.scopeStatus === "REVIEW") return { decision: "REVIEW_SCOPE", reasons: ["SCOPE_REQUIRES_REVIEW"] };
  const reasons: string[] = [];
  if (!input.packageSizeText?.trim()) reasons.push("PACKAGE_UNKNOWN");
  if (input.isMultiVariant) reasons.push("MULTIPLE_VARIANTS");
  if (input.isPriceRange) reasons.push("PACKAGE_OR_PRICE_RANGE");
  if (input.quantityIsApproximate) reasons.push("QUANTITY_APPROXIMATE");
  // An unbranded produce item is still a useful offer.
  if (reasons.length) return { decision: "OFFER_ONLY", reasons };
  return { decision: "PRODUCT_CANDIDATE", reasons: [] };
}

export function offerTemporalStatus(
  now: Date,
  validFrom?: Date | null,
  validUntil?: Date | null,
): OfferTemporalStatus {
  if (validFrom && validUntil && validFrom.getTime() > validUntil.getTime()) return "UNKNOWN";
  if (validFrom && now.getTime() < validFrom.getTime()) return "UPCOMING";
  if (validUntil && now.getTime() > validUntil.getTime()) return "EXPIRED";
  if (!validFrom && !validUntil) return "UNKNOWN";
  return "ACTIVE";
}

export function pricePresentation(input: Pick<LivingOfferInput, "advertisedPriceAmount" | "regularPriceAmount">) {
  const advertised = input.advertisedPriceAmount;
  const regular = input.regularPriceAmount;
  return {
    advertisedPrice: typeof advertised === "number" && Number.isFinite(advertised) && advertised > 0 ? advertised : null,
    regularPrice: typeof regular === "number" && Number.isFinite(regular) && regular > 0 ? regular : null,
    // Never synthesize a regular price from a promotional price.
    regularPriceLabel: typeof regular === "number" && Number.isFinite(regular) && regular > 0 ? null : "Price unavailable",
  };
}

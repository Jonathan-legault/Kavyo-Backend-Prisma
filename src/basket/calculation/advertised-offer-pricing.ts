import { toNumber, type NumericValue } from "./pricing.js";

export type AdvertisedOfferMarketMatch =
  | "CUSTOMER_POSTAL"
  | "CUSTOMER_FSA"
  | "STORE_FSA"
  | "OTHER_MARKET"
  | "UNSCOPED";

export type AdvertisedOfferExclusionReason =
  | "NO_PRODUCT"
  | "NOT_CAD"
  | "INVALID_PRICE"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "FUTURE_OBSERVATION"
  | "MISSING_CONDITIONS"
  | "MEMBER_PRICE"
  | "MULTIBUY"
  | "PRICE_RANGE"
  | "MULTI_VARIANT"
  | "BOGO"
  | "FREE_ITEM"
  | "COUPON"
  | "MIN_SPEND"
  | "REVIEW_REQUIRED";

export interface AdvertisedOfferInput {
  id: string;
  productId: string | null;
  retailerId: string;
  marketKey: string;
  advertisedPriceAmount: NumericValue;
  regularPriceAmount: NumericValue;
  currency: string;
  promotionText: string | null;
  conditionEvidence: unknown;
  observedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface AdvertisedOfferContext {
  customerPostalCode?: string | null;
  storePostalCode?: string | null;
}

export interface EligibleAdvertisedOffer {
  offer: AdvertisedOfferInput;
  unitPrice: number;
  marketMatch: AdvertisedOfferMarketMatch;
  marketRank: number;
  /** Present when the offer is a usable multibuy such as "2 for $5". */
  multibuy: {
    quantity: number;
    totalPrice: number;
    unitPrice: number;
  } | null;
}

export type AdvertisedOfferEvaluation =
  | { eligible: true; value: EligibleAdvertisedOffer }
  | { eligible: false; reason: AdvertisedOfferExclusionReason };

function normalizePostalCode(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function fsa(value: string): string {
  return value.slice(0, 3);
}

function conditionObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readConditionNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readReviewReasons(
  conditions: Record<string, unknown>,
): string[] {
  const topLevel = Array.isArray(conditions.reviewReasons)
    ? conditions.reviewReasons.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const normalized = conditionObject(conditions.normalizedPayload);
  const nested = normalized && Array.isArray(normalized.reviewReasons)
    ? normalized.reviewReasons.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  return [...new Set([...topLevel, ...nested])];
}

/**
 * A flyer offer is only usable for a basket estimate when its price is
 * current, its conditions are understood, and it is not a member-only,
 * price-range, or multi-variant offer that the single-unit basket cannot
 * represent. Multibuys such as "2 for $5" are allowed when a reliable
 * per-item price can be computed from the promotion; they are returned with
 * a `multibuy` label so the basket can surface the condition.
 *
 * Market matching is deliberately non-exclusive: a retailer-level offer from a
 * different flyer market is still returned, but ranked below an exact or
 * same-FSA match and marked OTHER_MARKET so the comparison can warn about it.
 */
export function evaluateAdvertisedOffer(
  offer: AdvertisedOfferInput,
  now: Date,
  context: AdvertisedOfferContext,
): AdvertisedOfferEvaluation {
  if (!offer.productId) {
    return { eligible: false, reason: "NO_PRODUCT" };
  }

  if (offer.currency !== "CAD") {
    return { eligible: false, reason: "NOT_CAD" };
  }

  const unitPrice = toNumber(offer.advertisedPriceAmount);

  if (unitPrice === null || unitPrice <= 0) {
    return { eligible: false, reason: "INVALID_PRICE" };
  }

  if (offer.validFrom && offer.validFrom > now) {
    return { eligible: false, reason: "NOT_YET_VALID" };
  }

  if (offer.validUntil && offer.validUntil <= now) {
    return { eligible: false, reason: "EXPIRED" };
  }

  if (offer.observedAt > now) {
    return { eligible: false, reason: "FUTURE_OBSERVATION" };
  }

  const conditions = conditionObject(offer.conditionEvidence);

  if (!conditions) {
    return { eligible: false, reason: "MISSING_CONDITIONS" };
  }

  const promotionType =
    typeof conditions.promotionType === "string"
      ? conditions.promotionType
      : typeof conditions.type === "string"
        ? conditions.type
        : "";

  if (
    conditions.isMemberPrice === true ||
    promotionType === "MEMBER_PRICE" ||
    conditions.requiresMembership === true
  ) {
    return { eligible: false, reason: "MEMBER_PRICE" };
  }

  // A multibuy such as "2 for $5" carries a computable per-item price, so it
  // can serve as a labelled basket estimate. Multibuys without a usable
  // quantity/total pair, or stacked with other unresolved conditions, stay
  // excluded from single-unit basket pricing.
  const multibuyQuantity = readConditionNumber(conditions.promotionQuantity);
  const multibuyTotalPrice = readConditionNumber(conditions.promotionTotalPrice);
  const multibuyUnitPrice = readConditionNumber(conditions.promotionUnitPrice);

  const isMultibuy =
    conditions.isMultibuy === true ||
    promotionType === "MULTIBUY" ||
    (multibuyQuantity !== null && multibuyTotalPrice !== null);

  let multibuy: EligibleAdvertisedOffer["multibuy"] = null;
  if (isMultibuy) {
    const derivedUnitPrice =
      multibuyQuantity !== null &&
      multibuyQuantity >= 2 &&
      multibuyTotalPrice !== null &&
      multibuyTotalPrice > 0
        ? Math.round((multibuyTotalPrice / multibuyQuantity) * 100) / 100
        : null;
    const usableUnitPrice = multibuyUnitPrice ?? derivedUnitPrice;

    if (
      multibuyQuantity === null ||
      multibuyQuantity < 2 ||
      multibuyTotalPrice === null ||
      multibuyTotalPrice <= 0 ||
      usableUnitPrice === null ||
      usableUnitPrice <= 0
    ) {
      return { eligible: false, reason: "MULTIBUY" };
    }

    multibuy = {
      quantity: multibuyQuantity,
      totalPrice: multibuyTotalPrice,
      unitPrice: usableUnitPrice,
    };
  }

  if (
    conditions.isPriceRange === true ||
    promotionType === "PRICE_RANGE" ||
    (conditions.priceMin !== null && conditions.priceMin !== undefined) ||
    (conditions.priceMax !== null && conditions.priceMax !== undefined)
  ) {
    return { eligible: false, reason: "PRICE_RANGE" };
  }

  if (
    conditions.isMultiVariant === true ||
    promotionType === "MULTI_VARIANT"
  ) {
    return { eligible: false, reason: "MULTI_VARIANT" };
  }

  if (promotionType === "BOGO" || conditions.bogo === true) {
    return { eligible: false, reason: "BOGO" };
  }

  if (promotionType === "FREE_ITEM" || conditions.freeItem === true) {
    return { eligible: false, reason: "FREE_ITEM" };
  }

  if (
    promotionType === "COUPON" ||
    conditions.requiresCoupon === true
  ) {
    return { eligible: false, reason: "COUPON" };
  }

  if (
    typeof conditions.minSpend === "number" &&
    conditions.minSpend > 0
  ) {
    return { eligible: false, reason: "MIN_SPEND" };
  }

  if (readReviewReasons(conditions).length > 0) {
    return { eligible: false, reason: "REVIEW_REQUIRED" };
  }

  const market = normalizePostalCode(offer.marketKey);
  const customer = normalizePostalCode(context.customerPostalCode);
  const store = normalizePostalCode(context.storePostalCode);

  let marketMatch: AdvertisedOfferMarketMatch = "UNSCOPED";
  let marketRank = 4;

  if (market) {
    if (customer && market === customer) {
      marketMatch = "CUSTOMER_POSTAL";
      marketRank = 0;
    } else if (customer && fsa(market) === fsa(customer)) {
      marketMatch = "CUSTOMER_FSA";
      marketRank = 1;
    } else if (store && fsa(market) === fsa(store)) {
      marketMatch = "STORE_FSA";
      marketRank = 2;
    } else if (customer || store) {
      marketMatch = "OTHER_MARKET";
      marketRank = 3;
    }
  }

  return {
    eligible: true,
    value: {
      offer,
      unitPrice,
      marketMatch,
      marketRank,
      multibuy,
    },
  };
}

/**
 * Picks one advertised offer for a product. A more specific market match wins
 * before recency, and the lower price wins when two offers are equally close.
 */
export function selectBestAdvertisedOffer(
  offers: AdvertisedOfferInput[],
  now: Date,
  context: AdvertisedOfferContext,
): EligibleAdvertisedOffer | null {
  const eligible = offers
    .map((offer) => evaluateAdvertisedOffer(offer, now, context))
    .filter(
      (result): result is { eligible: true; value: EligibleAdvertisedOffer } =>
        result.eligible,
    )
    .map((result) => result.value)
    .sort(
      (left, right) =>
        left.marketRank - right.marketRank ||
        right.offer.observedAt.getTime() - left.offer.observedAt.getTime() ||
        left.unitPrice - right.unitPrice,
    );

  return eligible[0] ?? null;
}

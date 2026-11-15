import { planAdvertisedOffer, type OfferEvidence } from './offer-write-plan.js';

/** Pure, deterministic mapping from a Flipp StagedOffer to the durable offer model. */
export interface FlippStagedOfferRow {
  id: string;
  sourceSystemId: string;
  retailerId: string | null;
  sourceRecordId: string | null;
  recordKey: string;
  productName: string;
  packageSizeText: string | null;
  advertisedPriceAmount: { toString(): string } | null;
  regularPriceAmount: { toString(): string } | null;
  currency: string;
  promotionText: string | null;
  offerComment: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  observedAt: Date;
  sourceUrl: string | null;
  rawPayload: unknown;
  normalizedPayload: unknown;
  reviewReasons: unknown;
  isMemberPrice: boolean;
  isMultibuy: boolean;
  isMultiVariant: boolean;
  isPriceRange: boolean;
  quantityIsApproximate: boolean;
  flyerId: string | null;
  flyer: { externalId: string; postalCode: string | null } | null;
}

export interface PreparedAdvertisedOffer {
  stableKey: string;
  sourceStagedOfferId: string;
  sourceSystemId: string;
  retailerId: string;
  flyerId: string | null;
  flyerExternalId: string;
  sourceRecordId: string;
  marketKey: string;
  productName: string;
  packageSizeText: string | null;
  advertisedPriceAmount: string | null;
  regularPriceAmount: string | null;
  currency: string;
  promotionText: string | null;
  conditionEvidence: Record<string, unknown>;
  sourceUrl: string | null;
  rawPayload: unknown;
  observedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
}
export type PreparedResult = { kind: 'READY'; offer: PreparedAdvertisedOffer }
  | { kind: 'HOLD'; stagedOfferId: string; reasons: string[] };

const toDecimal = (value: { toString(): string } | null): string | null => {
  if (value == null) return null;
  const s = value.toString();
  return Number.isFinite(Number(s)) ? s : null;
};

export function prepareFlippAdvertisedOffer(row: FlippStagedOfferRow): PreparedResult {
  const reasons: string[] = [];
  if (!row.retailerId) reasons.push('RETAILER_ID_MISSING');
  if (!row.flyer?.externalId || !row.flyerId) reasons.push('FLYER_IDENTITY_MISSING');
  if (!row.flyer?.postalCode?.trim()) reasons.push('MARKET_KEY_MISSING');
  if (!row.sourceRecordId?.trim()) reasons.push('SOURCE_RECORD_ID_MISSING');
  if (reasons.length) return { kind: 'HOLD', stagedOfferId: row.id, reasons };
  const evidence: OfferEvidence = {
    sourceSystemId: row.sourceSystemId,
    retailerId: row.retailerId!,
    flyerExternalId: row.flyer!.externalId,
    sourceRecordId: row.sourceRecordId!,
    marketKey: row.flyer!.postalCode!.replace(/\s+/g, '').toUpperCase(),
    productName: row.productName,
    advertisedPriceAmount: row.advertisedPriceAmount == null ? null : Number(row.advertisedPriceAmount.toString()),
    regularPriceAmount: row.regularPriceAmount == null ? null : Number(row.regularPriceAmount.toString()),
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    promotionText: row.promotionText,
    sourceUrl: row.sourceUrl,
    rawPayload: row.rawPayload,
  };
  const plan = planAdvertisedOffer(evidence);
  if (plan.action === 'HOLD') return { kind: 'HOLD', stagedOfferId: row.id, reasons: plan.reasons };
  return {
    kind: 'READY', offer: {
      stableKey: plan.stableKey,
      sourceStagedOfferId: row.id,
      sourceSystemId: row.sourceSystemId,
      retailerId: row.retailerId!,
      flyerId: row.flyerId,
      flyerExternalId: row.flyer!.externalId,
      sourceRecordId: row.sourceRecordId!,
      marketKey: row.flyer!.postalCode!.replace(/\s+/g, '').toUpperCase(),
      productName: row.productName,
      packageSizeText: row.packageSizeText,
      advertisedPriceAmount: toDecimal(row.advertisedPriceAmount),
      regularPriceAmount: toDecimal(row.regularPriceAmount),
      currency: row.currency,
      promotionText: row.promotionText,
      conditionEvidence: {
        sourceStagedOfferId: row.id,
        offerComment: row.offerComment,
        isMemberPrice: row.isMemberPrice,
        isMultibuy: row.isMultibuy,
        isMultiVariant: row.isMultiVariant,
        isPriceRange: row.isPriceRange,
        quantityIsApproximate: row.quantityIsApproximate,
        reviewReasons: row.reviewReasons,
        normalizedPayload: row.normalizedPayload,
      },
      sourceUrl: row.sourceUrl,
      rawPayload: row.rawPayload,
      observedAt: row.observedAt,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
    },
  };
}

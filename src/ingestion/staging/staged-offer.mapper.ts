
import { createHash } from 'node:crypto';

import { validateOffer } from '../validation/offer-validator.js';

import type { NormalizedOffer } from '../contracts/normalized-offer.js';

export interface PreparedStagedOffer {
  recordKey: string;
  sourceRecordId?: string;
  sourceReference?: string;

  retailerName: string;
  storeIdentifier?: string;
  applicability?: string;

  productName: string;
  brand?: string;

  offerComment: string | null;

  advertisedPriceText?: string;
  advertisedPriceAmount?: number;
  advertisedPriceUnit?: string;

  extractionMethod: NormalizedOffer['extractionMethod'];

  status: 'PENDING_REVIEW';
  reviewRequired: boolean;
  reviewReasons: string[];

  normalizedPayload: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
}

export function prepareStagedOffers(
  offers: NormalizedOffer[],
): PreparedStagedOffer[] {
  const seenKeys = new Set<string>();

  return offers.map((offer, index) => {
    // Prefer an identifier supplied by the adapter.
    // Use the position as a fallback when no ID exists.
    const sourceIdentity =
      offer.sourceRecordId?.trim() || `position:${index}`;

    // Generate a fixed-length, reproducible record key.
    const recordKey = createHash('sha256')
      .update(
        JSON.stringify([
          offer.sourceSystem,
          sourceIdentity,
        ]),
      )
      .digest('hex');

    // Reject duplicate identities rather than silently
    // discarding potentially important source records.
    if (seenKeys.has(recordKey)) {
      throw new Error(
        `Duplicate source record: ${sourceIdentity}`,
      );
    }

    seenKeys.add(recordKey);

    const validation = validateOffer({
      productName: offer.productName,
      brand: offer.brand,
      retailerName: offer.retailerName,
      storeIdentifier: offer.storeIdentifier,

      advertisedPriceAmount: offer.advertisedPriceAmount,
      quantityValue: offer.quantityValue,
      quantityUnit: offer.quantityUnit,
      quantityText: offer.quantityText,
      advertisedPriceUnit: offer.advertisedPriceUnit,

      promotionText: offer.promotionText,
      loyaltyCondition: offer.loyaltyCondition,
      minimumPurchaseQuantity: offer.minimumPurchaseQuantity,
      priceRestriction: offer.priceRestriction,
    });

    // Convert the normalized offer into a JSON-safe
    // object, omitting undefined properties.
    const normalizedPayload = JSON.parse(
      JSON.stringify(offer),
    ) as Record<string, unknown>;

    return {
      recordKey,
      sourceRecordId: offer.sourceRecordId,
      sourceReference: offer.sourceReference,

      retailerName: offer.retailerName,
      storeIdentifier: offer.storeIdentifier,
      applicability: offer.applicability,

      productName: offer.productName,
      brand: offer.brand,

      advertisedPriceText: offer.advertisedPriceText,
      advertisedPriceAmount: offer.advertisedPriceAmount,
      advertisedPriceUnit: offer.advertisedPriceUnit,

      extractionMethod: offer.extractionMethod,

      status: 'PENDING_REVIEW',
      reviewRequired: validation.reviewRequired,
      reviewReasons: validation.reasons,
      offerComment: validation.offerComment,

      normalizedPayload,
      rawPayload: offer.rawPayload
        ? (JSON.parse(JSON.stringify(offer.rawPayload)) as Record<
          string,
          unknown
        >)
        : undefined,
    };
  });
}

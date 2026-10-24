
import type { NormalizedOffer } from '../contracts/normalized-offer.js';

export interface DocuPipeProduct {
  productName: string;
  brand: string | null;
  advertisedPrice: string | null;
  numericPrice: number | null;
  priceUnit: string | null;
  packageSize: string | null;
  equivalentPrice: string | null;
  multibuyQuantity?: number | null;
  multibuyTotalPrice?: number | null;
}

export interface DocuPipeOfferGrouping {
  offerTitle: string;
  pageNumber: number;
  promotionConditions: string | null;
  scenePointsOffer: string | null;
  scenePointsCondition: string | null;
  eligibleProducts: DocuPipeProduct[];
}

export interface DocuPipeContext {
  documentId: string;
  groupIndex: number;
  retailerName: string;
  region?: string;
  observedAt: string;
  validFrom: string;
  validUntil: string;
}

export function adaptDocuPipeGrouping(
  grouping: DocuPipeOfferGrouping,
  context: DocuPipeContext,
): NormalizedOffer[] {
  return grouping.eligibleProducts.map((product, productIndex) => {
    const reviewReasons: string[] = ['BARCODE_MISSING'];

    // ----------------------------------------
    // 1. Detect member-only pricing
    // ----------------------------------------

    const memberPriceInConditions =
      grouping.promotionConditions?.match(
        /\bMEMBER(?:S)?\s+(?:PRICE|PRICING)\s*\$?\s*(\d+(?:\.\d{1,2})?)\b/i,
      );

    const isMemberOnlyPrice =
      /\bMEMBER(?:S)?\s+(?:PRICE|PRICING)\b/i.test(
        product.advertisedPrice ?? '',
      ) ||
      (
        memberPriceInConditions != null &&
        product.numericPrice != null &&
        Math.round(product.numericPrice * 100) ===
          Math.round(Number(memberPriceInConditions[1]) * 100)
      );

    if (isMemberOnlyPrice) {
      reviewReasons.push('MEMBER_ONLY_PRICE');
    }

    // ----------------------------------------
    // 2. Detect starting-at pricing
    // ----------------------------------------

    const isStartingAtPrice =
      /\bSTARTING\s+AT\b/i.test(
        product.advertisedPrice ?? '',
      );

    if (isStartingAtPrice) {
      reviewReasons.push('STARTING_PRICE_REQUIRES_REVIEW');
    }

    // ----------------------------------------
    // 3. Extract Scene+ loyalty points
    // ----------------------------------------

    const pointsMatch = grouping.scenePointsOffer?.match(
      /^\s*([\d,]+)\s*PTS\s*$/i,
    );

    const loyaltyPoints = pointsMatch
      ? Number(pointsMatch[1].replace(/,/g, ''))
      : undefined;

    if (
      grouping.scenePointsOffer &&
      loyaltyPoints === undefined
    ) {
      reviewReasons.push('LOYALTY_POINTS_UNPARSED');
    }

    // ----------------------------------------
    // 4. Validate price availability
    // ----------------------------------------

    if (product.numericPrice === null) {
      reviewReasons.push('PRICE_REQUIRES_REVIEW');
    }

    // ----------------------------------------
    // 5. Validate price units
    // ----------------------------------------

    if (
      product.priceUnit == null &&
      product.numericPrice != null
    ) {
      reviewReasons.push('PRICE_UNIT_UNKNOWN');
    } else if (
      product.priceUnit !== null &&
      product.priceUnit !== 'each'
    ) {
      reviewReasons.push('PRICE_UNIT_REQUIRES_NORMALIZATION');
    }

    // ----------------------------------------
    // 6. Handle multibuy promotions
    // ----------------------------------------

    const multibuyText =
      product.multibuyQuantity != null &&
      product.multibuyTotalPrice != null
        ? `Multibuy: ${product.multibuyQuantity} for $${product.multibuyTotalPrice.toFixed(2)}`
        : null;

    if (multibuyText !== null) {
      reviewReasons.push('MULTIBUY_REQUIRES_REVIEW');
    }

    // ----------------------------------------
    // 7. Preserve promotion information
    // ----------------------------------------

    const promotionText = [
      product.advertisedPrice,
      multibuyText,
      product.equivalentPrice,
      grouping.promotionConditions,
      grouping.scenePointsOffer,
      grouping.scenePointsCondition,
    ]
      .filter((value) => value != null && value !== '')
      .join(' | ');

    // ----------------------------------------
    // 8. Build normalized offer
    // ----------------------------------------

    return {
      sourceSystem: 'DOCUPIPE',

      sourceRecordId:
        `${context.documentId}:p${grouping.pageNumber}` +
        `:g${context.groupIndex + 1}:i${productIndex + 1}`,

      sourceReference: grouping.offerTitle,

      retailerName: context.retailerName,
      applicability: context.region,

      productName: product.productName.trim(),
      brand: product.brand?.trim() || undefined,
      quantityText: product.packageSize ?? undefined,

      // Preserve original extracted price information
      advertisedPriceText:
        product.advertisedPrice ?? undefined,

      advertisedPriceAmount:
        product.numericPrice ?? undefined,

      advertisedPriceUnit:
        product.priceUnit ?? undefined,

      // Only assign an unrestricted per-item price
      salePrice:
        product.priceUnit === 'each' &&
        !isMemberOnlyPrice &&
        !isStartingAtPrice
          ? product.numericPrice ?? undefined
          : undefined,

      // Preserve member-only prices separately
      memberPrice:
        isMemberOnlyPrice &&
        !isStartingAtPrice &&
        product.priceUnit === 'each'
          ? product.numericPrice ?? undefined
          : undefined,

      // Identify conditional price restrictions
      priceRestriction:
        isMemberOnlyPrice
          ? 'MEMBER_ONLY'
          : isStartingAtPrice
            ? 'STARTING_AT'
            : undefined,

      currency: 'CAD',

      observedAt: context.observedAt,
      validFrom: context.validFrom,
      validUntil: context.validUntil,

      promotionText,

      // Scene+ loyalty information
      loyaltyProgram:
        loyaltyPoints !== undefined
          ? 'Scene+'
          : undefined,

      loyaltyPoints,

      loyaltyCondition:
        loyaltyPoints !== undefined
          ? grouping.scenePointsCondition ?? undefined
          : undefined,

      extractionMethod: 'DOCUMENT',

      // No flyer offer is automatically approved
      reviewRequired: true,
      reviewReasons,
    };
  });
}

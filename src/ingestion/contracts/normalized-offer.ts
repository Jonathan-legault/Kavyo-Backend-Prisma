/**
 * Source-neutral candidate produced by an ingestion adapter.
 * This is NOT an approved price observation and must not be written directly
 * to Product or PriceObservation without matching and verification.
 */
export interface NormalizedOffer {
  sourceSystem: string;
  sourceRecordId?: string;
  sourceUrl?: string;
  sourceReference?: string;

  // Identifies the original advertisement shared by products.
  promotionGroupId?: string;

// Original source data, preserved without normalization.
  rawPayload?: Record<string, unknown>;

  retailerName: string;
  storeIdentifier?: string;
  retrievalPostalCode?: string;
  /** Where the offer applies, which may be broader than retrieval postal code. */
  applicability?: string;

  productName: string;
  brand?: string;
  barcode?: string;
  quantityValue?: number;
  quantityUnit?: string;
  quantityText?: string;

  regularPrice?: number;
  salePrice?: number;
  currency: 'CAD';

  observedAt: string;
  validFrom?: string;
  validUntil?: string;

  /** Preserve complex promotion text until rules can be modeled explicitly. */
  promotionText?: string;
  extractionMethod: 'API' | 'DOCUMENT' | 'IMAGE' | 'MANUAL';
  reviewRequired: boolean;
  reviewReasons: string[];

  loyaltyProgram?: string;
  loyaltyPoints?: number;
  loyaltyCondition?: string;


  advertisedPriceText?: string;
  advertisedPriceAmount?: number;
  advertisedPriceUnit?: string;


  memberPrice?: number;
  priceRestriction?: 'MEMBER_ONLY' | 'STARTING_AT';
  minimumPurchaseQuantity?: number;


}

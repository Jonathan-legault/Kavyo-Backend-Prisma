import type { NormalizedOffer } from '../contracts/normalized-offer.js';

export interface SampleFlyerItem {
  id?: string;
  name: string;
  retailer: string;
  price?: number;
  regular_price?: number;
  brand?: string;
  barcode?: string;
  size?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface SampleFlyerPayload {
  source: string;
  postal_code: string;
  retrieved_at: string;
  items: SampleFlyerItem[];
}

/**
 * Proof-of-concept adapter for our OWN fixture format. This is not a
 * third-party flyer API contract; each real provider gets its own adapter.
 * Produces candidates only; database persistence comes later.
 */
export function adaptSampleFlyer(payload: SampleFlyerPayload): NormalizedOffer[] {
  return payload.items.map((item) => {
    const reasons: string[] = [];
    if (!item.barcode) reasons.push('BARCODE_MISSING');
    if (item.price == null && item.regular_price == null) reasons.push('PRICE_MISSING');
    if (!item.valid_until) reasons.push('EXPIRY_UNKNOWN');

    return {
      sourceSystem: payload.source,
      sourceRecordId: item.id,
      retailerName: item.retailer.trim(),
      retrievalPostalCode: payload.postal_code.toUpperCase().replace(/\s+/g, ''),
      productName: item.name.trim(),
      brand: item.brand?.trim(),
      barcode: item.barcode,
      quantityText: item.size,
      regularPrice: item.regular_price,
      salePrice: item.price,
      currency: 'CAD',
      observedAt: payload.retrieved_at,
      validFrom: item.valid_from,
      validUntil: item.valid_until,
      extractionMethod: 'API',
      reviewRequired: reasons.length > 0,
      reviewReasons: reasons,
    };
  });
}

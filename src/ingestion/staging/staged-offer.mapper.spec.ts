
import { describe, expect, it } from 'vitest';

import { prepareStagedOffers } from './staged-offer.mapper.js';
import type { NormalizedOffer } from '../contracts/normalized-offer.js';

const testOffer: NormalizedOffer = {
  sourceSystem: 'DOCUPIPE',
  sourceRecordId: 'safeway:p1:g1:i1',
  sourceReference: 'KRAFT Peanut Butter',

  retailerName: 'Safeway',
  productName: 'KRAFT Peanut Butter',
  brand: 'KRAFT',

  advertisedPriceText: '$4.97 ea',
  advertisedPriceAmount: 4.97,
  advertisedPriceUnit: 'each',

  salePrice: 4.97,
  currency: 'CAD',

  observedAt: '2026-10-24T20:00:00.000Z',
  validFrom: '2026-10-22',
  validUntil: '2026-10-28',

  extractionMethod: 'DOCUMENT',
  reviewRequired: true,
  reviewReasons: ['BARCODE_MISSING'],
};

describe('prepareStagedOffers', () => {
  it('prepares a normalized offer for staging', () => {
    const result = prepareStagedOffers([testOffer]);

    expect(result).toHaveLength(1);

    expect(result[0].productName)
      .toBe('KRAFT Peanut Butter');

    expect(result[0].advertisedPriceAmount)
      .toBe(4.97);

    expect(result[0].recordKey)
      .toMatch(/^[a-f0-9]{64}$/);

    expect(result[0].status)
      .toBe('PENDING_REVIEW');

    expect(result[0].reviewRequired)
      .toBe(true);

    expect(result[0].normalizedPayload.salePrice)
      .toBe(4.97);
  });

  it('generates the same key for the same source record', () => {
    const first = prepareStagedOffers([testOffer]);
    const second = prepareStagedOffers([testOffer]);

    expect(first[0].recordKey)
      .toBe(second[0].recordKey);
  });

  it('rejects duplicate source records in one batch', () => {
    expect(() =>
      prepareStagedOffers([
        testOffer,
        testOffer,
      ]),
    ).toThrow('Duplicate source record');
  });

  it('supports another ingestion source', () => {
    const apiOffer: NormalizedOffer = {
      ...testOffer,
      sourceSystem: 'FLYERS_API',
      extractionMethod: 'API',
    };

    const result = prepareStagedOffers([apiOffer]);

    expect(result[0].extractionMethod).toBe('API');

    expect(result[0].recordKey)
      .not.toBe(
        prepareStagedOffers([testOffer])[0].recordKey,
      );
  });
});

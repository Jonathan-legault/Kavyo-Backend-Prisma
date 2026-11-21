import { describe, expect, it } from 'vitest';
import { prepareFlippAdvertisedOffer, type FlippStagedOfferRow } from './staged-offer-promotion.js';

const base: FlippStagedOfferRow = {
  id: 'stage-1', sourceSystemId: 'source-1', retailerId: 'retailer-1',
  flyerId: 'flyer-uuid', flyer: { externalId: 'flyer-101', postalCode: 'T3M 1T4' },
  sourceRecordId: 'item-123', recordKey: 'abc', productName: 'Blueberries',
  packageSizeText: null, advertisedPriceAmount: { toString: () => '2.990' },
  regularPriceAmount: null, currency: 'CAD', promotionText: 'With card', offerComment: 'Limits apply',
  validFrom: new Date('2026-11-12T07:00:00Z'), validUntil: new Date('2026-11-19T06:59:59Z'),
  observedAt: new Date('2026-11-11T18:00:00Z'), sourceUrl: 'https://example.test/item',
  rawPayload: { original: true }, normalizedPayload: { title: 'Blueberries' },
  reviewReasons: ['MULTI_VARIANT'], isMemberPrice: true, isMultibuy: false,
  isMultiVariant: true, isPriceRange: false, quantityIsApproximate: false,
};

describe('staged offer promotion preparation', () => {
  it('preserves missing package and regular price', () => {
    const p = prepareFlippAdvertisedOffer(base);
    expect(p.kind).toBe('READY');
    if (p.kind === 'READY') {
      expect(p.offer.regularPriceAmount).toBeNull();
      expect(p.offer.advertisedPriceAmount).toBe('2.990');
      expect(p.offer.packageSizeText).toBeNull();
      expect(p.offer.conditionEvidence.isMultiVariant).toBe(true);
    }
  });
  it('generates same stable key for recapture at a different price', () => {
    const a = prepareFlippAdvertisedOffer(base);
    const b = prepareFlippAdvertisedOffer({...base, advertisedPriceAmount: {toString: () => '1.990'}});
    if (a.kind !== 'READY' || b.kind !== 'READY') throw Error('Unexpected hold');
    expect(a.offer.stableKey).toBe(b.offer.stableKey);
  });
  it('distinguishes different retailers and postal markets', () => {
    const a = prepareFlippAdvertisedOffer(base);
    const b = prepareFlippAdvertisedOffer({...base, retailerId: 'retailer-2'});
    const c = prepareFlippAdvertisedOffer({...base, flyer:{externalId: 'flyer-101', postalCode: 'T2A4T8'}});
    if (a.kind !== 'READY' || b.kind !== 'READY' || c.kind !== 'READY') throw Error('Unexpected hold');
    expect(a.offer.stableKey).not.toBe(b.offer.stableKey);
    expect(a.offer.stableKey).not.toBe(c.offer.stableKey);
  });
  it('holds records with missing identity rather than inventing one', () => {
    expect(prepareFlippAdvertisedOffer({...base, flyer: null}).kind).toBe('HOLD');
    expect(prepareFlippAdvertisedOffer({...base, sourceRecordId: null}).kind).toBe('HOLD');
    expect(prepareFlippAdvertisedOffer({...base, retailerId: null}).kind).toBe('HOLD');
  });
  it('retains exact validity timestamps', () => {
    const p = prepareFlippAdvertisedOffer(base);
    if (p.kind !== 'READY') throw Error('Unexpected hold');
    expect(p.offer.validUntil?.toISOString()).toBe('2026-11-19T06:59:59.000Z');
  });
});

import { describe, expect, it } from 'vitest';
import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from '../flipp/flipp.types.js';
import { normalizeFlyerOffer } from './flyer-normalizer.js';

const flyer: FlippFlyer = {
  id: 8212267,
  flyer_run_id: 1231723,
  name: 'Weekly eFlyer',
  merchant: 'Sobeys',
  merchant_id: 1,
  valid_from: '2026-11-05T01:00:00-05:00',
  valid_to: '2026-11-11T23:59:59-05:00',
};

type DetailWithOriginalLabel = FlippItemDetail & { pre_price_text?: string | null };

function normalizeExample(
  name: string,
  price: string | null,
  description: string,
  promotion: string | null,
  options: {
    priceText?: string | null;
    prePriceText?: string | null;
    disclaimer?: string | null;
  } = {},
) {
  const item: FlippFlyerItem = {
    id: 1051036269,
    flyer_id: flyer.id,
    name,
    brand: null,
    price,
    valid_from: flyer.valid_from,
    valid_to: flyer.valid_to,
    pre_price_text: options.prePriceText ?? null,
  };
  const detail: DetailWithOriginalLabel = {
    id: item.id,
    flyer_id: flyer.id,
    name,
    description,
    sale_story: promotion,
    price_text: options.priceText ?? null,
    pre_price_text: options.prePriceText ?? null,
    disclaimer_text: options.disclaimer ?? null,
    sku: null,
  };
  return normalizeFlyerOffer({
    retailerName: 'Sobeys',
    flyer,
    item,
    detail,
    observedAt: new Date('2026-11-07T12:00:00.000Z'),
  });
}

describe('source-aware promotion preservation regression', () => {
  it('recognizes a member price identified in pre_price_text and parses the nonmember price', () => {
    const result = normalizeExample(
      'Superfries', '2.49', '454 g', 'MEMBERS SAVE 50¢',
      { prePriceText: 'Scene+ Member Pricing', disclaimer: '$2.99 without Scene+ Card' },
    );
    expect(result.isMemberPrice).toBe(true);
    expect(result.regularPriceAmount).toBe(2.99);
    expect(result.promotionText).toContain('MEMBERS SAVE 50¢');
    expect(result.promotionText).toContain('$2.99 without Scene+ Card');
  });

  it('recognizes a quantity promotion without inventing a price', () => {
    const result = normalizeExample(
      'Cream Pies', null, '260-370 g MIX & MATCH',
      'BUY 1 GET 1 of equal or lesser value FREE',
    );
    expect(result.isMultibuy).toBe(true);
    expect(result.advertisedPriceAmount).toBeNull();
    expect(result.unitPrice).toBeNull();
    expect(result.promotionText).toContain('equal or lesser value FREE');
    expect(result.status).toBe('PENDING_REVIEW');
  });

  it('does not expose a conditional bundle as a confirmed single-item unit price', () => {
    const result = normalizeExample(
      'Carnation Evaporated Milk', '7.00', '354 mL', '4 for $7',
    );
    expect(result.isMultibuy).toBe(true);
    expect(result.promotionText).toContain('4 for $7');
    expect(result.unitPrice).toBeNull();
    expect(result.status).toBe('PENDING_REVIEW');
  });

  it('recognizes a quantity-based loyalty reward without treating points as a cash price', () => {
    const result = normalizeExample(
      'Compliments Potato Chips', null, '200 g',
      '100 Scene+ PTS when you buy 2',
    );
    expect(result.isMultibuy).toBe(true);
    expect(result.advertisedPriceAmount).toBeNull();
    expect(result.unitPrice).toBeNull();
    expect(result.promotionText).toContain('100 Scene+ PTS when you buy 2');
  });
});

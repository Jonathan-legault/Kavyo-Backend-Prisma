import { describe, expect, it } from 'vitest';
import { planProductPromotion, type PromotionEvidence } from './product-promotion-plan.js';

const base: PromotionEvidence = {
  offerId: 'test-offer',
  stagedOfferId: 'test-staged',
  stableKey: 'test-key',
  sourceSystemId: 'test-source',
  productName: 'NO NAME PIZZA BUSTER, 1L',
  brand: 'no name',
  descriptionText: 'Pizza Buster',
  packageSizeText: '1 L',
  quantityValue: 1,
  quantityUnit: 'l',
  isMultiVariant: false,
  isPriceRange: false,
  quantityIsApproximate: false,
};

describe('canonical fingerprint measurement notation', () => {
  it('merges equivalent 1L and 1 L product names', () => {
    const a = planProductPromotion(base);
    const b = planProductPromotion({
      ...base, offerId: 'second-offer',
      productName: 'NO NAME PIZZA BUSTER, 1 L'
    });

    expect(a.decision).toBe('CANDIDATE');
    expect(b.decision).toBe('CANDIDATE');

    if (a.decision === 'CANDIDATE' && b.decision === 'CANDIDATE') {
      expect(a.fingerprint).toBe(b.fingerprint);
    }
  });

  it('keeps different package sizes separate', () => {
    const a = planProductPromotion(base);
    const b = planProductPromotion({
      ...base,
      productName: 'NO NAME PIZZA BUSTER, 2L',
      packageSizeText: '2 L',
      quantityValue: 2
    });

    expect(a.decision).toBe('CANDIDATE');
    expect(b.decision).toBe('CANDIDATE');

    if (a.decision === 'CANDIDATE' && b.decision === 'CANDIDATE') {
      expect(a.fingerprint).not.toBe(b.fingerprint);
    }
  });
});

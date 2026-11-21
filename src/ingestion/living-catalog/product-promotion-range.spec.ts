import { describe, expect, it } from 'vitest';
import { planProductPromotion, type PromotionEvidence } from './product-promotion-plan.js';

const base: PromotionEvidence = {
  offerId: 'test-offer',
  stagedOfferId: 'test-staged',
  stableKey: 'test-stable',
  sourceSystemId: 'test-source',
  productName: 'PC Young Turkey',
  brand: 'PC',
  descriptionText: 'Fresh young turkey',
  packageSizeText: '7 KG',
  quantityValue: 7,
  quantityUnit: 'kg',
  isMultiVariant: false,
  isPriceRange: false,
  quantityIsApproximate: false,
};

describe('variable-weight canonical product safety', () => {
  it('holds a range in the package field', () => {
    expect(planProductPromotion({
      ...base, packageSizeText: '5 to 7 KG'
    }).decision).toBe('HOLD');
  });

  it('holds a range in the description', () => {
    expect(planProductPromotion({
      ...base,
      descriptionText: 'Fresh turkey, 5 to 7 KG',
      packageSizeText: 'each',
      quantityValue: 1,
      quantityUnit: 'each'
    }).decision).toBe('HOLD');
  });

  it('holds a range in the product title', () => {
    expect(planProductPromotion({
      ...base,
      productName: 'PC Young Turkey, 5 TO 7 KG'
    }).decision).toBe('HOLD');
  });

  it('accepts a genuinely exact package', () => {
    expect(planProductPromotion(base).decision).toBe('CANDIDATE');
  });
});

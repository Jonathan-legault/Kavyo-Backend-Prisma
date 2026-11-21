import { describe, expect, it } from 'vitest';
import { canonicalPackage, planProductPromotion, productIdentityAmbiguity, type PromotionEvidence } from './product-promotion-plan.js';
const base: PromotionEvidence = {
  offerId: 'o1', stableKey: 's1', sourceSystemId: 'flipp', stagedOfferId: 'st1',
  productName: 'Oikos Vanilla Greek yogurt',
  brand: 'Oikos',
  descriptionText: 'Vanilla Greek yogurt',
  packageSizeText: '500 g',
  quantityValue: null, quantityUnit: null, isMultiVariant: false, isPriceRange: false, quantityIsApproximate: false,
};
describe('B4 conservative canonical product promotion', () => {
  it('holds gift sets even when package says each', () => {
    expect(planProductPromotion({ ...base, productName: 'Zavida coffee gift sets', brand: 'Zavida', descriptionText: 'Coffee', packageSizeText: 'each', quantityValue: 1, quantityUnit: 'each' })).toMatchObject({ decision: 'HOLD', reasons: ['PRODUCT_FAMILY_OR_ASSORTMENT'] });
  });
  it('holds generic soft drink families despite a known 2 L size', () => {
    expect(planProductPromotion({ ...base, productName: 'Soft Drinks', brand: 'Coca-Cola', descriptionText: 'Soft drinks', packageSizeText: '2 L' })).toMatchObject({ decision: 'HOLD', reasons: ['GENERIC_PRODUCT_FAMILY'] });
  });
  it('holds brand-prefixed generic names', () => {
    expect(productIdentityAmbiguity('Dove body wash', 'Dove', 'Skin cleansing')).toBe('GENERIC_PRODUCT_FAMILY');
  });
  it('holds descriptions identifying multiple flavour choices', () => {
    expect(planProductPromotion({ ...base, descriptionText: 'Selected flavours available' })).toMatchObject({ decision: 'HOLD', reasons: ['DESCRIPTION_INDICATES_VARIANTS'] });
  });
  it('retains specific identity candidates', () => {
    expect(planProductPromotion({ ...base, productName: 'Silver Elephant jasmine rice', brand: 'Silver Elephant', packageSizeText: '7 kg', descriptionText: 'Jasmine rice' }).decision).toBe('CANDIDATE');
  });
  it('creates a candidate only for a single well identified package', () => {
    const p = planProductPromotion(base); expect(p.decision).toBe('CANDIDATE');
    if (p.decision === 'CANDIDATE') expect(p.quantityValue).toBe('500');
  });
  it('merges exact name/brand and equivalent g/kg packages', () => {
    const a = planProductPromotion(base); const b = planProductPromotion({ ...base, offerId: 'o2', packageSizeText: '0.5 kg' });
    expect(a.decision).toBe('CANDIDATE'); expect(b.decision).toBe('CANDIDATE');
    if (a.decision === 'CANDIDATE' && b.decision === 'CANDIDATE') expect(a.fingerprint).toBe(b.fingerprint);
  });
  it('does not merge two different brands', () => {
    const a = planProductPromotion(base); const b = planProductPromotion({ ...base, brand: 'Compliments' });
    if (a.decision === 'CANDIDATE' && b.decision === 'CANDIDATE') expect(a.fingerprint).not.toBe(b.fingerprint);
  });
  it('does not promote grouped variants', () => {
    expect(planProductPromotion({ ...base, isMultiVariant: true }).decision).toBe('HOLD');
  });
  it('does not infer multipack identity', () => {
    expect(canonicalPackage({ ...base, packageSizeText: '4 x 100 g', quantityValue: 400, quantityUnit: 'g' })).toBeNull();
  });
  it('holds package ranges even with a parsed quantity', () => {
    expect(planProductPromotion({ ...base, packageSizeText: '500-700 g', quantityValue: 500, quantityUnit: 'g' }).decision).toBe('HOLD');
  });
  it('holds missing package size', () => {
    expect(planProductPromotion({ ...base, packageSizeText: null }).decision).toBe('HOLD');
  });
  it('holds missing brands rather than guessing', () => {
    expect(planProductPromotion({ ...base, brand: null }).decision).toBe('HOLD');
  });
  it('does not promote a clearly excluded item', () => {
    expect(planProductPromotion({ ...base, productName: 'Wireless headphones', descriptionText: null }).decision).toBe('HOLD');
  });
  it('needs durable source evidence', () => {
    expect(planProductPromotion({ ...base, stagedOfferId: '' }).decision).toBe('HOLD');
  });
  it('does not confuse missing or ambiguous scope with product identity', () => {
    expect(planProductPromotion({ ...base, productName: 'Mystery Special', descriptionText: null }).decision).toBe('HOLD');
  });
});

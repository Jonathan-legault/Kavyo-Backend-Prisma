import { describe, expect, it } from 'vitest';
import { planProductPromotion, type PromotionEvidence } from './product-promotion-plan.js';

const base: PromotionEvidence = {
  offerId: 'offer', stagedOfferId: 'stage', stableKey: 'key', sourceSystemId: 'flipp',
  productName: 'Marcangelo seasoned pork tenderloin', brand: 'Marcangelo',
  descriptionText: 'Each. Smoky BBQ flavour. / 500 g. #51158424.',
  packageSizeText: 'each', quantityValue: 1, quantityUnit: 'each',
  isMultiVariant: false, isPriceRange: false, quantityIsApproximate: false,
};

describe('B5.4 conservative candidate reconciliation rules', () => {
  it('recovers the named smoky BBQ variant and explicit net weight', () => {
    const p = planProductPromotion(base);
    expect(p.decision).toBe('CANDIDATE');
    if (p.decision === 'CANDIDATE') {
      expect(p.productName).toBe('Marcangelo seasoned pork tenderloin Smoky BBQ');
      expect([p.quantityValue, p.quantityUnit]).toEqual(['500', 'g']);
    }
  });
  it('keeps different named variants in distinct identities', () => {
    const a=planProductPromotion(base);
    const b=planProductPromotion({...base,descriptionText:'Each. Plain. / 500 g.'});
    if(a.decision==='CANDIDATE' && b.decision==='CANDIDATE')
      expect(a.fingerprint).not.toBe(b.fingerprint);
  });
  it('includes unsweetened formulation in identity', () => {
    const p=planProductPromotion({...base,productName:'Silk protein soy beverage',brand:'Silk',descriptionText:'Unsweetened. / 946 mL / #30261437.',packageSizeText:'946 ml',quantityValue:946,quantityUnit:'ml'});
    expect(p.decision).toBe('CANDIDATE');
    if(p.decision==='CANDIDATE')expect(p.productName).toContain('Unsweetened');
  });
  it.each([
    ['Protein Shakes','Greenhouse','300 mL selected'],
    ['Protein Shake','Premier Protein','4 pk'],
    ['Baking Mixes','Best Buy','375 g'],
    ['COMPLIMENTS Dry Cured Salami','Compliments','selected 125 g'],
  ])('holds family or selected variants: %s', (productName,brand,descriptionText) => {
    const p=planProductPromotion({...base,productName,brand,descriptionText,packageSizeText:'375 g',quantityValue:375,quantityUnit:'g'});
    expect(p.decision).toBe('HOLD');
  });
  it('preserves narrow approved unbranded avocados',()=>{
    const p=planProductPromotion({...base,productName:'Avocados',brand:null,descriptionText:'Product of Mexico 5 pk',packageSizeText:'5 pk',quantityValue:5,quantityUnit:'each'});
    expect(p.decision).toBe('CANDIDATE');
  });
  it('preserves Apna Taste perra',()=>{
    const p=planProductPromotion({...base,productName:'Apna Taste perra',brand:'APNA TASTE',descriptionText:'Each. Frozen. / 400 g.',packageSizeText:'each'});
    expect(p.decision).toBe('CANDIDATE');
  });
});

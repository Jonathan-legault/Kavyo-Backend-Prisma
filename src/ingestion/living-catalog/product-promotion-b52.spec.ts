import {describe,it,expect} from 'vitest';
import {planProductPromotion,precisePackageFromDescription,type PromotionEvidence} from './product-promotion-plan.js';
const base: PromotionEvidence={
  offerId:'offer',stagedOfferId:'staged',stableKey:'stable',sourceSystemId:'flipp',
  productName:'Apna Taste perra',brand:'APNA TASTE',descriptionText:'Each. Frozen. / 400 g.',
  packageSizeText:'each',quantityValue:1,quantityUnit:'each',
  isMultiVariant:false,isPriceRange:false,quantityIsApproximate:false,
};
describe('B5.2 evidence-based identity recovery',()=>{
  it('extracts a single unambiguous 400 g net package from the description',()=>{
    const plan=planProductPromotion(base);
    expect(plan.decision).toBe('CANDIDATE');
    if(plan.decision==='CANDIDATE') expect([plan.quantityValue,plan.quantityUnit,plan.quantityText]).toEqual(['400','g','400 g']);
  });
  it('deduplicates the same packaged product across different flyer dates',()=>{
    const a=planProductPromotion(base),b=planProductPromotion({...base,offerId:'offer2',stableKey:'stable2'});
    expect(a.decision).toBe('CANDIDATE'); expect(b.decision).toBe('CANDIDATE');
    if(a.decision==='CANDIDATE'&&b.decision==='CANDIDATE') expect(a.fingerprint).toBe(b.fingerprint);
  });
  it('does not treat 4 x 325 mL as a single package 325 mL',()=>{
    expect(precisePackageFromDescription({...base,descriptionText:'4 x 325 mL'})).toBeNull();
  });
  it('does not extract size from selected or ranged packages',()=>{
    expect(precisePackageFromDescription({...base,descriptionText:'Selected 100-200 g'})).toBeNull();
  });
  it('promotes reviewed unbranded avocados only with a known pack and origin',()=>{
    const p=planProductPromotion({...base,productName:'Avocados',brand:null,descriptionText:'Product of Mexico 5 pk',packageSizeText:'5 pk',quantityValue:5,quantityUnit:'each'});
    expect(p.decision).toBe('CANDIDATE');
    if(p.decision==='CANDIDATE')expect([p.brand,p.quantityValue,p.quantityUnit]).toEqual([null,'5','each']);
  });
  it('holds avocados with unverified origin, or undefined package',()=>{
    const a={...base,productName:'Avocados',brand:null,descriptionText:'5 pk',packageSizeText:'5 pk',quantityValue:5,quantityUnit:'each'};
    expect(planProductPromotion(a).decision).toBe('HOLD');
    expect(planProductPromotion({...a,descriptionText:'Product of Mexico',packageSizeText:null,quantityValue:null}).decision).toBe('HOLD');
  });
  it('does not infer the Anjou pears selling unit or invent a package',()=>{
    expect(planProductPromotion({...base,productName:'Anjou Pears',brand:null,descriptionText:'Product of USA / No.1 Grade',packageSizeText:null,quantityValue:null,quantityUnit:null}).decision).toBe('HOLD');
  });
  it('continues holding selected variant offers',()=>{
    expect(planProductPromotion({...base,productName:'Barebells protein drink',brand:'Barebells',descriptionText:'Selected flavours. 4 x 325 mL',isMultiVariant:true}).decision).toBe('HOLD');
  });
});

import { describe,expect,it } from 'vitest';
import { interpretFlyerOffer as interpret } from './offer-eligibility.js';

describe('B5.3 grouped offers and informational promotions', () => {
  it('holds Barebells selected flavours without splitting $12.47',()=>{
    const r=interpret({productName:'Barebells protein drink',descriptionText:'Each. Selected flavours. 4 x 325 mL.',packageSizeText:'4 x 325 mL',advertisedPriceAmount:12.47,isMultiVariant:true});
    expect(r.coverage).toBe('GROUPED_VARIANTS');expect(r.canonicalProductAction).toBe('HOLD');expect(r.checkoutPriceAmount).toBe(12.47);
  });
  it('holds Always pads or liners as product alternatives',()=>{
    const r=interpret({productName:'Always pads or liners',brand:'Always',descriptionText:'Each. Selected varieties and sizes.',advertisedPriceAmount:10.48});
    expect(r.coverage).toBe('PRODUCT_ALTERNATIVES');expect(r.canonicalProductAction).toBe('HOLD');
  });
  it('keeps charcuterie $7.99 as an advertised amount, never $7.99 per gram',()=>{
    const r=interpret({productName:'Authentic Italian Charcuterie Meats',packageSizeText:'100-200 g',descriptionText:'selected 100-200 g',advertisedPriceAmount:7.99,advertisedPriceUnit:'g'});
    expect(r.coverage).toBe('PACKAGE_SIZE_RANGE');expect(r.checkoutPriceAmount).toBe(7.99);
    expect(r.sellingPriceBasis).toBe('UNKNOWN');expect(r.reviewReasons).toContain('SELLING_BASIS_UNCONFIRMED');
  });
  it('distinguishes an explicit price per 100 g from a package weight',()=>{
    const r=interpret({productName:'Deli ham',packageSizeText:'500 g',advertisedPriceAmount:3.99,advertisedPriceUnit:'$3.99 / 100 g'});
    expect(r.sellingPriceBasis).toBe('WEIGHT_BASED');expect(r.checkoutPriceAmount).toBe(3.99);
  });
  it('marks a fixed package price explicitly when the source says each',()=>{
    const r=interpret({productName:'Frozen perra',descriptionText:'Each. Frozen. / 400 g',advertisedPriceAmount:6.48});
    expect(r.sellingPriceBasis).toBe('FIXED_PACKAGE');expect(r.checkoutPriceAmount).toBe(6.48);
  });
  it('keeps 50 Scene+ points when buying two as a comment, not a price condition',()=>{
    const r=interpret({productName:'Baking Mixes',advertisedPriceAmount:2,promotionText:'50 Scene+ PTS when you buy 2'});
    expect(r.checkoutPriceAmount).toBe(2);expect(r.priceEligibility).toBe('UNCONDITIONAL');
    expect(r.customerComments.join(' ')).toContain('50 Scene+ PTS');
  });
  it('does not treat members earn 10% as a member-only selling price',()=>{
    const r=interpret({productName:'Anjou Pears',advertisedPriceAmount:1.99,promotionText:'MEMBERS EARN 10%'});
    expect(r.priceEligibility).toBe('UNCONDITIONAL');expect(r.customerComments[0]).toBe('MEMBERS EARN 10%');
  });
  it('keeps member-exclusive checkout prices as eligibility constraints',()=>{
    const r=interpret({productName:'Yogurt',advertisedPriceAmount:3.49,promotionText:'Member-exclusive price'});
    expect(r.priceEligibility).toBe('MEMBERSHIP_REQUIRED');expect(r.pricingConditions).toContain('MEMBERSHIP_REQUIRED_FOR_PRICE');
  });
  it('keeps buy-two-for-five as a quantity-dependent checkout price',()=>{
    const r=interpret({productName:'Yogurt',advertisedPriceAmount:5,promotionText:'2 for $5'});
    expect(r.priceEligibility).toBe('QUANTITY_CONDITION');
  });
  it('does not subtract loyalty points or Rollback from the cash price',()=>{
    const r=interpret({productName:'Air Wick scented oil kit',advertisedPriceAmount:17.97,promotionText:'Rollback'});
    expect(r.checkoutPriceAmount).toBe(17.97);expect(r.customerComments).toContain('Rollback');
  });
  it('does not invent a price for unpriced ads',()=>{
    const r=interpret({productName:'Avocados',advertisedPriceAmount:null});
    expect(r.checkoutPriceAmount).toBeNull();expect(r.reviewReasons).toContain('NO_NUMERIC_PRICE');
  });
});

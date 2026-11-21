/** B.5 pricing interpretation, pure and read-only. Not yet wired to basket engine.
 * Selling-price basis and informational unit-price display are distinct.
 */
export type SellingBasis = 'FIXED_PACKAGE' | 'WEIGHT_BASED' | 'COUNT_BASED' | 'UNKNOWN';
export interface PricingEvidence {
  advertisedPrice: string | number | null;
  priceQualifier?: string | null;  // The price-label language, NOT the package quantity.
  packageWeightGrams?: number | null;
  promotionText?: string | null;
}
export interface PricingInterpretation {
  sellingBasis: SellingBasis;
  advertisedPrice: number | null;
  sellingUnit: 'package' | '100 g' | 'kg' | 'each' | null;
  comparisonPricePer100g: number | null;
  customerComment: string | null;
  priceNeedsReview: boolean;
}
const money=(v:string|number|null):number|null=> {
  if(v==null || (typeof v==='string' && !v.trim()))return null;
  const n=Number(v);
  return Number.isFinite(n)&&n>=0?n:null;
};
const rounded=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function interpretOfferPricing(e:PricingEvidence):PricingInterpretation {
  const price=money(e.advertisedPrice);
  const label=(e.priceQualifier??'').trim().toLowerCase();
  const note=(e.promotionText??'').trim()||null;
  let sellingBasis:SellingBasis='UNKNOWN';
  let sellingUnit:PricingInterpretation['sellingUnit']=null;
  // Only explicit price-label wording can establish price-by-weight.
  if(/(?:\/\s*100\s*g\b|per\s*100\s*g\b)/i.test(label)) {
    sellingBasis='WEIGHT_BASED';sellingUnit='100 g';
  } else if(/(?:\/\s*kg\b|per\s*(?:kg|kilogram)\b)/i.test(label)) {
    sellingBasis='WEIGHT_BASED';sellingUnit='kg';
  } else if(/\b(?:per|\/)\s*(?:package|pack|pkg|kit)\b|\b(?:each|ea)\b/.test(label)) {
    sellingBasis='FIXED_PACKAGE';sellingUnit='package';
  } else if(/\bper\s*(?:piece|item)\b/.test(label)) {
    sellingBasis='COUNT_BASED';sellingUnit='each';
  }
  const weight=e.packageWeightGrams;
  const comparisonPricePer100g=price!=null && sellingBasis==='FIXED_PACKAGE' && weight!=null && Number.isFinite(weight) && weight>0
    ?rounded(price*100/weight):null;
  return {sellingBasis,advertisedPrice:price,sellingUnit,comparisonPricePer100g,
    customerComment:note,priceNeedsReview:price===null||sellingBasis==='UNKNOWN'};
}

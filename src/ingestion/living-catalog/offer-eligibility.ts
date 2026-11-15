/**
 * B.5.3: Pure interpretation of an already retained advertisement.
 * Does NOT create products, assign one product to a grouped offer, or mutate prices.
 * The distinction between scope and exact product identity is deliberate.
 */
export type OfferCoverage = 'SINGLE_PRODUCT' | 'GROUPED_VARIANTS' | 'PRODUCT_ALTERNATIVES' | 'PACKAGE_SIZE_RANGE' | 'UNKNOWN';
export type PriceEligibility = 'UNCONDITIONAL' | 'MEMBERSHIP_REQUIRED' | 'QUANTITY_CONDITION' | 'MULTIPLE_CONDITIONS' | 'UNDETERMINED';
export type SellingPriceBasis = 'FIXED_PACKAGE' | 'WEIGHT_BASED' | 'COUNT_BASED' | 'UNKNOWN';
export interface FlyerOfferEvidence {
  productName: string;
  brand?: string | null;
  descriptionText?: string | null;
  packageSizeText?: string | null;
  advertisedPriceAmount?: string | number | null;
  advertisedPriceUnit?: string | null;
  pricingBasis?: string | null;
  promotionText?: string | null;
  offerComment?: string | null;
  isMultiVariant?: boolean;
  isPriceRange?: boolean;
  isMemberPrice?: boolean;
  isMultibuy?: boolean;
}
export interface InterpretedOffer {
  coverage: OfferCoverage;
  canonicalProductAction: 'HOLD' | 'REVIEW_SINGLE';
  priceEligibility: PriceEligibility;
  sellingPriceBasis: SellingPriceBasis;
  sellingBasisConfidence: 'EXPLICIT' | 'CONTEXTUAL_REVIEW' | 'UNKNOWN';
  checkoutPriceAmount: number | null;
  customerComments: string[];
  pricingConditions: string[];
  reviewReasons: string[];
}
const has = (s: string, r: RegExp) => r.test(s);
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];
const numeric = (x: number | string | null | undefined): number | null => {
  if (x == null || (typeof x === 'string' && !x.trim())) return null;
  const v = Number(x);
  return Number.isFinite(v) && v >= 0 ? v : null;
};
/**
 * Text-based customer advisements are not discounts. Real price conditions are
 * separate metadata so a future pricing engine can enforce them.
 */
export function interpretFlyerOffer(e: FlyerOfferEvidence): InterpretedOffer {
  const name=e.productName || '';
  const description=e.descriptionText || '';
  const pack=e.packageSizeText || '';
  const promotion=e.promotionText?.trim() || '';
  const sourceComment=e.offerComment?.trim() || '';
  const content=`${name} ${description} ${pack}`;
  const notes:string[]=[];
  const priceConditions:string[]=[];
  const reviews:string[]=[];

  const hasRange=Boolean(e.isPriceRange) || has(pack, /\b\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|oz|lb)\b/i) ||
    has(description,/\b(?:selected\s+)?\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|oz|lb)\b/i);
  const alternatives=has(name, /\b(?:or)\b/i) && has(name, /\b(?:pads?|liners?|grill\s*pan|multipan)\b/i);
  const selected=has(content, /\b(?:selected\s+(?:flavou?rs?|varieties|sizes|styles|products?)|assorted\s+(?:flavou?rs?|varieties|sizes)|various\s+(?:flavou?rs?|varieties|sizes))\b/i);
  const grouped=Boolean(e.isMultiVariant) || selected;
  let coverage:OfferCoverage='SINGLE_PRODUCT';
  if(alternatives)coverage='PRODUCT_ALTERNATIVES';
  else if(hasRange)coverage='PACKAGE_SIZE_RANGE';
  else if(grouped)coverage='GROUPED_VARIANTS';
  if(coverage!=='SINGLE_PRODUCT')reviews.push('EXACT_VARIANT_NOT_IDENTIFIED');
  if(hasRange)reviews.push('VARIABLE_PACKAGE_SIZE_NO_SINGLE_UNIT_PRICE');
  if(numeric(e.advertisedPriceAmount)===null)reviews.push('NO_NUMERIC_PRICE');

  const label=(e.advertisedPriceUnit || '').toLowerCase();
  // Source's pricingBasis is contextual extraction evidence, not a new checkout price.
  const sourceBasis=(e.pricingBasis || '').toUpperCase();
  let sellingPriceBasis:SellingPriceBasis='UNKNOWN';
  let sellingBasisConfidence:InterpretedOffer['sellingBasisConfidence']='UNKNOWN';
  if(has(label, /(?:\/\s*100\s*g\b|per\s*100\s*g\b|\/\s*kg\b|per\s*(?:kg|kilogram)\b|\/\s*lb\b|per\s*(?:lb|pound)\b)/i)) {
    sellingPriceBasis='WEIGHT_BASED';sellingBasisConfidence='EXPLICIT';
  } else if(has(label,/\b(?:each|ea|package|pkg|pack|kit)\b/i) || has(description,/\b(?:each|per\s+package|per\s+pack)\b/i)) {
    sellingPriceBasis='FIXED_PACKAGE';sellingBasisConfidence='EXPLICIT';
  } else if(sourceBasis==='PER_WEIGHT' || sourceBasis==='WEIGHT_BASED') {
    // Do not trust a generic unit of g/kg here. The raw price label must be verified.
    reviews.push('PRICE_BASIS_NEEDS_SOURCE_LABEL');
  } else if(sourceBasis==='FIXED_PACKAGE' || sourceBasis==='EACH' || sourceBasis==='PER_ITEM') {
    sellingPriceBasis='FIXED_PACKAGE';sellingBasisConfidence='CONTEXTUAL_REVIEW';
  } else if(has(content,/\b(?:prepackaged|pre-packaged)\b/i)) {
    sellingPriceBasis='FIXED_PACKAGE';sellingBasisConfidence='CONTEXTUAL_REVIEW';
  }
  if(sellingPriceBasis==='UNKNOWN')reviews.push('SELLING_BASIS_UNCONFIRMED');

  const memberPrice=Boolean(e.isMemberPrice) || has(promotion,/\b(?:members?\s+only\s+(?:price|pricing)|member[- ]exclusive\s+price|(?:with|requires?)\s+(?:a\s+)?membership\s+for\s+(?:this\s+)?price)\b/i);
  // "members earn points" does not make a price member-only.
  const multibuyPrice=Boolean(e.isMultibuy) || has(promotion,/\b(?:\d+\s+for\s*\$\s*\d|buy\s*\d+\s+for\s*\$|\$\s*\d+(?:\.\d+)?\s*(?:each\s+)?when\s+you\s+buy\s*\d+)\b/i);
  const priceEligibility:PriceEligibility= memberPrice && multibuyPrice ? 'MULTIPLE_CONDITIONS':
    memberPrice ? 'MEMBERSHIP_REQUIRED': multibuyPrice ? 'QUANTITY_CONDITION':'UNCONDITIONAL';
  if(memberPrice)priceConditions.push('MEMBERSHIP_REQUIRED_FOR_PRICE');
  if(multibuyPrice)priceConditions.push('MULTIBUY_PRICE_CONDITION');
  // Preserve the exact source text in a comment even when a structured price condition exists.
  if(promotion)notes.push(promotion);
  if(sourceComment && sourceComment !== promotion)notes.push(sourceComment);
  if(has(promotion,/\b(?:points?|pts|earn\s*\d+%|rollback|while\s+supplies\s+last)\b/i)) {
    // Bonus rewards/marketing messaging must never be deducted from price.
    notes.push('Loyalty rewards and marketing notices are informational, not cash discounts.');
  }
  return {
    coverage,canonicalProductAction:coverage==='SINGLE_PRODUCT'?'REVIEW_SINGLE':'HOLD',
    priceEligibility,sellingPriceBasis,sellingBasisConfidence,
    checkoutPriceAmount:numeric(e.advertisedPriceAmount),
    customerComments:unique(notes),pricingConditions:unique(priceConditions),reviewReasons:unique(reviews),
  };
}

import { createHash } from 'node:crypto';
import { classifyGroceryScope } from '../scope/grocery-scope.js';
import { assessProductReadiness } from '../product/product-readiness.js';

export interface PromotionEvidence {
  offerId: string;
  stableKey: string;
  sourceSystemId: string;
  productName: string;
  brand: string | null;
  descriptionText: string | null;
  packageSizeText: string | null;
  quantityValue: string | number | null;
  quantityUnit: string | null;
  isMultiVariant: boolean;
  isPriceRange: boolean;
  quantityIsApproximate: boolean;
  // This is the StagedOffer corresponding to the durable offer's saved evidence.
  stagedOfferId: string;
}

export interface ProductPromotionCandidate {
  decision: 'CANDIDATE';
  offerId: string;
  stagedOfferId: string;
  fingerprint: string;
  productName: string;
  brand: string | null;
  quantityText: string;
  quantityValue: string | null;
  quantityUnit: string | null;
  scopeCategory: string;
}
export interface ProductPromotionHold {
  decision: 'HOLD';
  offerId: string;
  stagedOfferId: string;
  reasons: string[];
}
export type ProductPromotionPlan = ProductPromotionCandidate | ProductPromotionHold;

const clean = (v: string | null | undefined): string => (v ?? '').normalize('NFKC').toLocaleLowerCase('en-CA')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const units: Record<string, [string, number]> = {
  g: ['g',1], gram: ['g',1], grams: ['g',1], kg: ['g',1000],
  ml: ['ml',1], millilitre:['ml',1], milliliter:['ml',1], l:['ml',1000], litre:['ml',1000], liter:['ml',1000],
  each:['each',1], ea:['each',1], ct:['each',1], count:['each',1], pc:['each',1], pcs:['each',1],
};

/** Only single-item quantities, no ranges, multipacks, or guessed per-piece sizes. */
export function canonicalPackage(input: Pick<PromotionEvidence,'quantityValue'|'quantityUnit'|'packageSizeText'>):
  {key:string;value:string;unit:string} | null {
  const raw = input.packageSizeText?.trim() ?? '';
  // Even if a numeric value exists, a textual multipack/range invalidates a one-SKU identity.
  if (/[×x]\s*\d/i.test(raw) || /\d\s*[-–]\s*\d/.test(raw) || /\b(?:assorted|various|selected|from|up to)\b/i.test(raw)) return null;
  const typedUnit = (input.quantityUnit ?? '').trim().toLowerCase();
  const typed = input.quantityValue === null ? null : Number(input.quantityValue);
  let qty: number | null = null;
  let unit: string | null = null;
  if (typed !== null && Number.isFinite(typed) && typed > 0 && units[typedUnit]) {
    qty = typed * units[typedUnit][1];
    unit = units[typedUnit][0];
  } else {
    const m = /^(\d+(?:[.,]\d+)?)\s*(g|grams?|kg|ml|l|litres?|liters?|ct|count|ea|each|pcs?)$/i.exec(raw);
    if (!m) return null;
    const mapped = units[m[2].toLowerCase()];
    if (!mapped) return null;
    qty = Number(m[1].replace(',','.')) * mapped[1];
    unit = mapped[0];
  }
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const value = String(Number(qty.toFixed(6)));
  return {key: `${value}:${unit}`,value,unit};
}


/** Conservative B.5.2 enrichment: only a single explicitly stated net size. */
export function precisePackageFromDescription(e: PromotionEvidence):
  {key:string;value:string;unit:string} | null {
  const raw = (e.packageSizeText ?? '').trim().toLowerCase();
  // The original package field must only indicate a unit of sale; never override a stated net size.
  if (!['each', '1 each', 'ea', '1 ea', ''].includes(raw)) return null;
  const desc = e.descriptionText ?? '';
  if (/\b(?:selected|assorted|various|varieties|flavou?rs|sizes|approx(?:imately)?|about|up to)\b/i.test(desc) ||
      /\d+\s*[-–]\s*\d+\s*(?:g|kg|ml|l)\b/i.test(desc) ||
      /\d+\s*[x×]\s*\d+/i.test(desc)) return null;
  const matches = [...desc.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/gi)];
  if (matches.length !== 1) return null;
  const amount=Number(matches[0][1].replace(',','.'));
  const parsedUnit=matches[0][2].toLowerCase();
  const factor=parsedUnit==='kg'||parsedUnit==='l'?1000:1;
  const unit=parsedUnit==='kg'?'g':parsedUnit==='l'?'ml':parsedUnit;
  const value=String(Number((amount*factor).toFixed(6)));
  if (!Number.isFinite(amount) || amount<=0) return null;
  return {key:`${value}:${unit}`,value,unit};
}

/** B.5.2: initially limit unbranded produce to names we have reviewed. */
function unbrandedProduce(e: PromotionEvidence, reason:string):
  {pack:{key:string;value:string;unit:string};origin:string}|null {
  if (reason !== 'FRESH_PRODUCE' || e.brand?.trim()) return null;
  if (!/^(?:avocados?|anjou pears?)$/i.test(e.productName.trim())) return null;
  if (e.isMultiVariant||e.isPriceRange||e.quantityIsApproximate) return null;
  const raw=(e.packageSizeText??'').trim();
  const m=/^(\d+)\s*(?:pk|pack|count|ct)$/i.exec(raw);
  if (!m || Number(m[1])<=0) return null;
  const desc=e.descriptionText??'';
  const origin=/\bproduct of\s+(Mexico|USA|Canada)\b/i.exec(desc)?.[1].toLowerCase();
  if (!origin || /\b(?:organic|assorted|selected|various|mixed)\b/i.test(desc)) return null;
  const count=String(Number(m[1]));
  return {pack:{key:`${count}:each`,value:count,unit:'each'},origin};
}

/**
 * These titles describe advertised families, not a single sellable product.
 * We deliberately use narrow, explicit signals. The offer remains available.
 * This is a conservative safeguard, NOT a complete SKU identification model.
 */
export function productIdentityAmbiguity(name: string, brand: string | null, description: string | null): string | null {
  const title = clean(name);
  const descriptor = clean(description);
  const brandName = clean(brand);
  const titleWithoutBrand = brandName && title.startsWith(`${brandName} `)
    ? title.slice(brandName.length + 1) : title;

  // Headline terms that explicitly say multiple choices or mixed merchandise.
  if (/\b(?:gift\s+sets?|variety\s+packs?|assortments?|assorted|various|selected\s+varieties|mix\s+and\s+match|combo\s+packs?)\b/i.test(title)) {
    return 'PRODUCT_FAMILY_OR_ASSORTMENT';
  }
  // Exact short category labels can represent several distinct variants despite a single advertised size.
  const genericFamilies = new Set([
    'soft drinks', 'soft drink', 'soda', 'chips', 'potato chips', 'fruit cups',
    'juice drink', 'juice drinks', 'body wash', 'shampoo', 'conditioner',
    'yogurt', 'greek yogurt', 'bathroom tissue', 'toilet paper',
    'protein shake', 'protein shakes', 'baking mixes', 'baking mix',
  ]);
  if (genericFamilies.has(titleWithoutBrand) || genericFamilies.has(title)) {
    return 'GENERIC_PRODUCT_FAMILY';
  }
  // Descriptions can reveal assortments concealed by a concise title.
  if (/\b(?:selected|assorted|various)\b/i.test(descriptor)) {
    return 'DESCRIPTION_INDICATES_VARIANTS';
  }
  return null;
}

export function planProductPromotion(e: PromotionEvidence): ProductPromotionPlan {
  const hold = (...reasons: string[]): ProductPromotionHold => ({ decision:'HOLD',offerId:e.offerId,stagedOfferId:e.stagedOfferId,reasons });
  if (!e.offerId || !e.stagedOfferId || !e.stableKey || !e.sourceSystemId) return hold('SOURCE_EVIDENCE_MISSING');
  // A variable-weight or variable-volume advertisement is not an exact SKU identity.
  // Check source text even when the structured quantity contains an exact number.
  const rangePattern = /\b\d+(?:[.,]\d+)?\s*(?:to|-|–|—)\s*\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\b/i;
  if ([e.productName, e.descriptionText, e.packageSizeText].some(
    text => rangePattern.test(text ?? '')
  )) return hold('VARIABLE_PACKAGE_SIZE_RANGE');

  const scope = classifyGroceryScope({name:e.productName,description:e.descriptionText,brand:e.brand});
  if (scope.status !== 'IN_SCOPE') return hold(`SCOPE_${scope.status}_${scope.reason}`);
  const ambiguity = productIdentityAmbiguity(e.productName, e.brand, e.descriptionText);
  if (ambiguity) return hold(ambiguity);
  const produce=unbrandedProduce(e,scope.reason);
  const fromDescription=precisePackageFromDescription(e);
  const pack=produce?.pack ?? fromDescription ?? canonicalPackage(e);
  const readiness = assessProductReadiness({
    productName:e.productName,brand:produce ? 'UNBRANDED_PRODUCE' : e.brand,barcode:null,
    quantityValue:pack ? Number(pack.value) : e.quantityValue == null ? null : Number(e.quantityValue),
    quantityUnit:pack?.unit ?? e.quantityUnit,quantityText:pack ? `${pack.value} ${pack.unit}` : e.packageSizeText,
    isMultiVariant:e.isMultiVariant,isPriceRange:e.isPriceRange,
    quantityIsApproximate:e.quantityIsApproximate,
  });
  if (readiness.status !== 'READY_FOR_MATCH') return hold(...readiness.reasons);
  if (!pack) return hold('PACKAGE_NOT_CANONICAL');
  // A singular, explicit flavour/formulation must not be silently merged into the
  // generic name. Only a very narrow, test-backed set is auto-enriched.
  let resolvedProductName = e.productName.trim();
  const description = e.descriptionText ?? '';
  const variant = /\b(Smoky BBQ)\s+flavou?r\b/i.exec(description)?.[1]
    ?? /\b(Unsweetened)\b/i.exec(description)?.[1];
  if (variant && !clean(resolvedProductName).includes(clean(variant))) {
    resolvedProductName = `${resolvedProductName} ${variant}`;
  }
  if (/\b(?:flavou?r|flavours|flavors|variety|formulation)\b/i.test(description)
      && !variant && /\b(?:flavou?r|variety|formulation)\b/i.test(description)) {
    return hold('VARIANT_DESCRIPTION_REQUIRES_REVIEW');
  }
  // Equivalent measurement spacing must not create distinct canonical identities.
  // Keep this local to fingerprint construction, not general scope/variant logic.
  const name = clean(resolvedProductName)
    .replace(/\b(\d+(?:[.,]\d+)?)\s+(kg|g|ml|l)\b/g, '$1$2');
  const brand = clean(e.brand);
  if (!name || (!brand && !produce)) return hold('IDENTITY_INCOMPLETE');
  // Branded fingerprints are unchanged from B.4; only unbranded produce gets a new namespace.
  // Origin is deliberately included rather than silently merging different provenance.
  const identity=produce ? ['UNBRANDED_PRODUCE_V1',name,produce.origin,pack.key] : [name,brand,pack.key];
  const fingerprint = createHash('sha256').update(JSON.stringify(identity)).digest('hex');
  return {
    decision:'CANDIDATE', offerId:e.offerId, stagedOfferId:e.stagedOfferId,
    fingerprint, productName:resolvedProductName,brand:e.brand?.trim() || null,
    quantityText:produce || fromDescription ? `${pack.value} ${pack.unit}` : e.packageSizeText?.trim() || `${pack.value} ${pack.unit}`,
    quantityValue:pack.value,quantityUnit:pack.unit,scopeCategory:scope.category,
  };
}

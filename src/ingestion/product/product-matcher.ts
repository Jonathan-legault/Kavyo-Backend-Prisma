import { assessProductReadiness, type ProductIdentityCandidate } from './product-readiness.js';

/** Pure, read-only product matcher. Never creates or modifies database records. */
export interface ExistingProductIdentity {
  id: string;
  productName: string;
  brand: string | null;
  barcode: string | null;
  quantityValue: number | string | { toString(): string } | null;
  quantityUnit: string | null;
  quantityText: string | null;
}

export type ProductMatchDecision =
  | { status: 'MATCH_EXISTING'; productId: string; matchMethod: 'VERIFIED_GTIN' | 'EXACT_IDENTITY'; reasons: string[] }
  | { status: 'CREATE_CANDIDATE' | 'REVIEW' | 'REJECT'; productId: null; matchMethod: null; reasons: string[] };

const normalizedText = (value: string | null | undefined): string =>
  (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-CA');
const keyText = (value: string | null | undefined): string => normalizedText(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const unitMap: Record<string, [string, number]> = {
  g: ['g', 1], gram: ['g', 1], grams: ['g', 1], kg: ['g', 1000],
  ml: ['ml', 1], millilitre: ['ml', 1], milliliter: ['ml', 1], l: ['ml', 1000], litre: ['ml', 1000], liter: ['ml', 1000],
  ea: ['each', 1], each: ['each', 1], count: ['each', 1], ct: ['each', 1], pc: ['each', 1], pcs: ['each', 1],
};

function packageKey(value: number | string | { toString(): string } | null | undefined, unit: string | null | undefined, text: string | null | undefined): string | null {
  if (value != null && unit) {
    const amount = Number(value.toString());
    const canonical = unitMap[normalizedText(unit)];
    if (Number.isFinite(amount) && amount > 0 && canonical) {
      const scaled = amount * canonical[1];
      if (Number.isFinite(scaled) && scaled > 0) return `${Number(scaled.toFixed(6))}:${canonical[0]}`;
    }
  }
  // Only simple single-unit packages; never infer multipacks or ranges from free text.
  const match = normalizedText(text).match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ct|count|ea|each)$/);
  if (match) return packageKey(Number(match[1].replace(',', '.')), match[2], null);
  return null;
}

function exactIdentity(name: string | null | undefined, brand: string | null | undefined, pack: string | null): string | null {
  if (!keyText(name) || !keyText(brand) || !pack) return null;
  return `${keyText(name)}|${keyText(brand)}|${pack}`;
}

export function matchProduct(candidate: ProductIdentityCandidate, existing: readonly ExistingProductIdentity[]): ProductMatchDecision {
  const ready = assessProductReadiness(candidate);
  if (ready.status !== 'READY_FOR_MATCH') return {status: ready.status, productId: null, matchMethod: null, reasons: ready.reasons};
  const pack = packageKey(candidate.quantityValue, candidate.quantityUnit, candidate.quantityText);
  if (!pack) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['PACKAGE_IDENTITY_NOT_CANONICAL']};
  const identity = exactIdentity(candidate.productName, candidate.brand, pack);
  const gtin = ready.verifiedBarcode;
  // Exact barcode matches are only considered if GTIN is verified on both sides.
  if (gtin) {
    const hits = existing.filter(p => p.barcode && assessProductReadiness({productName:p.productName,barcode:p.barcode,quantityValue:Number(p.quantityValue),quantityUnit:p.quantityUnit,quantityText:p.quantityText}).verifiedBarcode === gtin);
    if (hits.length > 1) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['DUPLICATE_GTIN_IN_CATALOG']};
    if (hits.length === 1) {
      const hit = hits[0];
      const existingPack = packageKey(hit.quantityValue,hit.quantityUnit,hit.quantityText);
      if (existingPack && existingPack !== pack) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['GTIN_PACKAGE_CONFLICT']};
      if (keyText(hit.productName) && keyText(candidate.productName) && keyText(hit.productName) !== keyText(candidate.productName))
        return {status:'REVIEW',productId:null,matchMethod:null,reasons:['GTIN_NAME_CONFLICT']};
      if (keyText(hit.brand) && keyText(candidate.brand) && keyText(hit.brand) !== keyText(candidate.brand))
        return {status:'REVIEW',productId:null,matchMethod:null,reasons:['GTIN_BRAND_CONFLICT']};
      return {status:'MATCH_EXISTING',productId:hit.id,matchMethod:'VERIFIED_GTIN',reasons:[]};
    }
  }
  if (!identity) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['EXACT_IDENTITY_UNAVAILABLE']};
  const hits = existing.filter(p => exactIdentity(p.productName,p.brand,packageKey(p.quantityValue,p.quantityUnit,p.quantityText))===identity);
  if (hits.length>1) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['MULTIPLE_EXACT_IDENTITY_MATCHES']};
  if (hits.length===1) {
    // A different verified GTIN means a potentially different product, even with identical labels.
    const matchedGtin = hits[0].barcode ? assessProductReadiness({productName:hits[0].productName,barcode:hits[0].barcode}).verifiedBarcode : null;
    if (gtin && matchedGtin && gtin!==matchedGtin) return {status:'REVIEW',productId:null,matchMethod:null,reasons:['CONFLICTING_GTIN']};
    return {status:'MATCH_EXISTING',productId:hits[0].id,matchMethod:'EXACT_IDENTITY',reasons:[]};
  }
  return {status:'CREATE_CANDIDATE',productId:null,matchMethod:null,reasons:[]};
}

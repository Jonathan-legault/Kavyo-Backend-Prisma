/** Product identity preflight. Does NOT publish offers or modify Product. */
export interface ProductIdentityCandidate {
  productName?: string | null;
  brand?: string | null;
  barcode?: string | null;
  quantityValue?: number | null;
  quantityUnit?: string | null;
  quantityText?: string | null;
  isMultiVariant?: boolean;
  isPriceRange?: boolean;
  quantityIsApproximate?: boolean;
}
export interface ProductReadiness {
  status: 'READY_FOR_MATCH' | 'REVIEW' | 'REJECT';
  reasons: string[];
  verifiedBarcode: string | null;
}
const present = (x: string | null | undefined): boolean => typeof x === 'string' && x.trim().length > 0;

/** Check-digit verification applies only to numeric GTIN-8/12/13/14. A Flipp SKU is not automatically a GTIN. */
export function verifiedGtin(input: string | null | undefined): string | null {
  const value = input?.replace(/[ -]/g, '') ?? '';
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return null;
  const digits = [...value].map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit ? value : null;
}

export function assessProductReadiness(candidate: ProductIdentityCandidate): ProductReadiness {
  const reasons: string[] = [];
  const name = candidate.productName?.trim() ?? '';
  if (!name) return { status: 'REJECT', reasons: ['PRODUCT_NAME_MISSING'], verifiedBarcode: null };
  const barcode = verifiedGtin(candidate.barcode);
  if (present(candidate.barcode) && !barcode) reasons.push('BARCODE_NOT_VERIFIED');
  if (candidate.isMultiVariant) reasons.push('GROUPED_PRODUCT_VARIANTS');
  if (candidate.isPriceRange) reasons.push('PACKAGE_SIZE_RANGE');
  if (candidate.quantityIsApproximate) reasons.push('QUANTITY_APPROXIMATE');
  const quantityKnown = (typeof candidate.quantityValue === 'number' && Number.isFinite(candidate.quantityValue) && candidate.quantityValue > 0 && present(candidate.quantityUnit)) || present(candidate.quantityText);
  if (!quantityKnown) reasons.push('PACKAGE_IDENTITY_MISSING');
  // Without GTIN, both brand and package identity are required before automatic matching.
  if (!barcode && !present(candidate.brand)) reasons.push('BRAND_MISSING_FOR_NON_GTIN_MATCH');
  return { status: reasons.length ? 'REVIEW' : 'READY_FOR_MATCH', reasons, verifiedBarcode: barcode };
}

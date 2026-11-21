import type { ProductPromotionCandidate } from './product-promotion-plan.js';

/** Source identifiers are stable across independently seeded databases; offer/staged UUIDs are not. */
export type SourcedProductCandidate = ProductPromotionCandidate & {
  sourceRecordId: string;
  flyerExternalId: string;
  marketKey: string;
};

function compareText(a: string | null, b: string | null): number {
  const left = a ?? '';
  const right = b ?? '';
  return left < right ? -1 : left > right ? 1 : 0;
}

const orderingFields = [
  'sourceRecordId', 'flyerExternalId', 'marketKey',
  'productName', 'brand', 'quantityText', 'quantityValue', 'quantityUnit', 'scopeCategory',
] as const;

/**
 * Deterministically chooses the literal source row used to seed a new canonical Product.
 * Never use database-generated IDs or stableKey (which hashes database-generated IDs).
 * Refuse indistinguishable source identities so provenance is never selected at random.
 */
export function selectCanonicalRepresentative<T extends SourcedProductCandidate>(
  candidates: readonly T[],
): T {
  if (candidates.length === 0) throw new Error('No canonical product candidates');
  for (const candidate of candidates) {
    if (!candidate.sourceRecordId.trim() || !candidate.flyerExternalId.trim() || !candidate.marketKey.trim()) {
      throw new Error('Canonical representative missing source identity');
    }
  }
  const ordered = [...candidates].sort((a, b) => {
    for (const field of orderingFields) {
      const result = compareText(a[field], b[field]);
      if (result) return result;
    }
    return 0;
  });
  if (ordered.length > 1 && orderingFields.every(field => compareText(ordered[0][field], ordered[1][field]) === 0)) {
    throw new Error('Ambiguous duplicate canonical representative source identity');
  }
  return ordered[0];
}

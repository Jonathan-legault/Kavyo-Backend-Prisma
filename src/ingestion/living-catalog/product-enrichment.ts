/**
 * Phase B.3: pure proposed updates for an ALREADY CONFIRMED product identity.
 * Do not call this for fuzzy or unresolved matches. Caller owns transactions.
 */
export type EvidenceTier = "FLYER" | "RETAILER_VERIFIED";
export interface CanonicalIdentity {
  productName: string;
  brand: string | null;
  barcode: string | null;
  quantityText: string | null;
}
export interface IncomingIdentity {
  productName?: string | null;
  brand?: string | null;
  verifiedBarcode?: string | null;
  quantityText?: string | null;
  evidenceTier: EvidenceTier;
}
export interface EnrichmentProposal {
  patch: Partial<CanonicalIdentity>;
  conflicts: string[];
  changedFields: string[];
  safeForAutomaticUpdate: boolean;
}

/** Filling unknown fields is safe on a confirmed identity; conflicting values require review. */
export function proposeProductEnrichment(
  existing: CanonicalIdentity,
  incoming: IncomingIdentity,
  identityConfirmed: boolean,
): EnrichmentProposal {
  const conflicts: string[] = [];
  const patch: Partial<CanonicalIdentity> = {};
  if (!identityConfirmed) {
    return { patch, conflicts: ["PRODUCT_IDENTITY_NOT_CONFIRMED"], changedFields: [], safeForAutomaticUpdate: false };
  }

  // A verified barcode is supplied ONLY by a separate trusted GTIN validation step.
  const candidates: Array<{ field: keyof CanonicalIdentity; value: string | null | undefined }> = [
    { field: "brand", value: incoming.brand },
    { field: "quantityText", value: incoming.quantityText },
    { field: "barcode", value: incoming.evidenceTier === "RETAILER_VERIFIED" ? incoming.verifiedBarcode : null },
  ];
  for (const {field, value} of candidates) {
    const proposed = value?.trim() || null;
    if (!proposed) continue;
    const current = existing[field]?.trim() || null;
    if (!current) patch[field] = proposed;
    else if (current.toLocaleLowerCase("en-CA") !== proposed.toLocaleLowerCase("en-CA")) {
      conflicts.push(field.toUpperCase() + "_CONFLICT");
    }
  }
  // Product name changes are never automatic; an offer headline may group variants.
  if (incoming.productName?.trim() &&
    incoming.productName.trim().toLocaleLowerCase("en-CA") !== existing.productName.trim().toLocaleLowerCase("en-CA")) {
    conflicts.push("PRODUCT_NAME_CONFLICT");
  }
  // All-or-nothing proposal: no partial update if any supplied attribute contradicts identity.
  if (conflicts.length) return { patch: {}, conflicts, changedFields: [], safeForAutomaticUpdate: false };
  return { patch, conflicts: [], changedFields: Object.keys(patch), safeForAutomaticUpdate: true };
}

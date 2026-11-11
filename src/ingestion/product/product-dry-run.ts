import { createHash } from 'node:crypto';
import { classifyGroceryScope } from '../scope/grocery-scope.js';
import { matchProduct, type ExistingProductIdentity, type ProductMatchDecision } from './product-matcher.js';
import type { ProductIdentityCandidate } from './product-readiness.js';

export interface StagedProductInput {
  id: string;
  retailerName: string;
  sourceRecordId: string | null;
  status: string;
  productName: string;
  brand: string | null;
  descriptionText: string | null;
  packageSizeText: string | null;
  quantityValue: number | string | { toString(): string } | null;
  quantityUnit: string | null;
  quantityIsApproximate: boolean;
  isMultiVariant: boolean;
  isPriceRange: boolean;
}

export interface ProductDryRunRow {
  stagedOfferId: string;
  retailer: string;
  sourceRecordId: string;
  stagedStatus: string;
  productName: string;
  brand: string;
  packageText: string;
  scopeStatus: string;
  scopeReason: string;
  decision: 'MATCH_EXISTING' | 'CREATE_CANDIDATE' | 'REVIEW' | 'REJECT' | 'OUT_OF_SCOPE';
  productId: string;
  matchMethod: string;
  candidateGroup: string;
  reasons: string;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').normalize('NFKC').toLocaleLowerCase('en-CA').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function packageIdentity(row: StagedProductInput): string | null {
  const unit = clean(row.quantityUnit);
  const canonical: Record<string, [string, number]> = {
    g:['g',1],gram:['g',1],grams:['g',1],kg:['g',1000],
    ml:['ml',1],millilitre:['ml',1],milliliter:['ml',1],l:['ml',1000],litre:['ml',1000],liter:['ml',1000],
    ea:['each',1],each:['each',1],ct:['each',1],count:['each',1],pc:['each',1],pcs:['each',1],
  };
  const numeric = row.quantityValue == null ? null : Number(row.quantityValue.toString());
  if (numeric !== null && Number.isFinite(numeric) && numeric > 0 && canonical[unit]) {
    return `${Number((numeric * canonical[unit][1]).toFixed(6))}:${canonical[unit][0]}`;
  }
  const match = (row.packageSizeText ?? '').trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|ct|count|ea|each)$/);
  if (!match) return null;
  const [normalizedUnit, multiplier] = canonical[match[2]] ?? [];
  if (!normalizedUnit) return null;
  return `${Number((Number(match[1].replace(',', '.')) * multiplier).toFixed(6))}:${normalizedUnit}`;
}

/** Conservative grouping: only identities with nonempty name, brand and unambiguous package. */
function candidateFingerprint(row: StagedProductInput): string | null {
  const name = clean(row.productName);
  const brand = clean(row.brand);
  const pack = packageIdentity(row);
  if (!name || !brand || !pack) return null;
  return createHash('sha256').update(JSON.stringify([name, brand, pack])).digest('hex').slice(0, 20);
}

/** Pure read-only dry run. Never inserts or links a Product. */
export function planProductMatches(rows: readonly StagedProductInput[], catalog: readonly ExistingProductIdentity[]): ProductDryRunRow[] {
  const result: ProductDryRunRow[] = [];
  for (const row of rows) {
    const scope = classifyGroceryScope({ name: row.productName, description: row.descriptionText, brand: row.brand });
    const base = {
      stagedOfferId: row.id, retailer: row.retailerName, sourceRecordId: row.sourceRecordId ?? '',
      stagedStatus: row.status, productName: row.productName, brand: row.brand ?? '',
      packageText: row.packageSizeText ?? '', scopeStatus: scope.status, scopeReason: scope.reason,
    };
    if (scope.status === 'OUT_OF_SCOPE') {
      result.push({...base, decision:'OUT_OF_SCOPE',productId:'',matchMethod:'',candidateGroup:'',reasons:scope.reason});
      continue;
    }
    if (scope.status === 'REVIEW') {
      result.push({...base, decision:'REVIEW',productId:'',matchMethod:'',candidateGroup:'',reasons:`SCOPE_${scope.reason}`});
      continue;
    }
    // Do not map unverified source SKUs to canonical barcodes.
    const candidate: ProductIdentityCandidate = {
      productName: row.productName, brand: row.brand, barcode: null,
      quantityValue: row.quantityValue == null ? null : Number(row.quantityValue.toString()),
      quantityUnit: row.quantityUnit, quantityText: row.packageSizeText,
      quantityIsApproximate: row.quantityIsApproximate, isMultiVariant: row.isMultiVariant,
      isPriceRange: row.isPriceRange,
    };
    const match: ProductMatchDecision = matchProduct(candidate, catalog);
    const fingerprint = match.status === 'CREATE_CANDIDATE' ? candidateFingerprint(row) : null;
    const decision = match.status === 'CREATE_CANDIDATE' && !fingerprint ? 'REVIEW' : match.status;
    result.push({...base, decision, productId: match.productId ?? '', matchMethod:match.matchMethod ?? '',
      candidateGroup: fingerprint ?? '', reasons:decision === 'REVIEW' && !fingerprint && match.status === 'CREATE_CANDIDATE'
        ? 'CANDIDATE_IDENTITY_UNKEYABLE' : match.reasons.join('|')});
  }
  return result;
}

export function summarizeProductDryRun(rows: readonly ProductDryRunRow[]) {
  const counts: Record<string, number> = {};
  const groups = new Map<string, number>();
  for (const row of rows) {
    counts[row.decision] = (counts[row.decision] ?? 0) + 1;
    if (row.decision === 'CREATE_CANDIDATE') groups.set(row.candidateGroup, (groups.get(row.candidateGroup) ?? 0) + 1);
  }
  return {
    stagedOffersAnalyzed:rows.length,
    decisions:counts,
    distinctCreateCandidateGroups:groups.size,
    duplicateCandidateRows:[...groups.values()].reduce((n,count)=>n+Math.max(0,count-1),0),
    note:'Candidate groups are conservative within this report only; they are not verified product IDs.',
  };
}

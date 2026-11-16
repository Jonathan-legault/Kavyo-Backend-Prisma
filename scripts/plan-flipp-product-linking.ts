/**
 * Reusable, read-only product identity reconciliation for ALL durable Flipp offers.
 * No capture-specific counts or paths. Never creates products or updates links.
 * Uses the existing conservative planProductPromotion() and ProductEvidence identity fingerprints.
 * Run: npx tsx scripts/plan-flipp-product-linking.ts
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import {
  planProductPromotion,
  type PromotionEvidence,
  type ProductPromotionCandidate,
} from '../src/ingestion/living-catalog/product-promotion-plan.js';

if (process.argv.slice(2).length) throw Error('READ_ONLY: this planner accepts no write flags');
const SOURCE = 'FLIPP_FLYERS';
const EVIDENCE_PREFIX = 'IDENTITY:';
const output = resolve('data/research/living-db/product-link-plan');
const stagedIdFrom = (v: Prisma.JsonValue | null): string | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const id = (v as Record<string, Prisma.JsonValue>).sourceStagedOfferId;
  return typeof id === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) ? id : null;
};
const escaped = (v: unknown): string => {
  let s = v == null ? '' : String(v);
  // Prevent source-controlled product names from becoming Excel formulas.
  if (/^[\s\uFEFF]*[=+@\-\t\r]/u.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const csv = (headers: string[], rows: Record<string, unknown>[]): string =>
  '\uFEFF' + headers.map(escaped).join(',') + '\r\n' +
  rows.map(r => headers.map(k => escaped(r[k])).join(',')).join('\r\n') + '\r\n';

type CandidateRow = { plan: ProductPromotionCandidate; offerId: string; linkedProductId: string | null };
type IdentityRow = { productId: string; verified: boolean; active: boolean };

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw Error('DATABASE_URL missing');
  const u = new URL(connectionString);
  if (!['localhost', '127.0.0.1'].includes(u.hostname) || u.pathname !== '/kavyo_phase_b_test')
    throw Error('SAFETY STOP: only localhost/kavyo_phase_b_test is permitted');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const actual = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    if (actual[0]?.name !== 'kavyo_phase_b_test') throw Error('SAFETY STOP: wrong connected database');
    const source = await prisma.sourceSystem.findUnique({ where: { name: SOURCE }, select: { id: true } });
    if (!source) throw Error('FLIPP_FLYERS source system is missing');

    const before = {
      flyers: await prisma.flyer.count(), staged: await prisma.stagedOffer.count(),
      advertised: await prisma.advertisedOffer.count(), products: await prisma.product.count(),
      productEvidence: await prisma.productEvidence.count(), priceObservations: await prisma.priceObservation.count(),
    };
    const identityEvidence = await prisma.productEvidence.findMany({
      where: { sourceSystemId: source.id, evidenceType: 'CANONICAL_IDENTITY', sourceRecordId: { startsWith: EVIDENCE_PREFIX } },
      select: { sourceRecordId: true, productId: true, verified: true, product: { select: { isActive: true } } },
    });
    const identities = new Map<string, IdentityRow[]>();
    for (const e of identityEvidence) {
      const fingerprint = e.sourceRecordId.slice(EVIDENCE_PREFIX.length);
      const rows = identities.get(fingerprint) ?? [];
      rows.push({ productId: e.productId, verified: e.verified, active: e.product.isActive });
      identities.set(fingerprint, rows);
    }

    const groups = new Map<string, CandidateRow[]>();
    const holds = new Map<string, number>();
    const heldLinked: Record<string, unknown>[] = [];
    const missingStage: Record<string, unknown>[] = [];
    let offersInspected = 0;
    let linkedBefore = 0;
    let eligibleOffers = 0;
    let heldOffers = 0;
    let cursor: string | undefined;
    do {
      const offers = await prisma.advertisedOffer.findMany({
        where: { sourceSystemId: source.id }, orderBy: { id: 'asc' }, take: 200,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true, stableKey: true, sourceSystemId: true, productId: true, conditionEvidence: true },
      });
      if (!offers.length) break;
      const stageIds = offers.map(o => stagedIdFrom(o.conditionEvidence)).filter((x): x is string => x !== null);
      const stages = await prisma.stagedOffer.findMany({
        where: { sourceSystemId: source.id, id: { in: stageIds } },
        select: { id: true, productName: true, brand: true, descriptionText: true,
          packageSizeText: true, quantityValue: true, quantityUnit: true,
          isMultiVariant: true, isPriceRange: true, quantityIsApproximate: true },
      });
      const stageById = new Map(stages.map(s => [s.id, s]));
      for (const offer of offers) {
        offersInspected++;
        if (offer.productId) linkedBefore++;
        const stageId = stagedIdFrom(offer.conditionEvidence);
        const s = stageId ? stageById.get(stageId) : undefined;
        if (!s) {
          missingStage.push({ offerId: offer.id, stableKey: offer.stableKey, sourceStagedOfferId: stageId ?? '' });
          continue;
        }
        const evidence: PromotionEvidence = {
          offerId: offer.id, stableKey: offer.stableKey, sourceSystemId: offer.sourceSystemId,
          stagedOfferId: s.id, productName: s.productName, brand: s.brand,
          descriptionText: s.descriptionText, packageSizeText: s.packageSizeText,
          quantityValue: s.quantityValue?.toString() ?? null, quantityUnit: s.quantityUnit,
          isMultiVariant: s.isMultiVariant, isPriceRange: s.isPriceRange,
          quantityIsApproximate: s.quantityIsApproximate,
        };
        const decision = planProductPromotion(evidence);
        if (decision.decision === 'HOLD') {
          heldOffers++;
          for (const reason of decision.reasons) holds.set(reason, (holds.get(reason) ?? 0) + 1);
          if (offer.productId) heldLinked.push({ offerId: offer.id, existingProductId: offer.productId, reasons: decision.reasons.join(' | ') });
          continue;
        }
        eligibleOffers++;
        const group = groups.get(decision.fingerprint) ?? [];
        group.push({ plan: decision, offerId: offer.id, linkedProductId: offer.productId });
        groups.set(decision.fingerprint, group);
      }
      cursor = offers[offers.length - 1].id;
    } while (true);

    const decisions: Record<string, unknown>[] = [];
    const totals: Record<string, number> = {};
    const unlinked: Record<string, number> = {};
    for (const [fingerprint, entries] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const evidenceRows = identities.get(fingerprint) ?? [];
      const identityProductIds = new Set(evidenceRows.map(e => e.productId));
      const linkedProductIds = new Set(entries.map(e => e.linkedProductId).filter((id): id is string => !!id));
      const productId = identityProductIds.size === 1 ? [...identityProductIds][0] : null;
      const usableIdentity = identityProductIds.size === 1 && evidenceRows.every(e => e.active);
      const conflicts = identityProductIds.size > 1 || linkedProductIds.size > 1 ||
        (linkedProductIds.size === 1 && (!usableIdentity || !linkedProductIds.has(productId!)));
      const category = conflicts ? 'CONFLICT_REVIEW' :
        evidenceRows.some(e => !e.active) ? 'INACTIVE_IDENTITY_HOLD' :
        usableIdentity ? 'EXISTING_IDENTITY_CANDIDATE' : 'NEW_IDENTITY_REVIEW';
      const unlinkedCount = entries.filter(e => !e.linkedProductId).length;
      totals[category] = (totals[category] ?? 0) + 1;
      unlinked[category] = (unlinked[category] ?? 0) + unlinkedCount;
      const seed = entries[0].plan;
      decisions.push({ category, fingerprint, productName: seed.productName, brand: seed.brand,
        quantityText: seed.quantityText, quantityValue: seed.quantityValue, quantityUnit: seed.quantityUnit,
        scopeCategory: seed.scopeCategory, offers: entries.length, unlinkedOffers: unlinkedCount,
        existingProductId: productId ?? '', identityEvidenceVerified: evidenceRows.length > 0 && evidenceRows.every(e => e.verified),
        offerIds: entries.map(e => e.offerId).join(' | '),
        linkedProductIds: [...linkedProductIds].join(' | '), reviewDecision: '', reviewNotes: '' });
    }
    const after = {
      flyers: await prisma.flyer.count(), staged: await prisma.stagedOffer.count(),
      advertised: await prisma.advertisedOffer.count(), products: await prisma.product.count(),
      productEvidence: await prisma.productEvidence.count(), priceObservations: await prisma.priceObservation.count(),
    };
    if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('SAFETY STOP: database counts changed during audit');
    const summary = {
      mode: 'READ_ONLY', database: actual[0].name,
      generatedAt: new Date().toISOString(), advertisedFlippOffersInspected: offersInspected,
      linkedOffersAtStart: linkedBefore, unlinkedOffersAtStart: offersInspected - linkedBefore,
      eligibleOfferRows: eligibleOffers, heldOfferRows: heldOffers,
      missingStagedEvidenceRows: missingStage.length,
      candidateIdentityGroups: groups.size, identityGroupsByDisposition: totals,
      unlinkedOfferRowsByDisposition: unlinked,
      holdReasons: Object.fromEntries([...holds].sort((a, b) => b[1] - a[1])),
      previouslyLinkedButNowHeld: heldLinked.length,
      before, after,
      caveats: [
        'No products, evidence or offer associations are written by this script.',
        'EXISTING_IDENTITY_CANDIDATE means matching historical fingerprint evidence; it is not independent GTIN verification.',
        'NEW_IDENTITY_REVIEW is a candidate for manual review, not permission to create a product.',
        'Offers without prices are included; product identity must not be inferred from price.',
        'Existing product links are never altered by this audit.',
        'A database row-count snapshot is not a substitute for transaction isolation during concurrent writes.',
      ],
    };
    await mkdir(output, { recursive: true });
    const headers = ['category','fingerprint','productName','brand','quantityText','quantityValue','quantityUnit',
      'scopeCategory','offers','unlinkedOffers','existingProductId','identityEvidenceVerified','offerIds',
      'linkedProductIds','reviewDecision','reviewNotes'];
    await Promise.all([
      writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n'),
      writeFile(join(output, 'identity-candidates.csv'), csv(headers, decisions)),
      writeFile(join(output, 'new-identity-review.csv'), csv(headers, decisions.filter(r => r.category === 'NEW_IDENTITY_REVIEW'))),
      writeFile(join(output, 'existing-identity-candidates.csv'), csv(headers, decisions.filter(r => r.category === 'EXISTING_IDENTITY_CANDIDATE'))),
      writeFile(join(output, 'identity-conflicts.csv'), csv(headers, decisions.filter(r => String(r.category).includes('CONFLICT') || String(r.category).includes('HOLD')))),
      writeFile(join(output, 'missing-staged-evidence.csv'), csv(['offerId','stableKey','sourceStagedOfferId'], missingStage)),
      writeFile(join(output, 'linked-but-now-held.csv'), csv(['offerId','existingProductId','reasons'], heldLinked)),
    ]);
    console.log(JSON.stringify(summary, null, 2));
    console.log(`Reports: ${output}`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

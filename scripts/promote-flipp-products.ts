/** Phase B.4: canonical Product creation and AdvertisedOffer linking.
 * DRY-RUN by default. Writes require --write --backup-confirmed on an approved local database.
 * No raw offers, staged rows, price observations or old Product attributes are modified.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence } from '../src/ingestion/living-catalog/product-promotion-plan.js';
import { selectCanonicalRepresentative, type SourcedProductCandidate } from '../src/ingestion/living-catalog/canonical-representative.js';

const args = process.argv.slice(2);
const write = args.includes('--write');
const allowedFlags = new Set(['--write', '--backup-confirmed']);
for (let i = 0; i < args.length; i++) {
  const value = args[i];
  if (value === '--limit') {
    if (i + 1 >= args.length) throw Error('--limit requires a value');
    i++;
  } else if (!allowedFlags.has(value) && !value.startsWith('--limit=')) {
    throw Error(`Unknown argument: ${value}`);
  }
}
if (write && !args.includes('--backup-confirmed'))
  throw Error('SAFETY STOP: --write requires --backup-confirmed');
function arg(name: string) {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : args.find(a => a.startsWith('--' + name + '='))?.slice(name.length + 3);
}
const limit = Number(arg('limit') ?? '0');
if (!Number.isSafeInteger(limit) || limit < 0) throw Error('--limit must be 0 or a nonnegative integer');
const IDENTITY_PREFIX = 'IDENTITY:';
const SOURCE_NAME = 'FLIPP_FLYERS';

type Advert = {
  id: string; stableKey: string; sourceSystemId: string; productId: string | null;
  conditionEvidence: Prisma.JsonValue | null;
  flyerExternalId: string; marketKey: string;
};
const evidenceId = (v: Prisma.JsonValue | null): string | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const x = v as Record<string, Prisma.JsonValue>;
  return typeof x.sourceStagedOfferId === 'string' && /^[0-9a-f-]{36}$/i.test(x.sourceStagedOfferId)
    ? x.sourceStagedOfferId : null;
};

async function main() {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');
  const url = new URL(process.env.DATABASE_URL);
  if (!['/kavyo_phase_b_test','/kavyo_install_test','/kavyo_dev'].includes(url.pathname) || !['localhost', '127.0.0.1'].includes(url.hostname))
    throw Error('SAFETY STOP: only approved local Kavyo databases are permitted');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const db = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
    if (!['kavyo_phase_b_test','kavyo_install_test','kavyo_dev'].includes(db[0]?.db ?? '')) throw Error('SAFETY STOP: wrong database');
    const source = await prisma.sourceSystem.findUnique({ where: { name: SOURCE_NAME }, select: { id: true } });
    if (!source) throw Error('Missing FLIPP_FLYERS SourceSystem');
    const before = {
      products: await prisma.product.count(), offers: await prisma.advertisedOffer.count(),
      stagedOffers: await prisma.stagedOffer.count(), priceObservations: await prisma.priceObservation.count(),
      evidence: await prisma.productEvidence.count()
    };
    // Guard against silently merging into an unknown/legacy catalog.
    const knownProducts = await prisma.productEvidence.count({ where: { sourceSystemId: source.id, evidenceType: 'CANONICAL_IDENTITY' } });
    if (write && before.products > 0 && knownProducts === 0) throw Error('SAFETY STOP: nonempty product catalog has no B4 identity evidence');

    const groups = new Map<string, SourcedProductCandidate[]>();
    const holds = new Map<string, number>();
    const holdSamples: Array<{ offerId: string; reason: string }> = [];
    let analyzed = 0, eligible = 0, alreadyLinked = 0, missingStaging = 0;
    let cursor: string | undefined;
    const hold = (offerId: string, reason: string) => {
      holds.set(reason, (holds.get(reason) ?? 0) + 1);
      if (holdSamples.length < 40) holdSamples.push({ offerId, reason });
    };
    const total = await prisma.advertisedOffer.count({ where: { sourceSystemId: source.id } });
    while (limit === 0 || analyzed < limit) {
      const page = await prisma.advertisedOffer.findMany({
        where: { sourceSystemId: source.id }, orderBy: { id: 'asc' }, take: Math.min(200, limit === 0 ? 200 : limit - analyzed),
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true, stableKey: true, sourceSystemId: true, productId: true, conditionEvidence: true, flyerExternalId: true, marketKey: true },
      }) as Advert[];
      if (!page.length) break;
      const ids = page.map(x => evidenceId(x.conditionEvidence)).filter((x): x is string => x !== null);
      const staged = await prisma.stagedOffer.findMany({
        where: { id: { in: ids }, sourceSystemId: source.id },
        select: {
          id: true, sourceRecordId: true, sourceSystemId: true, productName: true, brand: true, descriptionText: true,
          packageSizeText: true, quantityValue: true, quantityUnit: true,
          isMultiVariant: true, isPriceRange: true, quantityIsApproximate: true
        },
      });
      const stagedById = new Map(staged.map(x => [x.id, x]));
      for (const offer of page) {
        analyzed++;
        const stageId = evidenceId(offer.conditionEvidence);
        const row = stageId ? stagedById.get(stageId) : undefined;
        if (!row) { missingStaging++; hold(offer.id, 'SOURCE_STAGING_MISSING'); continue; }
        const input: PromotionEvidence = {
          offerId: offer.id, stableKey: offer.stableKey, sourceSystemId: offer.sourceSystemId,
          stagedOfferId: row.id, productName: row.productName, brand: row.brand,
          descriptionText: row.descriptionText, packageSizeText: row.packageSizeText,
          quantityValue: row.quantityValue?.toString() ?? null, quantityUnit: row.quantityUnit,
          isMultiVariant: row.isMultiVariant, isPriceRange: row.isPriceRange,
          quantityIsApproximate: row.quantityIsApproximate,
        };
        const plan = planProductPromotion(input);
        if (plan.decision === 'HOLD') {
          for (const reason of plan.reasons) hold(offer.id, reason);
          continue;
        }
        // A source identity is required to select the same representative across fresh databases.
        if (!row.sourceRecordId?.trim()) { hold(offer.id, 'SOURCE_RECORD_ID_MISSING'); continue; }
        eligible++;
        if (offer.productId) alreadyLinked++;
        const list = groups.get(plan.fingerprint) ?? [];
        list.push({ ...plan, sourceRecordId: row.sourceRecordId, flyerExternalId: offer.flyerExternalId, marketKey: offer.marketKey });
        groups.set(plan.fingerprint, list);
      }
      cursor = page[page.length - 1].id;
    }
    // Reject false merges: one fingerprint should never represent differing literal package
    // descriptions that imply a multipack/range (planner already screens these).
    const previews = [...groups.entries()].slice(0, 25).map(([fingerprint, offers]) => {
      const seed = selectCanonicalRepresentative(offers);
      return { fingerprint: fingerprint.slice(0, 16), productName: seed.productName, brand: seed.brand,
        quantity: seed.quantityText, offers: offers.length };
    });
    let createdProducts = 0, reusedProducts = 0, newLinks = 0, existingLinks = 0, conflicts = 0;
    if (write) {
      for (const [fingerprint, candidates] of groups) {
        const result = await prisma.$transaction(async tx => {
          // Serializes transactions from this importer for one fingerprint. Evidence index is not unique,
          // therefore external writers must use the same locking discipline.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`kavyo-b4:${fingerprint}`}))`;
          const evidence = await tx.productEvidence.findMany({
            where: { sourceSystemId: source.id, evidenceType: 'CANONICAL_IDENTITY', sourceRecordId: IDENTITY_PREFIX + fingerprint },
            select: { productId: true }, take: 2,
          });
          if (evidence.length > 1) return { kind: 'CONFLICT' as const, links: 0 };
          // Refuse a group containing previously linked, contradictory Product IDs.
          const wanted = candidates.map(c => c.offerId);
          const prior = await tx.advertisedOffer.findMany({ where: { id: { in: wanted } }, select: { id: true, productId: true } });
          const knownIds = new Set(prior.map(x => x.productId).filter((id): id is string => id !== null));
          let productId = evidence[0]?.productId ?? null;
          if (knownIds.size > 1 || (knownIds.size === 1 && (!productId || !knownIds.has(productId))))
            return { kind: 'CONFLICT' as const, links: 0 };
          let created = false;
          if (!productId) {
            const seed = selectCanonicalRepresentative(candidates);
            const product = await tx.product.create({
              data: {
                barcode: null, productName: seed.productName, brand: seed.brand,
                quantityValue: seed.quantityValue, quantityUnit: seed.quantityUnit,
                quantityText: seed.quantityText, categories: seed.scopeCategory, isActive: true,
              }, select: { id: true }
            });
            productId = product.id; created = true;
            await tx.productEvidence.create({
              data: {
                productId, sourceSystemId: source.id, sourceRecordId: IDENTITY_PREFIX + fingerprint,
                evidenceType: 'CANONICAL_IDENTITY', verified: false,
                rawPayload: {
                  identityFingerprint: fingerprint, sourceStagedOfferId: seed.stagedOfferId,
                  firstAdvertisedOfferId: seed.offerId, confidence: 'EXACT_BRAND_NAME_PACKAGE_UNVERIFIED'
                } as Prisma.InputJsonValue,
              }
            });
          }
          // Never rewrite a pre-existing link to a different canonical Product.
          const links = await tx.advertisedOffer.updateMany({
            where: { id: { in: wanted }, sourceSystemId: source.id, productId: null }, data: { productId },
          });
          const rows = await tx.advertisedOffer.findMany({ where: { id: { in: wanted } }, select: { id: true, productId: true } });
          const incompatible = rows.filter(x => x.productId !== productId).length;
          return {
            kind: incompatible ? 'PARTIAL_CONFLICT' as const : 'OK' as const,
            created, links: links.count, already: rows.length - links.count, incompatible
          };
        }, { timeout: 20000 });
        if (result.kind === 'CONFLICT') { conflicts++; continue; }
        if (result.created) createdProducts++; else reusedProducts++;
        newLinks += result.links;
        existingLinks += result.already - (result.incompatible ?? 0);
        conflicts += result.incompatible ?? 0;
      }
    }
    const after = {
      products: await prisma.product.count(), offers: await prisma.advertisedOffer.count(),
      stagedOffers: await prisma.stagedOffer.count(), priceObservations: await prisma.priceObservation.count(),
      evidence: await prisma.productEvidence.count()
    };
    if (before.offers !== after.offers || before.stagedOffers !== after.stagedOffers || before.priceObservations !== after.priceObservations)
      throw Error('SAFETY STOP: unrelated table counts changed; check concurrent processes');
    const report = {
      mode: write ? 'WRITE' : 'DRY_RUN', database: db[0].db, totalAdvertisedFlippOffers: total, analyzed,
      eligibleOfferRows: eligible, distinctProductIdentities: groups.size,
      duplicateIdentityRows: eligible - groups.size, alreadyLinkedAtStart: alreadyLinked,
      heldOfferRows: analyzed - eligible, missingStaging, holdReasonCounts: Object.fromEntries([...holds].sort((a, b) => b[1] - a[1])),
      holdSamples, previews, createdProducts, reusedProducts, newLinks, existingLinks, conflicts, before, after,
      notes: [
        'Canonical identities require IN_SCOPE, exact normalized name+brand+single package, and no grouped/range flags.',
        'No GTIN is inferred from Flipp SKU. Created products receive barcode=NULL.',
        'Only product, product_evidence, and advertised_offers.product_id may change in WRITE mode.',
        'Existing Product attributes are never overwritten by this importer.',
        'Unknown/scope-REVIEW offers remain durable, unlinked advertisements.',
        'Importer is limited to approved local Kavyo databases; concurrency guard applies to this importer only.',
      ], generatedAt: new Date().toISOString()
    };
    const dir = resolve('data/research/living-db'); await mkdir(dir, { recursive: true });
    await writeFile(join(dir, write ? 'product-promotion-write.json' : 'product-promotion-dry-run.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await prisma.$disconnect() }
}
main().catch(e => { console.error(e); process.exitCode = 1 });

/**
 * B.6.3 - Promote only the November 9 capture's priced staged records to AdvertisedOffer.
 * Default DRY_RUN. --write creates MISSING advertised offers, never updates existing
 * offers (especially the verified B.5 baseline), products, staging or price observations.
 * Uses the existing B.5 pure offer mapper and stable-key policy.
 */
import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { prepareFlippAdvertisedOffer, type FlippStagedOfferRow, type PreparedAdvertisedOffer } from '../src/ingestion/living-catalog/staged-offer-promotion.js';

const CAPTURE = 'data/research/flipp/2026-11-09T22-22-05-015Z';
const args = process.argv.slice(2);
const write = args.includes('--write');
const rawLimit = args.find(x => x.startsWith('--limit='))?.split('=')[1] ?? '0';
const limit = Number(rawLimit);
if (args.some(x => x !== '--write' && !x.startsWith('--limit=')) || !Number.isSafeInteger(limit) || limit < 0)
  throw Error('Usage: npx tsx scripts/promote-b6-historical-advertisements.ts [--limit=100] [--write]');
const connection = process.env.DATABASE_URL;
if (!connection) throw Error('DATABASE_URL required');
const url = new URL(connection);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/kavyo_phase_b_test')
  throw Error('SAFETY STOP: database must be localhost/kavyo_phase_b_test');
const root = resolve(CAPTURE);
const report = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8'));
const summary = JSON.parse(readFileSync(join(root, 'analysis/b6-historical-preview/summary.json'), 'utf8'));
if (!report.finished || summary.uniqueFlyerItemPairs !== 5969 || summary.conflicts !== 0 || summary.missingSourceFiles !== 0)
  throw Error('SAFETY STOP: unexpected source capture state');
const lines = readFileSync(join(root, 'analysis/b6-historical-preview/source-records.jsonl'), 'utf8').trim().split(/\r?\n/);
const all = lines.map(line => JSON.parse(line) as { sourceRecordId: string; flyerExternalId: string; retailer: string; advertisedPrice: string | null });
const positive = (v: unknown) => v != null && /^\$?\s*\d+(?:\.\d+)?$/.test(String(v).trim()) && Number(String(v).replace(/^\$\s*/, '')) > 0;
const priced = all.filter(x => positive(x.advertisedPrice));
if (all.length !== 5969 || priced.length !== 5279) throw Error(`SAFETY STOP: expected 5969 source / 5279 priced; got ${all.length}/${priced.length}`);
const selected = limit ? priced.slice(0, limit) : priced;
const key = (f: string, i: string) => `${f}|${i}`;
const indexed = new Map(selected.map(x => [key(x.flyerExternalId, x.sourceRecordId), x]));
const wanted = new Set(selected.map(x => key(x.flyerExternalId, x.sourceRecordId)));
if (wanted.size !== selected.length) throw Error('Duplicate manifest item/flyer pairs');
const perRetailer = new Map<string, { source: number; staged: number; ready: number; held: number; new: number; existing: number }>();
for (const r of selected) {
  const v = perRetailer.get(r.retailer) ?? { source: 0, staged: 0, ready: 0, held: 0, new: 0, existing: 0 };
  v.source++; perRetailer.set(r.retailer, v);
}
const chunk = <T>(v: T[], size: number) => Array.from({ length: Math.ceil(v.length / size) }, (_, i) => v.slice(i * size, (i + 1) * size));
const toData = (p: PreparedAdvertisedOffer) => ({
  sourceSystemId: p.sourceSystemId, retailerId: p.retailerId, flyerId: p.flyerId,
  flyerExternalId: p.flyerExternalId, sourceRecordId: p.sourceRecordId, marketKey: p.marketKey,
  productName: p.productName, packageSizeText: p.packageSizeText,
  advertisedPriceAmount: p.advertisedPriceAmount, regularPriceAmount: p.regularPriceAmount,
  currency: p.currency, promotionText: p.promotionText,
  conditionEvidence: p.conditionEvidence as Prisma.InputJsonValue,
  sourceUrl: p.sourceUrl, ...(p.rawPayload == null ? {} : { rawPayload: p.rawPayload as Prisma.InputJsonValue }),
  observedAt: p.observedAt, validFrom: p.validFrom, validUntil: p.validUntil,
});

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection }) });
  try {
    const current = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
    if (current[0]?.db !== 'kavyo_phase_b_test') throw Error('SAFETY STOP: actual DB mismatch');
    const source = await prisma.sourceSystem.findUnique({ where: { name: 'FLIPP_FLYERS' }, select: { id: true } });
    if (!source) throw Error('FLIPP_FLYERS source missing');
    const before = {
      staged: await prisma.stagedOffer.count(), ads: await prisma.advertisedOffer.count(),
      products: await prisma.product.count(), evidence: await prisma.productEvidence.count(), observations: await prisma.priceObservation.count()
    };
    const ids = [...new Set(selected.map(x => x.sourceRecordId))];
    const staged: FlippStagedOfferRow[] = [];
    for (const group of chunk(ids, 250)) {
      const rows = await prisma.stagedOffer.findMany({
        where: { sourceSystemId: source.id, sourceRecordId: { in: group } },
        select: {
          id: true, sourceSystemId: true, retailerId: true, sourceRecordId: true, recordKey: true, productName: true,
          packageSizeText: true, advertisedPriceAmount: true, regularPriceAmount: true, currency: true, promotionText: true,
          offerComment: true, validFrom: true, validUntil: true, observedAt: true, sourceUrl: true, rawPayload: true,
          normalizedPayload: true, reviewReasons: true, isMemberPrice: true, isMultibuy: true, isMultiVariant: true,
          isPriceRange: true, quantityIsApproximate: true, flyerId: true,
          flyer: { select: { externalId: true, postalCode: true, retailer: { select: { name: true } } } }
        },
      });
      for (const r of rows) {
        if (
          !r.flyer ||
          !r.sourceRecordId ||
          !wanted.has(key(r.flyer.externalId, r.sourceRecordId))
        ) {
          continue;
        }

        const match = indexed.get(
          key(r.flyer.externalId, r.sourceRecordId),
        );

        if (!match || match.retailer !== r.flyer.retailer?.name) {
          throw new Error(
            `Retailer/flyer mismatch or missing retailer for staged record ${r.id}`,
          );
        }

        staged.push(r);
      }
    }
    const present = new Set(staged.map(r => key(r.flyer!.externalId, r.sourceRecordId!)));
    if (present.size !== staged.length) throw Error('Duplicate staged item/flyer pair; stop before promotion');
    const missing = selected.filter(x => !present.has(key(x.flyerExternalId, x.sourceRecordId)));
    if (missing.length) throw Error(`SAFETY STOP: ${missing.length} priced records missing in staging; examples: ${JSON.stringify(missing.slice(0, 5))}`);

    const holds: Record<string, number> = {};
    const holdSamples: Array<{ stageId: string; reasons: string[] }> = [];
    const proposals: PreparedAdvertisedOffer[] = [];
    for (const row of staged) {
      const result = prepareFlippAdvertisedOffer(row);
      const retailer = indexed.get(key(row.flyer!.externalId, row.sourceRecordId!))!.retailer;
      const metric = perRetailer.get(retailer)!; metric.staged++;
      if (result.kind === 'HOLD') {
        metric.held++;
        for (const reason of result.reasons) holds[reason] = (holds[reason] ?? 0) + 1;
        if (holdSamples.length < 25) holdSamples.push({ stageId: row.id, reasons: result.reasons });
      } else { metric.ready++; proposals.push(result.offer); }
    }
    const unique = new Map<string, PreparedAdvertisedOffer>();
    for (const p of proposals) {
      const prior = unique.get(p.stableKey);
      if (prior && prior.sourceStagedOfferId !== p.sourceStagedOfferId) throw Error(`Stable-key collision between two distinct staged records: ${p.stableKey}`);
      unique.set(p.stableKey, p);
    }
    const existing = new Map<string, { id: string; productId: string | null }>();
    for (const g of chunk([...unique.keys()], 250)) {
      const rows = await prisma.advertisedOffer.findMany({ where: { stableKey: { in: g } }, select: { id: true, stableKey: true, productId: true } });
      for (const row of rows) existing.set(row.stableKey, { id: row.id, productId: row.productId });
    }
    const newOffers = [...unique.values()].filter(p => !existing.has(p.stableKey));
    const statuses = new Map([...selected.map(x => [key(x.flyerExternalId, x.sourceRecordId), x.retailer] as const)]);
    for (const p of unique.values()) {
      const who = statuses.get(key(p.flyerExternalId, p.sourceRecordId));
      if (!who) throw Error(`Source/market identity mismatch ${p.sourceRecordId}`);
      perRetailer.get(who)![existing.has(p.stableKey) ? 'existing' : 'new']++;
    }
    let inserted = 0;
    if (write) {
      // This importer intentionally never UPDATES an existing advertisement, preserving all
      // prior B.5 product links, condition evidence, reconciliation and historical claims.
      for (const group of chunk(newOffers, 100)) {
        const res = await prisma.advertisedOffer.createMany({
          data: group.map(p => ({ ...toData(p), stableKey: p.stableKey, lastSeenAt: p.observedAt, productId: null })),
          skipDuplicates: true,
        });
        inserted += res.count;
      }
    }
    const after = {
      staged: await prisma.stagedOffer.count(), ads: await prisma.advertisedOffer.count(),
      products: await prisma.product.count(), evidence: await prisma.productEvidence.count(), observations: await prisma.priceObservation.count()
    };
    if (after.staged !== before.staged || after.products !== before.products || after.evidence !== before.evidence || after.observations !== before.observations)
      throw Error('UNRELATED TABLE CHANGED: inspect concurrent processes');
    if (write && after.ads - before.ads !== inserted) throw Error('Advertisement count does not reconcile with inserts');
    const result = {
      phase: 'B6_3', mode: write ? 'WRITE' : 'DRY_RUN', database: current[0].db, capture: basename(root),
      captured: all.length, pricedCapture: selected.length, stagedFound: staged.length, ready: proposals.length,
      uniqueKeys: unique.size, held: staged.length - proposals.length, alreadyAdvertised: existing.size,
      toCreate: newOffers.length, inserted, retailers: Object.fromEntries([...perRetailer].sort()),
      holdReasons: holds, holdSamples, before, after,
      caveats: ['Historical flyer prices; not verified shelf prices or store inventory',
        'Existing advertised offers are never updated by this importer',
        'Product promotion is separate and requires B.5 identity review',
        'Source postal-code coverage is preserved in staging, not treated as store-level availability']
    };
    const dest = resolve('data/research/living-db'); mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, write ? 'b6-advertisement-write.json' : 'b6-advertisement-dry-run.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally { await prisma.$disconnect(); }
}
main().catch(e => { console.error(e); process.exitCode = 1 });

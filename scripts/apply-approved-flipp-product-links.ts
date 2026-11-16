/**
 * Review-gated, idempotent linking of EXISTING canonical products to Flipp offers.
 * No product creation, price observation writes, stage changes, or overwrite of existing links.
 * Usage:
 *   npx tsx scripts/apply-approved-flipp-product-links.ts review/flipp-existing-product-link-approvals.json
 *   npx tsx scripts/apply-approved-flipp-product-links.ts review/flipp-existing-product-link-approvals.json --write --backup-confirmed
 */
import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence } from '../src/ingestion/living-catalog/product-promotion-plan.js';

type Approval = {
  fingerprint: string; existingProductId: string; offerIds: string[];
  approved: boolean; reviewNotes: string;
  productName?: string; unlinkedOffersAtReview?: number;
};
type ApprovalFile = { format: string; sourceSystem: string; entries: Approval[] };
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const args = process.argv.slice(2);
const write = args.includes('--write');
const approvedBackup = args.includes('--backup-confirmed');
const input = args.find(a => !a.startsWith('--'));
if (!input || args.some(a => a.startsWith('--') && !['--write', '--backup-confirmed'].includes(a))) {
  throw Error('Usage: npx tsx scripts/apply-approved-flipp-product-links.ts <review.json> [--write --backup-confirmed]');
}
if (write && !approvedBackup) throw Error('SAFETY STOP: write requires --backup-confirmed');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw Error('DATABASE_URL missing');
const url = new URL(connectionString);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/kavyo_phase_b_test')
  throw Error('SAFETY STOP: only local kavyo_phase_b_test permitted');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const stagedIdFrom = (v: Prisma.JsonValue | null): string | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const value = (v as Record<string, Prisma.JsonValue>).sourceStagedOfferId;
  return typeof value === 'string' && UUID.test(value) ? value : null;
};

async function main() {
  const bytes = await readFile(resolve(input!), 'utf8');
  const file = JSON.parse(bytes) as ApprovalFile;
  if (file.format !== 'KAVYO_EXISTING_LINK_APPROVALS_V1' || file.sourceSystem !== 'FLIPP_FLYERS' || !Array.isArray(file.entries))
    throw Error('Invalid review file format');
  const approved = file.entries.filter(r => r.approved === true);
  if (file.entries.some(r => typeof r.approved !== 'boolean')) throw Error('Every approval must be explicitly true or false');
  if (approved.some(r => !r.reviewNotes?.trim())) throw Error('Each approved group requires a nonempty reviewNotes explanation');
  const fingerprints = new Set<string>();
  const approvedOfferIds = new Set<string>();
  for (const a of approved) {
    if (!SHA256.test(a.fingerprint) || !UUID.test(a.existingProductId) || !Array.isArray(a.offerIds) || !a.offerIds.length)
      throw Error('Invalid approved fingerprint, product id, or offer list');
    if (fingerprints.has(a.fingerprint)) throw Error('Duplicate approved fingerprint');
    fingerprints.add(a.fingerprint);
    for (const id of a.offerIds) {
      if (!UUID.test(id) || approvedOfferIds.has(id)) throw Error(`Invalid or repeated approved offer id: ${id}`);
      approvedOfferIds.add(id);
    }
  }
  const digest = createHash('sha256').update(bytes).digest('hex');
  try {
    const db = await prisma.$queryRaw<Array<{name:string}>>`SELECT current_database() AS name`;
    if (db[0]?.name !== 'kavyo_phase_b_test') throw Error('SAFETY STOP: connected to wrong database');
    const source = await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    if (!source) throw Error('FLIPP_FLYERS source not found');
    const before = { products:await prisma.product.count(), evidence:await prisma.productEvidence.count(),
      observations:await prisma.priceObservation.count(), staged:await prisma.stagedOffer.count(),
      advertised:await prisma.advertisedOffer.count(), linked:await prisma.advertisedOffer.count({where:{sourceSystemId:source.id,productId:{not:null}}}) };
    // All validations happen inside the same transaction as the conditional updates.
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(72941, 11627)::text AS locked`;
      const summary = { approvedGroups:approved.length, reviewedOfferIds:approvedOfferIds.size,
        alreadyLinkedToTarget:0, newLinksPlanned:0, linked:0, groupResults:[] as Array<Record<string, unknown>> };
      for (const item of approved) {
        const evidenceRows = await tx.productEvidence.findMany({
          where:{sourceSystemId:source.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:`IDENTITY:${item.fingerprint}`},
          select:{productId:true,verified:true,product:{select:{isActive:true}}}
        });
        if (!evidenceRows.length || evidenceRows.some(e=>e.productId!==item.existingProductId || !e.product.isActive))
          throw Error(`SAFETY STOP: missing, conflicting or inactive identity evidence ${item.fingerprint}`);
        const product = await tx.product.findUnique({where:{id:item.existingProductId},select:{isActive:true}});
        if (!product?.isActive) throw Error(`SAFETY STOP: target product unavailable ${item.existingProductId}`);
        const offers = await tx.advertisedOffer.findMany({
          where:{id:{in:item.offerIds}},select:{id:true,stableKey:true,sourceSystemId:true,productId:true,conditionEvidence:true}
        });
        if (offers.length!==item.offerIds.length) throw Error(`SAFETY STOP: missing offer for ${item.fingerprint}`);
        const stageIds = offers.map(o=>stagedIdFrom(o.conditionEvidence));
        if(stageIds.some(id=>!id)) throw Error(`SAFETY STOP: absent source stage reference ${item.fingerprint}`);
        const stages = await tx.stagedOffer.findMany({
          where:{id:{in:stageIds as string[]},sourceSystemId:source.id},
          select:{id:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,
            isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true}
        });
        const byStage = new Map(stages.map(s=>[s.id,s]));
        let unlinked = 0; let existing = 0;
        for (const offer of offers) {
          if (offer.sourceSystemId!==source.id) throw Error(`SAFETY STOP: non-Flipp offer ${offer.id}`);
          if (offer.productId && offer.productId!==item.existingProductId) throw Error(`SAFETY STOP: conflicting product association ${offer.id}`);
          const sid = stagedIdFrom(offer.conditionEvidence);
          const s = sid ? byStage.get(sid) : null;
          if (!s) throw Error(`SAFETY STOP: missing staged evidence for offer ${offer.id}`);
          const evidence: PromotionEvidence = { offerId:offer.id,stableKey:offer.stableKey,sourceSystemId:offer.sourceSystemId,
            stagedOfferId:s.id,productName:s.productName,brand:s.brand,descriptionText:s.descriptionText,
            packageSizeText:s.packageSizeText,quantityValue:s.quantityValue?.toString()??null,quantityUnit:s.quantityUnit,
            isMultiVariant:s.isMultiVariant,isPriceRange:s.isPriceRange,quantityIsApproximate:s.quantityIsApproximate };
          const decision = planProductPromotion(evidence);
          if(decision.decision!=='CANDIDATE' || decision.fingerprint!==item.fingerprint)
            throw Error(`SAFETY STOP: current product validation changed for offer ${offer.id}`);
          if(offer.productId) existing++; else unlinked++;
        }
        summary.newLinksPlanned += unlinked; summary.alreadyLinkedToTarget += existing;
        summary.groupResults.push({fingerprint:item.fingerprint,productId:item.existingProductId,unlinked,alreadyLinked:existing});
        if(write && unlinked) {
          for(const offer of offers.filter(o=>!o.productId)) {
            const r = await tx.advertisedOffer.updateMany({where:{id:offer.id,productId:null,sourceSystemId:source.id},data:{productId:item.existingProductId}});
            if(r.count!==1) throw Error(`SAFETY STOP: concurrent link or missing row ${offer.id}`);
            summary.linked++;
          }
        }
      }
      return summary;
    }, {maxWait:30000,timeout:300000,isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    const after = {products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),
      observations:await prisma.priceObservation.count(),staged:await prisma.stagedOffer.count(),
      advertised:await prisma.advertisedOffer.count(),linked:await prisma.advertisedOffer.count({where:{sourceSystemId:source.id,productId:{not:null}}})};
    for(const field of ['products','evidence','observations','staged','advertised'] as const)
      if(after[field]!==before[field]) throw Error(`SAFETY ALERT: protected table ${field} count changed`);
    if(!write && after.linked!==before.linked) throw Error('SAFETY ALERT: linked count changed during dry run');
    if(write && after.linked-before.linked!==result.linked) throw Error('SAFETY ALERT: linked count does not match write report');
    const report = {mode:write?'WRITE':'DRY_RUN',database:db[0].name,reviewFile:resolve(input!),reviewSha256:digest,
      note:'Approval requires manual inspection of each product and source advertisement; a fingerprint match is not independently verified GTIN evidence.',
      ...result,before,after};
    const folder=resolve('data/research/living-db/product-link-plan');
    await mkdir(folder,{recursive:true});
    await writeFile(join(folder,write?'approved-link-write.json':'approved-link-dry-run.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1});

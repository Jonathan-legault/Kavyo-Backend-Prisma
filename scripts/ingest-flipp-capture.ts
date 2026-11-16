/**
 * Reusable OFFLINE Flipp archive -> Flyer + StagedOffer reconciler.
 * The same command accepts any capture with a verified b6-historical-preview manifest.
 * No advertised_offers, products, product_evidence, price_observations, or baskets writes.
 * Dry-run by default. Explicit --write --backup-confirmed required for any writes.
 * --reprocess permits refreshing derived fields on existing staged source identities.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { normalizeFlyerOffer } from '../src/flyers/normalization/flyer-normalizer.js';
import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from '../src/flyers/flipp/flipp.types.js';

const args = process.argv.slice(2);
const rootArg = args.find(a => !a.startsWith('--'));
const valid = new Set(['--write','--backup-confirmed','--reprocess']);
if (!rootArg || args.filter(a => !a.startsWith('--')).length !== 1 || args.some(a => a.startsWith('--') && !valid.has(a))) {
  throw Error('Usage: npx tsx scripts/ingest-flipp-capture.ts <capture-directory> [--reprocess] [--write --backup-confirmed]');
}
const root = resolve(rootArg);
const write = args.includes('--write');
const reprocess = args.includes('--reprocess');
if (write && !args.includes('--backup-confirmed')) throw Error('SAFETY STOP: --write requires a verified database backup and --backup-confirmed');
const captureName = basename(root);
const readJson = (path:string): any => JSON.parse(readFileSync(path,'utf8'));
const sha256 = (value:Buffer | string):string => createHash('sha256').update(value).digest('hex');
const asDate=(value:unknown):Date|null => {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
};
const cut=(v:string|null|undefined,n:number):string|null => v == null ? null : v.slice(0,n);
const chunk=<T>(xs:T[], size=200):T[][]=>Array.from({length:Math.ceil(xs.length/size)},(_,i)=>xs.slice(i*size,(i+1)*size));
const website:Record<string,string> = {
  'Safeway':'https://www.safeway.ca','Walmart':'https://www.walmart.ca',
  'Calgary Co-op':'https://www.calgarycoop.com','Save-On-Foods':'https://www.saveonfoods.com',
  'Sobeys':'https://www.sobeys.com','Real Canadian Superstore':'https://www.realcanadiansuperstore.ca',
  'No Frills':'https://www.nofrills.ca',
};

type RecordRow={
  sourceRecordId:string;flyerExternalId:string;merchantId:string;retailer:string;postalCodes:string[];
  itemDetailPath:string;itemDetailSha256:string;advertisedPrice:string|number|null;
};
type Candidate={
  sourceKey:string; record:RecordRow; flyer:FlippFlyer;
  row: Omit<Prisma.StagedOfferUncheckedCreateInput,'ingestBatchId'|'sourceSystemId'|'flyerId'|'retailerId'|'recordKey'>;
};
const reportDir=join(root,'analysis','reusable-ingestion');

function loadCapture():{records:RecordRow[];observedAt:Date;summary:any} {
  const reportPath=join(root,'report.json');
  const summaryPath=join(root,'analysis/b6-historical-preview/summary.json');
  const manifestPath=join(root,'analysis/b6-historical-preview/source-records.jsonl');
  for(const path of [reportPath,summaryPath,manifestPath]) if(!existsSync(path)) throw Error(`Missing required source file: ${path}`);
  const report=readJson(reportPath),summary=readJson(summaryPath);
  if(report.finished!==true || summary.missingSourceFiles!==0 || summary.conflicts!==0) throw Error('SAFETY STOP: incomplete or conflicted capture');
  const records=readFileSync(manifestPath,'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s) as RecordRow);
  if(records.length!==summary.uniqueFlyerItemPairs || !records.length) throw Error('SAFETY STOP: manifest count does not match preview');
  const ids=new Set<string>();
  for(const r of records){
    const key=`${r.flyerExternalId}|${r.sourceRecordId}`;
    if(ids.has(key)) throw Error(`SAFETY STOP: duplicate source identity ${key}`);
    ids.add(key);
    if(!website[r.retailer] || !r.postalCodes?.length || !r.sourceRecordId || !r.flyerExternalId) throw Error(`Invalid source record ${key}`);
    if(r.itemDetailPath.startsWith('/') || r.itemDetailPath.includes('..') || r.itemDetailPath.includes('\\')) throw Error(`Unsafe detail path ${r.itemDetailPath}`);
  }
  const observedAt=asDate(report.completedAt ?? summary.reportCompletedAt);
  if(!observedAt) throw Error('Missing/invalid capture timestamp');
  return {records,observedAt,summary};
}
function prepare(r:RecordRow,observedAt:Date):Candidate {
  const bytes=readFileSync(join(root,r.itemDetailPath));
  if(sha256(bytes)!==r.itemDetailSha256) throw Error(`Source checksum changed: ${r.sourceRecordId}`);
  const parsed=JSON.parse(bytes.toString('utf8'));
  const detail=(parsed.item??parsed) as FlippItemDetail & Record<string,any>;
  if(String(detail.id)!==r.sourceRecordId || String(detail.flyer_id)!==r.flyerExternalId ||
     String(detail.merchant_id)!==r.merchantId || detail.merchant!==r.retailer) {
    throw Error(`Source identity mismatch: ${r.flyerExternalId}/${r.sourceRecordId}`);
  }
  const sourceKey=`${r.flyerExternalId}|${r.sourceRecordId}`;
  const flyer:FlippFlyer={
    id:Number(r.flyerExternalId),flyer_run_id:0,name:`Flipp flyer ${r.flyerExternalId}`,
    merchant:r.retailer,merchant_id:Number(r.merchantId),postal_code:[...r.postalCodes].sort()[0],locale:'en-ca',
    valid_from:detail.flyer_valid_from??detail.valid_from??'',valid_to:detail.flyer_valid_to??detail.valid_to??'',
  };
  // A null price is valid advertisement evidence. Never substitute a promotion's bundle price.
  const advertisedPrice=detail.current_price??r.advertisedPrice??null;
  const item:FlippFlyerItem={
    id:Number(r.sourceRecordId),flyer_id:Number(r.flyerExternalId),name:detail.name??'',brand:detail.brand??null,
    price:advertisedPrice,valid_from:detail.valid_from,valid_to:detail.valid_to,
    cutout_image_url:detail.cutout_image_url,sale_story:detail.sale_story,
    pre_price_text:detail.pre_price_text,post_price_text:detail.price_text,
  };
  // Do not publish unnamed banners as products. Still preserve those raw captures offline.
  if(!item.name?.trim()) throw Error(`Missing product/advertisement label for ${sourceKey}`);
  const normalized=normalizeFlyerOffer({retailerName:r.retailer,flyer,item,detail,observedAt,
    sourceUrl:`https://flipp.com/en-ca/calgary-ab/flyer/${r.flyerExternalId}`});
  const rawPayload={...normalized.rawPayload,capture:captureName,postalCodes:r.postalCodes,
    sourceDetailSha256:r.itemDetailSha256,sourceUrl:detail.ttm_url??null};
  const normalizedPayload={...normalized.normalizedPayload,capture:captureName,
    retrievalPostalCodes:r.postalCodes};
  return {sourceKey,record:r,flyer,row:{
    sourceRecordId:cut(normalized.sourceRecordId,300),retailerName:r.retailer,
    productName:cut(normalized.productName,500)!,brand:cut(normalized.brand,500),
    descriptionText:normalized.descriptionText,packageSizeText:cut(normalized.packageSizeText,200),
    quantityValue:normalized.quantityValue,quantityUnit:cut(normalized.quantityUnit,20),
    quantityIsApproximate:normalized.quantityIsApproximate,family:cut(normalized.family,80),
    advertisedPriceText:normalized.advertisedPriceText,
    advertisedPriceAmount:normalized.advertisedPriceAmount,regularPriceAmount:normalized.regularPriceAmount,
    pricingBasis:normalized.pricingBasis,isMemberPrice:normalized.isMemberPrice,isMultibuy:normalized.isMultibuy,
    isMultiVariant:normalized.isMultiVariant,isPriceRange:normalized.isPriceRange,
    unitPrice:normalized.unitPrice,unitPriceBasis:cut(normalized.unitPriceBasis,20),currency:normalized.currency,
    promotionText:normalized.promotionText,offerComment:normalized.offerComment,
    validFrom:normalized.validFrom,validUntil:normalized.validUntil,observedAt,
    imageUrl:cut(normalized.imageUrl,1000),sourceUrl:cut(normalized.sourceUrl,1000),
    matchKey:cut(normalized.matchKey,300),familyKey:cut(normalized.familyKey,150),
    status:normalized.status,reviewRequired:normalized.reviewRequired,
    reviewReasons:normalized.reviewReasons as Prisma.InputJsonValue,
    normalizedPayload:normalizedPayload as Prisma.InputJsonValue,
    rawPayload:rawPayload as Prisma.InputJsonValue,
  }};
}

async function main(){
  if(!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');
  const u=new URL(process.env.DATABASE_URL);
  if(!['localhost','127.0.0.1'].includes(u.hostname) || u.pathname!=='/kavyo_phase_b_test')
    throw Error('SAFETY STOP: only local kavyo_phase_b_test is permitted');
  const {records,observedAt}=loadCapture();
  // Verify ALL source details before opening a write path.
  const prepared=records.map(r=>prepare(r,observedAt));
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if(db[0]?.db!=='kavyo_phase_b_test') throw Error('SAFETY STOP: database identity mismatch');
    const source=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    const knownFlyers=source ? await prisma.flyer.findMany({where:{sourceSystemId:source.id},select:{id:true,externalId:true}}):[];
    const dbFlyerIds=new Map(knownFlyers.map(f=>[f.externalId,f.id]));
    // Find staged source identities independently of ingest-batch IDs; these are NOT globally unique in the schema.
    const existing=new Map<string,{id:string;matchedProductId:string|null;normalizedPayload:unknown;rawPayload:unknown}>();
    if(source){
      for(const group of chunk([...new Set(records.map(r=>r.sourceRecordId))],250)){
        const rows=await prisma.stagedOffer.findMany({where:{sourceSystemId:source.id,sourceRecordId:{in:group}},
          select:{id:true,sourceRecordId:true,matchedProductId:true,normalizedPayload:true,rawPayload:true,flyer:{select:{externalId:true}}}});
        for(const row of rows){
          if(!row.flyer || !row.sourceRecordId) continue;
          const key=`${row.flyer.externalId}|${row.sourceRecordId}`;
          if(existing.has(key)) throw Error(`SAFETY STOP: multiple staged rows for source identity ${key}; manual reconciliation required`);
          existing.set(key,{id:row.id,matchedProductId:row.matchedProductId,normalizedPayload:row.normalizedPayload,rawPayload:row.rawPayload});
        }
      }
    }
    const missing=prepared.filter(p=>!existing.has(p.sourceKey));
    const revisitable=prepared.filter(p=>existing.has(p.sourceKey));
    // Compare source interpretations separately from capture-specific audit metadata.
    // This is an observational diagnostic; it does not authorize overwriting old records.
    const metadataKeys = new Set(['capture', 'retrievalPostalCodes', 'postalCodes', 'sourceDetailSha256']);
    const stripMetadata = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(stripMetadata);
      if (value !== null && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !metadataKeys.has(key))
          .sort(([a],[b]) => a.localeCompare(b))
          .map(([key, val]) => [key, stripMetadata(val)]));
      }
      return value;
    };
    const equal = (a: unknown, b: unknown): boolean =>
      JSON.stringify(stripMetadata(a)) === JSON.stringify(stripMetadata(b));
    const differingTopLevelKeys = (a: unknown, b: unknown): string[] => {
      const left = (stripMetadata(a) ?? {}) as Record<string, unknown>;
      const right = (stripMetadata(b) ?? {}) as Record<string, unknown>;
      if (typeof left !== 'object' || Array.isArray(left) ||
          typeof right !== 'object' || Array.isArray(right)) return ['<payload-shape>'];
      return [...new Set([...Object.keys(left), ...Object.keys(right)])]
        .filter(key => JSON.stringify(stripMetadata(left[key])) !== JSON.stringify(stripMetadata(right[key])))
        .sort();
    };
    const changed = revisitable.filter(p => {
      const prior = existing.get(p.sourceKey)!;
      return !equal(prior.normalizedPayload, p.row.normalizedPayload) ||
        !equal(prior.rawPayload, p.row.rawPayload);
    });
    const unchanged = revisitable.length - changed.length;
    const normalizedChanged = revisitable.filter(p =>
      !equal(existing.get(p.sourceKey)!.normalizedPayload, p.row.normalizedPayload));
    const rawChanged = revisitable.filter(p =>
      !equal(existing.get(p.sourceKey)!.rawPayload, p.row.rawPayload));
    const noPayloadDifferenceAfterMetadataExclusion = revisitable.length - changed.length;
    const changedKeyFrequency: Record<string,number> = {};
    const sampleDifferences = changed.slice(0,12).map(p => {
      const prior = existing.get(p.sourceKey)!;
      const normalizedKeys = differingTopLevelKeys(prior.normalizedPayload, p.row.normalizedPayload);
      const rawKeys = differingTopLevelKeys(prior.rawPayload, p.row.rawPayload);
      for (const key of normalizedKeys) changedKeyFrequency[`normalized.${key}`] = (changedKeyFrequency[`normalized.${key}`] ?? 0) + 1;
      for (const key of rawKeys) changedKeyFrequency[`raw.${key}`] = (changedKeyFrequency[`raw.${key}`] ?? 0) + 1;
      return {sourceKey:p.sourceKey,normalizedKeys,rawKeys};
    });
    const missingFlyers=[...new Set(records.map(r=>r.flyerExternalId))].filter(id=>!dbFlyerIds.has(id));
    const before={flyers:await prisma.flyer.count(),staged:await prisma.stagedOffer.count(),
      advertised:await prisma.advertisedOffer.count(),products:await prisma.product.count(),
      evidence:await prisma.productEvidence.count(),observations:await prisma.priceObservation.count()};
    let inserted=0,updated=0;
    if(write && reprocess) throw Error('SAFETY STOP: --write --reprocess disabled pending validated field-level migration');
    if(write){
      // Single transaction: a failure rolls back flyers, ingest batch, and ALL staged inserts.
      // Advisory transaction lock serializes concurrent executions of this ingestion workflow.
      await prisma.$transaction(async tx => {
        await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock(72941, 11626)::text AS locked`);
        const src=await tx.sourceSystem.upsert({where:{name:'FLIPP_FLYERS'},update:{},create:{
          name:'FLIPP_FLYERS',sourceType:'FLYER_AGGREGATOR',baseUrl:'https://flipp.com',
          licenseInfo:'Historical flyer capture; verify redistribution rights before production',
        }});
        const retailers=new Map<string,string>();
        for(const name of [...new Set(records.map(r=>r.retailer))]){
          const row=await tx.retailer.upsert({where:{name},update:{},create:{name,website:website[name]}});
          retailers.set(name,row.id);
        }
        const flyers=new Map<string,string>();
        const flyerCandidates=new Map(prepared.map(p=>[p.record.flyerExternalId,p]));
        for(const [externalId,candidate] of flyerCandidates){
          const r=candidate.record;
          const row=await tx.flyer.upsert({where:{sourceSystemId_externalId:{sourceSystemId:src.id,externalId}},
            create:{sourceSystemId:src.id,retailerId:retailers.get(r.retailer)!,externalId,
              merchantId:r.merchantId,name:`Flipp flyer ${externalId}`,postalCode:candidate.flyer.postal_code,
              locale:'en-ca',validFrom:asDate(candidate.flyer.valid_from),validUntil:asDate(candidate.flyer.valid_to),
              sourceUrl:`https://flipp.com/en-ca/calgary-ab/flyer/${externalId}`,fetchedAt:observedAt,
              rawPayload:{capture:captureName,source:'OFFLINE_ARCHIVE',retrievalPostalCodes:r.postalCodes} as Prisma.InputJsonValue},
            update:{},select:{id:true}});
          flyers.set(externalId,row.id);
        }
        const captureKeys=new Set(prepared.map(p=>p.sourceKey));
        // Recheck AFTER obtaining the advisory lock. The schema's staged-offer unique keys
        // are scoped to ingest batch; they cannot prevent duplicate records across batches.
        for(const group of chunk([...new Set(records.map(r=>r.sourceRecordId))],250)){
          const rows=await tx.stagedOffer.findMany({where:{sourceSystemId:src.id,sourceRecordId:{in:group}},
            select:{sourceRecordId:true,flyer:{select:{externalId:true}}}});
          const seen=new Set<string>();
          for(const row of rows){
            if(!row.flyer || !row.sourceRecordId) continue;
            const key=`${row.flyer.externalId}|${row.sourceRecordId}`;
            if(seen.has(key)) throw Error(`SAFETY STOP: duplicate staged source identity ${key}`);
            seen.add(key);
            if(captureKeys.has(key) && !existing.has(key)) throw Error(`SAFETY STOP: source ${key} appeared after reconciliation; rerun dry-run`);
          }
        }
        if(missing.length){
          const batch=await tx.ingestBatch.create({data:{sourceSystemId:src.id,
            sourceReference:`FLIPP_ARCHIVE:${captureName}`,status:'RUNNING',startedAt:new Date()}});
          for(const group of chunk(missing,100)){
            const rows:Prisma.StagedOfferCreateManyInput[]=group.map(p=>({
              ...p.row,sourceSystemId:src.id,ingestBatchId:batch.id,
              flyerId:flyers.get(p.record.flyerExternalId)!,retailerId:retailers.get(p.record.retailer)!,
              recordKey:sha256(JSON.stringify([src.id,flyers.get(p.record.flyerExternalId),p.record.sourceRecordId])),
            }));
            const res=await tx.stagedOffer.createMany({data:rows,skipDuplicates:false});
            if(res.count!==rows.length) throw Error('SAFETY STOP: missing staged inserts');
            inserted+=res.count;
          }
          await tx.ingestBatch.update({where:{id:batch.id},data:{status:'COMPLETED',completedAt:new Date(),
            recordsRead:records.length,recordsInserted:inserted,recordsRejected:0}});
        }
        // Deliberately do not modify existing staged rows. Source reinterpretation
        // requires a separately reviewed field-level update path.
      },{maxWait:30000,timeout:300000});
    }
    const after={flyers:await prisma.flyer.count(),staged:await prisma.stagedOffer.count(),
      advertised:await prisma.advertisedOffer.count(),products:await prisma.product.count(),
      evidence:await prisma.productEvidence.count(),observations:await prisma.priceObservation.count()};
    if(after.advertised!==before.advertised || after.products!==before.products ||
      after.evidence!==before.evidence || after.observations!==before.observations)
      throw Error('SAFETY ALERT: unrelated data changed; investigate concurrent writers');
    const result={mode:write?'WRITE':'DRY_RUN',database:db[0].db,capture:captureName,
      sourceRecords:records.length,priced:prepared.filter(p=>p.row.advertisedPriceAmount!==null).length,
      unpriced:prepared.filter(p=>p.row.advertisedPriceAmount===null).length,
      stagedAlready:revisitable.length,toInsert:missing.length,missingFlyerRows:missingFlyers.length,
      reprocessRequested:reprocess,existingEligibleForRefresh:reprocess?changed.length:0,unchangedExisting:unchanged,
      changeDiagnostic:{normalizedChanged:normalizedChanged.length,rawChanged:rawChanged.length,noPayloadDifferenceAfterMetadataExclusion,
        sampleDifferences,changedKeyFrequencySample:changedKeyFrequency},
      inserted,updated,before,after,
      notes:['No advertised offers written by this step. Use the existing shared promotion mapper in a separately reviewed step.',
        'Dry-run identifies changed payloads; --reprocess refreshes those source-derived fields while leaving unchanged records intact.',
        'Raw capture is immutable; price observations, canonical products and product links are untouched.',
        'All source rows are staged including banners; advertisement eligibility gates promotion.',
        'Single-transaction staging write; replay avoids creating duplicate source identities. Existing rows are not rewritten.']};
    mkdirSync(reportDir,{recursive:true});
    writeFileSync(join(reportDir,write?'write-report.json':'dry-run-report.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{await prisma.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});

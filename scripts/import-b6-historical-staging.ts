/**
 * B.6.2 historical Flipp capture -> existing Flyer/StagedOffer, no network requests.
 * Defaults to DRY_RUN; --write restricted to localhost/kavyo_phase_b_test.
 * Does NOT modify Product, ProductEvidence, AdvertisedOffer, PriceObservation or basket tables.
 * Reuses existing normalizeFlyerOffer from src/flyers/normalization/flyer-normalizer.
 * Node 22 / tsx / Prisma adapter-PG.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { normalizeFlyerOffer } from '../src/flyers/normalization/flyer-normalizer.js';
import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from '../src/flyers/flipp/flipp.types.js';

const DEFAULT_CAPTURE = 'data/research/flipp/2026-11-09T22-22-05-015Z';
const captureRoot = resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? DEFAULT_CAPTURE);
const write = process.argv.includes('--write');
const maxArg = process.argv.find(a => a.startsWith('--limit='));
const limit = Number(maxArg?.split('=')[1] ?? 0);
if (!Number.isSafeInteger(limit) || limit < 0) throw Error('--limit must be a nonnegative integer (0 = all)');
const read = (p: string): any => JSON.parse(readFileSync(p, 'utf8'));
const reportPath = join(captureRoot, 'report.json');
const manifestPath = join(captureRoot, 'analysis/b6-historical-preview/source-records.jsonl');
const summaryPath = join(captureRoot, 'analysis/b6-historical-preview/summary.json');
const sourceReference = `B6_ARCHIVE:${basename(captureRoot)}`;
const outputDir = join(captureRoot, 'analysis/b6-staging');
const allowedRetailers = new Set(['Safeway','Walmart','Calgary Co-op','Save-On-Foods','Sobeys','Real Canadian Superstore','No Frills']);
const retailerWebsites: Record<string,string> = {
  Safeway: 'https://www.safeway.ca', Walmart:'https://www.walmart.ca', 'Calgary Co-op':'https://www.calgarycoop.com',
  'Save-On-Foods':'https://www.saveonfoods.com', Sobeys:'https://www.sobeys.com',
  'Real Canadian Superstore':'https://www.realcanadiansuperstore.ca', 'No Frills':'https://www.nofrills.ca',
};
const toDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};
const truncate = (v: string | null | undefined, size: number): string | null => v == null ? null : String(v).slice(0,size);
const hash = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const chunk = <T>(arr:T[], size:number):T[][] => Array.from({length:Math.ceil(arr.length/size)},(_,i)=>arr.slice(i*size,(i+1)*size));
function sanity() {
  if (!existsSync(reportPath) || !existsSync(manifestPath) || !existsSync(summaryPath)) throw Error('Missing capture report / preview manifest; run preview-b6-flipp-capture.mjs first');
  const cap = read(reportPath), sum = read(summaryPath);
  if (cap.finished !== true || sum.missingSourceFiles !== 0 || sum.conflicts !== 0 || sum.retailers.length !== 7 || sum.uniqueFlyerItemPairs !== 5969) throw Error('Capture completeness invariant failed');
  const records = readFileSync(manifestPath,'utf8').trim().split(/\r?\n/).map(x=>JSON.parse(x)) as CaptureRecord[];
  if (records.length !== 5969 || new Set(records.map(r => `${r.flyerExternalId}:${r.sourceRecordId}`)).size !== 5969) throw Error('Manifest count / uniqueness invariant failed');
  if (records.some(r => !allowedRetailers.has(r.retailer) || !r.postalCodes?.length)) throw Error('Manifest has an unknown retailer or missing postal code');
  // Historical Flipp captures include banners and some unpriced product entries.
  // The live ingestion pipeline likewise stages only advertisements with a usable positive price.
  // Preserve unpriced references in a separate audit file; never manufacture a price.
  const isPositivePrice = (v: unknown): boolean => {
    if (v === null || v === undefined) return false;
    const str = String(v).trim();
    if (!/^\$?\s*\d+(?:\.\d+)?$/.test(str)) return false;
    const amount = Number(str.replace(/^\$\s*/, ''));
    return Number.isFinite(amount) && amount > 0;
  };
  const eligible = records.filter(r => isPositivePrice(r.advertisedPrice));
  const excluded = records.filter(r => !isPositivePrice(r.advertisedPrice));
  return {cap,records:eligible,excluded,capturedCount:records.length};
}
type CaptureRecord = {
  sourceRecordId:string; flyerExternalId:string; merchantId:string; retailer:string; postalCodes:string[];
  advertisedPrice:string; itemDetailPath:string; itemDetailSha256:string; capture:string;
};
interface Prepared { row: Prisma.StagedOfferCreateManyInput; externalFlyerId:string; retailer:string; status:string; recordKey:string; }
function prepare(record:CaptureRecord, observedAt:Date): Prepared {
  const path = join(captureRoot, record.itemDetailPath);
  if (!existsSync(path)) throw Error(`Missing detail: ${path}`);
  const bytes = readFileSync(path);
  if (createHash('sha256').update(bytes).digest('hex') !== record.itemDetailSha256) throw Error(`Detail changed since preview: ${record.sourceRecordId}`);
  const item = (JSON.parse(bytes.toString('utf8')).item ?? JSON.parse(bytes.toString('utf8'))) as FlippItemDetail & Record<string,any>;
  if (String(item.id) !== record.sourceRecordId || String(item.flyer_id) !== record.flyerExternalId || String(item.merchant_id) !== record.merchantId || item.merchant !== record.retailer) throw Error(`Detail identity mismatch: ${record.sourceRecordId}`);
  const postal = [...record.postalCodes].sort()[0]; // market coverage retained in payload, not duplicated as store stock
  const flyer:FlippFlyer = {
    id:Number(record.flyerExternalId), flyer_run_id:0, name:`Flipp flyer ${record.flyerExternalId}`,
    merchant:record.retailer,merchant_id:Number(record.merchantId),
    valid_from:item.flyer_valid_from ?? item.valid_from ?? '',valid_to:item.flyer_valid_to ?? item.valid_to ?? '',
    postal_code:postal,locale:'en-ca',
  };
  const price=String(item.current_price ?? record.advertisedPrice);
  if (!Number.isFinite(Number(price)) || Number(price)<=0) throw Error(`Invalid price: ${record.sourceRecordId}`);
  const flyerItem:FlippFlyerItem = {
    id:Number(record.sourceRecordId),flyer_id:Number(record.flyerExternalId),name:item.name,
    brand:item.brand,price,valid_from:item.valid_from,valid_to:item.valid_to,
    cutout_image_url:item.cutout_image_url,sale_story:item.sale_story,
    pre_price_text:item.pre_price_text,post_price_text:item.price_text,
  };
  const normalized=normalizeFlyerOffer({retailerName:record.retailer,flyer,item:flyerItem,detail:item,observedAt,
    sourceUrl:`https://flipp.com/en-ca/calgary-ab/flyer/${record.flyerExternalId}`});
  // Persist raw detail and capture metadata together. Never infer store-level availability.
  const rawPayload={...normalized.rawPayload,capture:record.capture,postalCodes:record.postalCodes,sourceDetailSha256:record.itemDetailSha256,
    inStoreOnly:item.in_store_only ?? false,sourceUrl:item.ttm_url ?? null};
  const normalizedPayload={...normalized.normalizedPayload,capture:record.capture,retrievalPostalCodes:record.postalCodes};
  const recordKey='__COMPUTE_WITH_SOURCE_ID__';
  return {externalFlyerId:record.flyerExternalId,retailer:record.retailer,status:normalized.status,recordKey,row:{
    // IDs assigned only in write phase
    ingestBatchId:'__BATCH__',sourceSystemId:'__SOURCE__',flyerId:'__FLYER__',retailerId:'__RETAILER__',
    recordKey,sourceRecordId:truncate(normalized.sourceRecordId,150)!,retailerName:record.retailer,
    productName:truncate(normalized.productName,500)!,brand:truncate(normalized.brand,200),
    descriptionText:normalized.descriptionText,packageSizeText:truncate(normalized.packageSizeText,200),
    quantityValue:normalized.quantityValue,quantityUnit:truncate(normalized.quantityUnit,20),quantityIsApproximate:normalized.quantityIsApproximate,
    family:truncate(normalized.family,80),advertisedPriceText:truncate(normalized.advertisedPriceText,100),
    advertisedPriceAmount:normalized.advertisedPriceAmount,regularPriceAmount:normalized.regularPriceAmount,
    pricingBasis:truncate(normalized.pricingBasis,30) ?? undefined,isMemberPrice:normalized.isMemberPrice,isMultibuy:normalized.isMultibuy,
    isMultiVariant:normalized.isMultiVariant,isPriceRange:normalized.isPriceRange,unitPrice:normalized.unitPrice,
    unitPriceBasis:truncate(normalized.unitPriceBasis,20),currency:normalized.currency,promotionText:normalized.promotionText,
    offerComment:normalized.offerComment,validFrom:normalized.validFrom,validUntil:normalized.validUntil,
    observedAt,imageUrl:truncate(normalized.imageUrl,1000),sourceUrl:truncate(normalized.sourceUrl,1000),
    matchKey:truncate(normalized.matchKey,300),familyKey:truncate(normalized.familyKey,150),status:normalized.status,
    reviewRequired:normalized.reviewRequired,reviewReasons:normalized.reviewReasons as Prisma.InputJsonValue,
    normalizedPayload:normalizedPayload as Prisma.InputJsonValue,rawPayload:rawPayload as Prisma.InputJsonValue,
  }};
}
async function main(){
  const {cap,records,excluded,capturedCount}=sanity();
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');
  const url=new URL(process.env.DATABASE_URL);
  if (!['localhost','127.0.0.1'].includes(url.hostname) || url.pathname !== '/kavyo_phase_b_test') throw Error('SAFETY STOP: only local kavyo_phase_b_test is permitted');
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if (db[0]?.db!=='kavyo_phase_b_test') throw Error('Database mismatch');
    const observedAt=new Date(cap.reportCompletedAt ?? cap.completedAt);
    if (Number.isNaN(observedAt.getTime())) throw Error('Invalid capture completion time');
    // --limit is applied AFTER the explicit unpriced-item exclusion.
    const selected=limit ? records.slice(0,limit) : records;
    const prepared=selected.map(r=>prepare(r,observedAt));
    const existingSource=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    // The existing live ingestion convention hashes database UUID, flyer UUID, and Flipp item ID.
    // Resolve flyer IDs before comparing records, otherwise replays could duplicate older staged offers.
    const knownFlyers=existingSource ? await prisma.flyer.findMany({where:{sourceSystemId:existingSource.id},select:{id:true,externalId:true}}) : [];
    const flyerIdsByExternal=new Map(knownFlyers.map(f=>[f.externalId,f.id]));
    const existingKeys=new Set<string>();
    for (const p of prepared) {
      const flyerId=flyerIdsByExternal.get(p.externalFlyerId);
      if (existingSource && flyerId) {
        p.recordKey=hash([existingSource.id,flyerId,p.row.sourceRecordId]);
        p.row.recordKey=p.recordKey; existingKeys.add(p.recordKey);
      } else {
        p.recordKey=`new:${p.externalFlyerId}:${p.row.sourceRecordId}`;
      }
    }
    const keys=new Set(prepared.map(p=>p.recordKey));
    if (keys.size!==prepared.length) throw Error('Duplicate staging keys in manifest');
    const prior=existingSource && existingKeys.size ? await prisma.stagedOffer.findMany({where:{sourceSystemId:existingSource.id,recordKey:{in:[...existingKeys]}},select:{recordKey:true}}) : [];
    const existing=new Set(prior.map(r=>r.recordKey));
    const toStage=prepared.filter(p=>!existing.has(p.recordKey));
    const grouped=Object.fromEntries([...allowedRetailers].sort().map(name=>[name,{source:prepared.filter(p=>p.retailer===name).length,new:toStage.filter(p=>p.retailer===name).length}]));
    const baseline={staged:await prisma.stagedOffer.count(),ads:await prisma.advertisedOffer.count(),products:await prisma.product.count(),observations:await prisma.priceObservation.count()};
    let inserted=0;
    if(write && toStage.length){
      // Metadata first, then deterministic staged rows. Retry-safe createMany(skipDuplicates).
      const source=await prisma.sourceSystem.upsert({where:{name:'FLIPP_FLYERS'},update:{},create:{name:'FLIPP_FLYERS',sourceType:'FLYER_AGGREGATOR',baseUrl:'https://flipp.com',licenseInfo:'Historical Flipp flyer capture; confirm distribution rights before production'}});
      const retailers=new Map<string,string>();
      for(const name of allowedRetailers){
        const r=await prisma.retailer.upsert({where:{name},update:{},create:{name,website:retailerWebsites[name]}});
        retailers.set(name,r.id);
      }
      const flyers=new Map<string,string>();
      for(const pair of new Set(toStage.map(p=>`${p.retailer}|${p.externalFlyerId}`))){
        const [name,externalId]=pair.split('|');
        const representative=records.find(r=>r.retailer===name&&r.flyerExternalId===externalId)!;
        const d=read(join(captureRoot,representative.itemDetailPath)).item;
        const f=await prisma.flyer.upsert({where:{sourceSystemId_externalId:{sourceSystemId:source.id,externalId}},update:{},create:{
          sourceSystemId:source.id,retailerId:retailers.get(name)!,merchantId:representative.merchantId,externalId,
          name:`Flipp flyer ${externalId}`,postalCode:[...representative.postalCodes].sort()[0],locale:'en-ca',
          validFrom:toDate(d.flyer_valid_from ?? d.valid_from),validUntil:toDate(d.flyer_valid_to ?? d.valid_to),
          sourceUrl:`https://flipp.com/en-ca/calgary-ab/flyer/${externalId}`,fetchedAt:observedAt,
          rawPayload:{capture:basename(captureRoot),source:'OFFLINE_ARCHIVE',retrievalPostalCodes:representative.postalCodes} as Prisma.InputJsonValue,
        }});
        flyers.set(pair,f.id);
      }
      // A batch is only needed when there are unseen source records.
      const batch=await prisma.ingestBatch.create({data:{sourceSystemId:source.id,sourceReference,
        status:'RUNNING',startedAt:new Date()}});
      try {
        const rows=toStage.map(p=>{
          const flyerId=flyers.get(`${p.retailer}|${p.externalFlyerId}`)!;
          return {...p.row,recordKey:hash([source.id,flyerId,p.row.sourceRecordId]),sourceSystemId:source.id,ingestBatchId:batch.id,
            retailerId:retailers.get(p.retailer)!,flyerId};
        });
        for(const group of chunk(rows,100)) {
          const res=await prisma.stagedOffer.createMany({data:group,skipDuplicates:true});
          inserted+=res.count;
        }
        await prisma.ingestBatch.update({where:{id:batch.id},data:{status:'COMPLETED',completedAt:new Date(),recordsRead:selected.length,recordsInserted:inserted,recordsRejected:0}});
      } catch(e) {
        await prisma.ingestBatch.update({where:{id:batch.id},data:{status:'FAILED',completedAt:new Date(),errorMessage:String(e)}});
        throw e;
      }
    }
    const after={staged:await prisma.stagedOffer.count(),ads:await prisma.advertisedOffer.count(),products:await prisma.product.count(),observations:await prisma.priceObservation.count()};
    if(after.ads!==baseline.ads || after.products!==baseline.products || after.observations!==baseline.observations) throw Error('SAFETY ALERT: unrelated table counts changed');
    const result={mode:write?'WRITE':'DRY_RUN',database:db[0].db,capture:basename(captureRoot),captured:capturedCount,priceEligible:records.length,excludedNoUsablePrice:excluded.length,selected:selected.length,
      existingStaged:existing.size,toStage:toStage.length,inserted,retailers:grouped,normalized:prepared.filter(p=>p.status==='NORMALIZED').length,
      pendingReview:prepared.filter(p=>p.status==='PENDING_REVIEW').length,before:baseline,after,
      note:'Stages only priced advertisements. Unpriced items remain in source archive and b6-unpriced-items.json, not in DB. No products, advertised offers, price observations, or basket records created. Current retail prices are NOT inferred.'};
    mkdirSync(outputDir,{recursive:true});
    writeFileSync(join(outputDir,'b6-unpriced-items.json'),JSON.stringify({capture:basename(captureRoot),count:excluded.length,reason:'NO_USABLE_POSITIVE_ADVERTISED_PRICE',items:excluded.map(r=>({sourceRecordId:r.sourceRecordId,flyerExternalId:r.flyerExternalId,retailer:r.retailer,name:(r as any).name??null,advertisedPrice:r.advertisedPrice??null}))},null,2)+'\n');
    writeFileSync(join(outputDir,write?'write-report.json':'dry-run-report.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

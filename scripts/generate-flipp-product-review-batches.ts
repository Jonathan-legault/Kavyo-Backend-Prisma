/**
 * READ-ONLY, source-evidence batch review generator for current Flipp advertised offers.
 * Creates compatible (all-unapproved) input files for existing guarded write scripts.
 * Does not edit any DB row. It deliberately does not auto-approve by fingerprint.
 *
 * Run: npx tsx scripts/generate-flipp-product-review-batches.ts
 * Outputs: data/research/living-db/product-batch-review/<timestamp>/
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence, type ProductPromotionCandidate } from '../src/ingestion/living-catalog/product-promotion-plan.js';

if (process.argv.length !== 2) throw Error('READ_ONLY: no flags or positional arguments accepted');
const SOURCE = 'FLIPP_FLYERS';
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const conn = process.env.DATABASE_URL;
if (!conn) throw Error('DATABASE_URL missing');
const parsed = new URL(conn);
if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/kavyo_phase_b_test')
  throw Error('SAFETY STOP: only local kavyo_phase_b_test is permitted');
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:conn})});
const stageId = (v: Prisma.JsonValue|null): string|null => {
  if (!v || typeof v!=='object' || Array.isArray(v)) return null;
  const x=(v as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof x==='string' && UUID.test(x) ? x : null;
};
const asObject = (value:Prisma.JsonValue|null):Record<string,unknown> =>
  value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
const asRecord = (value:unknown):Record<string,unknown> =>
  value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
const asString = (value:unknown):string|null => typeof value==='string' ? value : null;
type Candidate = ProductPromotionCandidate;
type OfferRow = {
  offerId:string;stableKey:string;linkedProductId:string|null;stageId:string;
  flyerExternalId:string;retailerName:string;sourceRecordId:string;
  productName:string;brand:string|null;description:string|null;packageSizeText:string|null;
  advertisedPrice:string|null;promotionText:string|null;sourceUrl:string|null;imageUrl:string|null;
  rawItem:unknown;rawDetail:unknown;sourceSku:string|null;sourceProductUrl:string|null;
};
type Group = {plan:Candidate;rows:OfferRow[]};
const chunk = <T>(rows:T[],size:number):T[][]=>Array.from({length:Math.ceil(rows.length/size)},(_,i)=>rows.slice(i*size,(i+1)*size));
const stringify = (value:unknown)=>JSON.stringify(value,null,2)+'\n';

async function main(){
 try {
  const actual=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
  if(actual[0]?.db!=='kavyo_phase_b_test') throw Error('SAFETY STOP: connected database mismatch');
  const source=await prisma.sourceSystem.findUnique({where:{name:SOURCE},select:{id:true}});
  if(!source) throw Error('FLIPP_FLYERS source not found');
  const before={advertised:await prisma.advertisedOffer.count(),staged:await prisma.stagedOffer.count(),
    products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),
    linked:await prisma.advertisedOffer.count({where:{sourceSystemId:source.id,productId:{not:null}}}),
    observations:await prisma.priceObservation.count()};
  const identityEvidence=await prisma.productEvidence.findMany({where:{sourceSystemId:source.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:{startsWith:'IDENTITY:'}},
    select:{sourceRecordId:true,productId:true,verified:true,product:{select:{id:true,productName:true,brand:true,quantityText:true,quantityValue:true,quantityUnit:true,categories:true,isActive:true}}}});
  const identities=new Map<string,typeof identityEvidence>();
  for(const ev of identityEvidence){const key=ev.sourceRecordId.slice('IDENTITY:'.length); const found=identities.get(key)??[];found.push(ev);identities.set(key,found);}
  const groups=new Map<string,Group>();
  const anomalies:Array<Record<string,unknown>>=[];
  let scanned=0,held=0,eligible=0,missingStages=0;
  let cursor:string|undefined;
  while(true){
    const offers=await prisma.advertisedOffer.findMany({where:{sourceSystemId:source.id},orderBy:{id:'asc'},take:200,
      ...(cursor?{cursor:{id:cursor},skip:1}:{}),
      select:{id:true,stableKey:true,productId:true,sourceSystemId:true,conditionEvidence:true,flyerExternalId:true,
        sourceRecordId:true,productName:true,packageSizeText:true,advertisedPriceAmount:true,promotionText:true,sourceUrl:true,
        retailer:{select:{name:true}}}});
    if(!offers.length) break;
    const ids=offers.map(o=>stageId(o.conditionEvidence)).filter((x):x is string=>x!==null);
    const stages=await prisma.stagedOffer.findMany({where:{sourceSystemId:source.id,id:{in:ids}},select:{id:true,
      productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,
      isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true,imageUrl:true,rawPayload:true}});
    const byStage=new Map(stages.map(s=>[s.id,s]));
    for(const o of offers){
      scanned++;
      const sid=stageId(o.conditionEvidence);
      const s=sid?byStage.get(sid):undefined;
      if(!s){missingStages++;anomalies.push({type:'MISSING_STAGE',offerId:o.id,stageId:sid});continue;}
      const evidence:PromotionEvidence={offerId:o.id,stableKey:o.stableKey,sourceSystemId:o.sourceSystemId,
        stagedOfferId:s.id,productName:s.productName,brand:s.brand,descriptionText:s.descriptionText,
        packageSizeText:s.packageSizeText,quantityValue:s.quantityValue?.toString()??null,quantityUnit:s.quantityUnit,
        isMultiVariant:s.isMultiVariant,isPriceRange:s.isPriceRange,quantityIsApproximate:s.quantityIsApproximate};
      const plan=planProductPromotion(evidence);
      if(plan.decision==='HOLD'){held++;if(o.productId)anomalies.push({type:'LINKED_BUT_HELD',offerId:o.id,reasons:plan.reasons});continue;}
      eligible++;
      const raw=asObject(s.rawPayload);const detail=asRecord(raw.detail);
      const row:OfferRow={offerId:o.id,stableKey:o.stableKey,linkedProductId:o.productId,stageId:s.id,
        flyerExternalId:o.flyerExternalId,retailerName:o.retailer.name,sourceRecordId:o.sourceRecordId,
        productName:s.productName,brand:s.brand,description:s.descriptionText,packageSizeText:s.packageSizeText,
        advertisedPrice:o.advertisedPriceAmount?.toString()??null,promotionText:o.promotionText,
        sourceUrl:o.sourceUrl,imageUrl:s.imageUrl,rawItem:raw.item??null,rawDetail:raw.detail??null,
        sourceSku:asString(detail.sku),sourceProductUrl:asString(detail.ttm_url)};
      const g:Group=groups.get(plan.fingerprint)??{plan,rows:[]};g.rows.push(row);groups.set(plan.fingerprint,g);
    }
    cursor=offers[offers.length-1].id;
  }
  const existing:Array<{fingerprint:string;existingProductId:string;productName:string;offerIds:string[];approved:false;reviewNotes:string;unlinkedOffersAtReview:number}>=[];
  const newProducts:Array<{fingerprint:string;productName:string;brand:string|null;quantityText:string;quantityValue:string;quantityUnit:string;scopeCategory:string;offerIds:string[];approved:false;reviewNotes:string}>=[];
  const evidenceReports:Array<Record<string,unknown>>=[];
  let existingUnlinked=0,newUnlinked=0,noWork=0,blocked=0;
  for(const [fingerprint,g] of [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]))){
    g.rows.sort((a,b)=>a.offerId.localeCompare(b.offerId));
    const unlinked=g.rows.filter(r=>r.linkedProductId===null);
    const linkedIds=new Set(g.rows.map(r=>r.linkedProductId).filter((v):v is string=>v!==null));
    const evidence=identities.get(fingerprint)??[];
    const productIds=new Set(evidence.map(e=>e.productId));
    const target=productIds.size===1?[...productIds][0]:null;
    const live=evidence.length>0&&evidence.every(e=>e.product.isActive);
    const conflict=productIds.size>1||linkedIds.size>1||
      (linkedIds.size>0&&(!target||!linkedIds.has(target)))||(!live&&evidence.length>0);
    let disposition:string;
    if(conflict){blocked++;disposition='CONFLICT_HOLD';anomalies.push({type:'CONFLICT_HOLD',fingerprint,linkedIds:[...linkedIds],evidenceIds:[...productIds]});}
    else if(!unlinked.length){noWork++;disposition='ALREADY_LINKED';}
    else if(target && live){
      disposition='EXISTING_IDENTITY_REVIEW';existingUnlinked+=unlinked.length;
      // Only unlinked offers need new association; guarded writer revalidates every offer.
      existing.push({fingerprint,existingProductId:target,productName:g.plan.productName,
        offerIds:unlinked.map(r=>r.offerId),approved:false,reviewNotes:'',unlinkedOffersAtReview:unlinked.length});
    } else if(evidence.length===0&&linkedIds.size===0){
      // Do not create review approvals for incomplete canonical quantity identities.
      // Keep them in the anomaly report without stopping the other candidates.
      if(g.plan.quantityValue == null || g.plan.quantityUnit == null){
        blocked++;
        disposition='INCOMPLETE_QUANTITY_HOLD';
        anomalies.push({type:'INCOMPLETE_QUANTITY_HOLD',fingerprint,
          productName:g.plan.productName,quantityValue:g.plan.quantityValue,
          quantityUnit:g.plan.quantityUnit,unlinkedOfferIds:unlinked.map(r=>r.offerId)});
      } else {
        disposition='NEW_IDENTITY_REVIEW';newUnlinked+=unlinked.length;
        newProducts.push({fingerprint,productName:g.plan.productName,brand:g.plan.brand,
          quantityText:g.plan.quantityText,quantityValue:g.plan.quantityValue,quantityUnit:g.plan.quantityUnit,
          scopeCategory:g.plan.scopeCategory,offerIds:unlinked.map(r=>r.offerId),approved:false,reviewNotes:''});
      }
    } else {blocked++;disposition='OTHER_HOLD';anomalies.push({type:'OTHER_HOLD',fingerprint});}
    if(disposition.endsWith('_REVIEW')) evidenceReports.push({fingerprint,disposition,
      candidate:{productName:g.plan.productName,brand:g.plan.brand,quantityText:g.plan.quantityText,
        quantityValue:g.plan.quantityValue,quantityUnit:g.plan.quantityUnit,scopeCategory:g.plan.scopeCategory},
      existingProduct:target?evidence.find(e=>e.productId===target)?.product:null,
      identityEvidenceVerified:evidence.length>0&&evidence.every(e=>e.verified),
      allGroupOffers:g.rows.length,unlinkedOffers:unlinked.length,offers:g.rows});
  }
  if(missingStages||anomalies.some(x=>x.type==='LINKED_BUT_HELD')) throw Error(`SAFETY STOP: ${missingStages} missing stages; linked-held=${anomalies.filter(x=>x.type==='LINKED_BUT_HELD').length}`);
  const after={advertised:await prisma.advertisedOffer.count(),staged:await prisma.stagedOffer.count(),
    products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),
    linked:await prisma.advertisedOffer.count({where:{sourceSystemId:source.id,productId:{not:null}}}),
    observations:await prisma.priceObservation.count()};
  if(JSON.stringify(before)!==JSON.stringify(after)) throw Error('SAFETY STOP: database counts changed during inspection; rerun');
  const suffix=new Date().toISOString().replace(/[:.]/g,'-');
  const out=resolve('data/research/living-db/product-batch-review',suffix);
  await mkdir(out,{recursive:true});
  const files:string[]=[];
  for(const [i,batch] of chunk(existing,50).entries()){
    const name=`existing-link-review-${String(i+1).padStart(2,'0')}.json`;
    await writeFile(join(out,name),stringify({format:'KAVYO_EXISTING_LINK_APPROVALS_V1',sourceSystem:SOURCE,entries:batch}));files.push(name);
  }
  for(const [i,batch] of chunk(newProducts,50).entries()){
    const name=`new-product-review-${String(i+1).padStart(2,'0')}.json`;
    await writeFile(join(out,name),stringify({format:'KAVYO_NEW_PRODUCT_APPROVALS_V1',sourceSystem:SOURCE,entries:batch}));files.push(name);
  }
  await writeFile(join(out,'source-evidence.json'),stringify({generatedAt:suffix,groups:evidenceReports}));
  await writeFile(join(out,'anomalies.json'),stringify(anomalies));
  const summary={mode:'READ_ONLY',database:actual[0].db,generatedAt:suffix,source:SOURCE,
    scannedOffers:scanned,eligibleOfferRows:eligible,heldOfferRows:held,groupCount:groups.size,
    existingReviewGroups:existing.length,existingUnlinkedOffers:existingUnlinked,
    newReviewGroups:newProducts.length,newUnlinkedOffers:newUnlinked,
    alreadyLinkedGroups:noWork,blockedGroups:blocked,missingStages,
    before,after,approvalFiles:files,evidenceFile:'source-evidence.json',anomaliesFile:'anomalies.json',
    caveats:['Review files contain approved=false exclusively. No DB writes.',
      'Manual review is mandatory; grouped advertisements may still be ambiguous despite planner eligibility.',
      'Source SKU is not independently verified GTIN. No product identity inferred from price.',
      'Existing links and product records are never updated by this generator.',
      'A database count check does not guarantee a concurrent-writer-free snapshot.']};
  await writeFile(join(out,'summary.json'),stringify(summary));
  console.log(JSON.stringify({...summary,reportDirectory:out},null,2));
 } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1});

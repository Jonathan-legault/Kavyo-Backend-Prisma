/**
 * B.6.4 canonical product matching for advertisements from the November 9 historical capture.
 * DRY_RUN by default. --write links only identities with existing ACTIVE canonical evidence;
 * new products require --approved=path/to/approved-fingerprints.json alongside --write.
 * A reviewed allowlist is an array of full SHA-256 fingerprints, NOT offer names.
 * Existing offer productIds are never changed. Inactive legacy identities are never revived.
 */
import 'dotenv/config';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {PrismaPg} from '@prisma/adapter-pg';
import {Prisma,PrismaClient} from '../src/generated/prisma/client.js';
import {planProductPromotion,type ProductPromotionCandidate,type PromotionEvidence} from '../src/ingestion/living-catalog/product-promotion-plan.js';

const args=process.argv.slice(2), write=args.includes('--write');
const approvedArg=args.find(x=>x.startsWith('--approved='))?.slice('--approved='.length);
if(args.some(x=>x!=='--write'&&!x.startsWith('--approved=')))throw Error('Usage: npx tsx scripts/promote-b6-historical-products.ts [--write] [--approved=path.json]');
const approved: string[] = approvedArg ? JSON.parse(readFileSync(resolve(approvedArg),'utf8')) : [];
if (!Array.isArray(approved) || approved.some(x=>typeof x!=='string'|| !/^[0-9a-f]{64}$/.test(x)) ||new Set(approved).size!==approved.length)
  throw Error('Invalid fingerprint allowlist; expected JSON array of unique 64-character SHA-256 strings');
const allowed=new Set(approved);
const cs=process.env.DATABASE_URL;
if(!cs)throw Error('DATABASE_URL missing');
const uri=new URL(cs);
if(!['localhost','127.0.0.1'].includes(uri.hostname)||uri.pathname!=='/kavyo_phase_b_test')throw Error('SAFETY STOP: only local kavyo_phase_b_test');
const capture=resolve('data/research/flipp/2026-11-09T22-22-05-015Z');
const manifest=readFileSync(join(capture,'analysis/b6-historical-preview/source-records.jsonl'),'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s) as {sourceRecordId:string;flyerExternalId:string;retailer:string;advertisedPrice:string|null});
const priced=manifest.filter(x=>x.advertisedPrice!=null && Number(x.advertisedPrice)>0);
if(manifest.length!==5969||priced.length!==5279)throw Error('Unexpected capture counts');
const key=(f:string,i:string)=>`${f}|${i}`;
const keys=new Set(priced.map(r=>key(r.flyerExternalId,r.sourceRecordId)));
const chunk=<T>(v:T[],n:number)=>Array.from({length:Math.ceil(v.length/n)},(_,i)=>v.slice(i*n,(i+1)*n));
function stageRef(obj:Prisma.JsonValue|null):string|null {
  if(!obj||typeof obj!=='object'||Array.isArray(obj))return null;
  const x=(obj as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof x==='string'?x:null;
}
const ENFAGROW_B5_HOLD='fe5ee8ca1adabc05472fb2e7476e6e2f8906b9f6f5d50efc6d1d511c9ca92713';
async function main(){
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:cs})});
 try {
  const db=await prisma.$queryRaw<Array<{name:string}>>`SELECT current_database() AS name`;
  if(db[0]?.name!=='kavyo_phase_b_test')throw Error('Wrong actual database');
  const src=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
  if(!src)throw Error('Missing FLIPP_FLYERS');
  const before={ads:await prisma.advertisedOffer.count(),products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),staged:await prisma.stagedOffer.count(),observations:await prisma.priceObservation.count()};
  const offers=await prisma.advertisedOffer.findMany({where:{sourceSystemId:src.id},select:{id:true,stableKey:true,sourceSystemId:true,productId:true,flyerExternalId:true,sourceRecordId:true,conditionEvidence:true}});
  const scoped=offers.filter(o=>keys.has(key(o.flyerExternalId,o.sourceRecordId)));
  // Promotion is only allowed for source records that exist in durable AdvertisedOffer.
  if(scoped.length===0)throw Error('No B.6 advertisements found; run B.6.3 first');
  const refIds=[...new Set(scoped.map(o=>stageRef(o.conditionEvidence)).filter((x):x is string=>!!x))];
  const staged=new Map<string,{id:string;sourceSystemId:string;productName:string;brand:string|null;descriptionText:string|null;packageSizeText:string|null;quantityValue:Prisma.Decimal|null;quantityUnit:string|null;isMultiVariant:boolean;isPriceRange:boolean;quantityIsApproximate:boolean}>();
  for(const ids of chunk(refIds,250)){
    const rows=await prisma.stagedOffer.findMany({where:{id:{in:ids},sourceSystemId:src.id},select:{id:true,sourceSystemId:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true}});
    for(const r of rows)staged.set(r.id,r);
  }
  const groups=new Map<string,ProductPromotionCandidate[]>();
  const holds:Record<string,number>={};let eligible=0,missingStaging=0,alreadyLinked=0;
  const hold=(reason:string)=>holds[reason]=(holds[reason]??0)+1;
  for(const o of scoped){
    const stageId=stageRef(o.conditionEvidence), s=stageId?staged.get(stageId):null;
    if(!s){missingStaging++;hold('STAGING_MISSING');continue;}
    const e:PromotionEvidence={offerId:o.id,stableKey:o.stableKey,sourceSystemId:o.sourceSystemId,stagedOfferId:s.id,
      productName:s.productName,brand:s.brand,descriptionText:s.descriptionText,packageSizeText:s.packageSizeText,
      quantityValue:s.quantityValue?.toString()??null,quantityUnit:s.quantityUnit,
      isMultiVariant:s.isMultiVariant,isPriceRange:s.isPriceRange,quantityIsApproximate:s.quantityIsApproximate};
    const p=planProductPromotion(e);
    if(p.decision==='HOLD'){for(const reason of p.reasons)hold(reason);continue;}
    eligible++;if(o.productId)alreadyLinked++;
    const list=groups.get(p.fingerprint)??[];list.push(p);groups.set(p.fingerprint,list);
  }
  const fingerprints=[...groups.keys()];
  const evidence=new Map<string,{productId:string;isActive:boolean}[]>();
  for(const g of chunk(fingerprints,250)){
    const rows=await prisma.productEvidence.findMany({where:{sourceSystemId:src.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:{in:g.map(x=>'IDENTITY:'+x)}},select:{sourceRecordId:true,productId:true,product:{select:{isActive:true}}}});
    for(const e of rows){const k=e.sourceRecordId.slice(9); const list=evidence.get(k)??[];list.push({productId:e.productId,isActive:e.product.isActive});evidence.set(k,list);}
  }
  const classified=fingerprints.map(f=>{
    const links=groups.get(f)!;
    const identities=evidence.get(f)??[];
    const ids=new Set(identities.map(x=>x.productId));
    const existing=identities.length===1&&ids.size===1&&identities[0].isActive;
    const blocked=identities.length>1||ids.size>1||identities.some(e=>!e.isActive)||f===ENFAGROW_B5_HOLD;
    const prior=scoped.filter(o=>links.some(p=>p.offerId===o.id));
    const linked=new Set(prior.map(o=>o.productId).filter((x):x is string=>x!==null));
    let disposition=blocked?'BLOCKED':existing?'REUSE_ACTIVE':allowed.has(f)?'REVIEWED_CREATE':'REVIEW_REQUIRED';
    if(linked.size>1||(linked.size===1&&(!existing||!linked.has(identities[0].productId))))disposition='LINK_CONFLICT';
    return {fingerprint:f,productName:links[0].productName,brand:links[0].brand,quantityText:links[0].quantityText,
      offers:links.length,disposition,existingProductId:existing?identities[0].productId:null,
      offerIds:links.map(l=>l.offerId)};
  });
  const blocked=classified.filter(x=>x.disposition==='BLOCKED'||x.disposition==='LINK_CONFLICT');
  const planned=classified.filter(x=>x.disposition==='REUSE_ACTIVE'||x.disposition==='REVIEWED_CREATE');
  let created=0,newLinks=0,reused=0,conflicts=0;
  if(write){
    if(missingStaging)throw Error(`Missing ${missingStaging} staging records; refusing write`);
    if(approved.some(f=>!groups.has(f)))throw Error('Allowlist contains fingerprints absent from this capture');
    if(approved.some(f=>classified.find(x=>x.fingerprint===f)?.disposition!=='REVIEWED_CREATE'))
      throw Error('Allowlist contains an existing, held or conflicted identity');
    for(const row of planned){
      const candidates=groups.get(row.fingerprint)!;
      const result=await prisma.$transaction(async tx=>{
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`kavyo-b4:${row.fingerprint}`}))`;
        const prior=await tx.productEvidence.findMany({where:{sourceSystemId:src.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:'IDENTITY:'+row.fingerprint},select:{productId:true,product:{select:{isActive:true}}},take:2});
        if(prior.length>1||prior.some(x=>!x.product.isActive))return {status:'CONFLICT' as const,links:0,created:false};
        let productId=prior[0]?.productId??null; let made=false;
        if(!productId){
          if(!allowed.has(row.fingerprint)||row.fingerprint===ENFAGROW_B5_HOLD)return {status:'CONFLICT' as const,links:0,created:false};
          const c=candidates[0];
          const product=await tx.product.create({data:{barcode:null,productName:c.productName,brand:c.brand,quantityValue:c.quantityValue,quantityUnit:c.quantityUnit,quantityText:c.quantityText,categories:c.scopeCategory,isActive:true},select:{id:true}});
          productId=product.id;made=true;
          await tx.productEvidence.create({data:{productId,sourceSystemId:src.id,sourceRecordId:'IDENTITY:'+row.fingerprint,evidenceType:'CANONICAL_IDENTITY',verified:false,
            rawPayload:{identityFingerprint:row.fingerprint,sourceStagedOfferId:c.stagedOfferId,firstAdvertisedOfferId:c.offerId,confidence:'EXACT_BRAND_NAME_PACKAGE_UNVERIFIED',capture:basename(capture)} as Prisma.InputJsonValue}});
        }
        const current=await tx.advertisedOffer.findMany({where:{id:{in:candidates.map(x=>x.offerId)}},select:{id:true,productId:true}});
        if(current.length!==candidates.length||current.some(x=>x.productId && x.productId!==productId))
          throw Error('SAFETY STOP: offer-product association conflict; rolled back current transaction');
        const changed=await tx.advertisedOffer.updateMany({where:{id:{in:candidates.map(x=>x.offerId)},productId:null,sourceSystemId:src.id},data:{productId}});
        return {status:'OK' as const,links:changed.count,created:made};
      },{timeout:20000});
      if(result.status==='CONFLICT'){conflicts++;continue;}
      newLinks+=result.links;if(result.created)created++;else reused++;
    }
  }
  const after={ads:await prisma.advertisedOffer.count(),products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),staged:await prisma.stagedOffer.count(),observations:await prisma.priceObservation.count()};
  if(after.ads!==before.ads||after.staged!==before.staged||after.observations!==before.observations)throw Error('SAFETY STOP: unrelated table changed');
  const retailerMap=new Map<string,Set<string>>();
  const offerIds=new Map(scoped.map(o=>[o.id,priced.find(x=>key(x.flyerExternalId,x.sourceRecordId)===key(o.flyerExternalId,o.sourceRecordId))?.retailer??'UNKNOWN']));
  for(const [fingerprint,list] of groups){const set=new Set(list.map(l=>offerIds.get(l.offerId)??'UNKNOWN'));retailerMap.set(fingerprint,set);}
  const overlaps=classified.filter(c=>(retailerMap.get(c.fingerprint)?.size??0)>=2).map(c=>({...c,retailers:[...retailerMap.get(c.fingerprint)!]}));
  const result={phase:'B6_4',mode:write?'WRITE':'DRY_RUN',database:db[0].name,capture:basename(capture),scopedAdvertisements:scoped.length,
    eligibleOfferRows:eligible,distinctIdentityFingerprints:fingerprints.length,alreadyLinked,missingStaging,
    holds,dispositions:Object.fromEntries([...new Set(classified.map(c=>c.disposition))].map(s=>[s,classified.filter(c=>c.disposition===s).length])),
    plannedIdentityGroups:planned.length,createdProducts:created,reusedProducts:reused,newOfferLinks:newLinks,conflicts,
    confirmedCrossRetailerCandidateIdentities:overlaps.length,examples:classified.slice(0,15),overlapExamples:overlaps.slice(0,20),before,after,
    caveats:['New product identities require explicit reviewed fingerprint allowlist; --write alone reuses active identities only',
      'Existing B.5 inactive product identities are not reactivated or linked',
      'Cross-retailer overlap represents planner fingerprints, not verified GTIN equivalence or current store prices']};
  const dir=resolve('data/research/living-db');mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,write?'b6-products-write.json':'b6-products-dry-run.json'),JSON.stringify(result,null,2)+'\n');
  const csv=['fingerprint,productName,brand,quantityText,offers,disposition,retailers',...classified.map(x=>[x.fingerprint,x.productName,x.brand??'',x.quantityText,x.offers,x.disposition,[...retailerMap.get(x.fingerprint)??[]].join(';')].map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n';
  writeFileSync(join(dir,'b6-product-review.csv'),csv);
  console.log(JSON.stringify(result,null,2));
 } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1});

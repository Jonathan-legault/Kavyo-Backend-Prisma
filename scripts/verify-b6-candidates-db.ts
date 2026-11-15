/** B6.4 authoritative READ-ONLY join: AdvertisedOffer -> StagedOffer -> B.5 candidate fingerprint -> local Flipp item.
 * Builds reviewed source dossiers; never writes DB or approves fingerprints. Run from backend root.
 */
import 'dotenv/config';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {PrismaPg} from '@prisma/adapter-pg';
import {Prisma,PrismaClient} from '../src/generated/prisma/client.js';
import {planProductPromotion,type PromotionEvidence} from '../src/ingestion/living-catalog/product-promotion-plan.js';

if(process.argv.length!==2)throw Error('Usage: npx tsx scripts/verify-b6-candidates-db.ts (READ ONLY; no flags)');
const dbUrl=process.env.DATABASE_URL;
if(!dbUrl)throw Error('DATABASE_URL required');
const uri=new URL(dbUrl);
if(!['localhost','127.0.0.1'].includes(uri.hostname)||uri.pathname!=='/kavyo_phase_b_test')throw Error('SAFETY STOP: wrong database');
const capture=resolve('data/research/flipp/2026-11-09T22-22-05-015Z');
const list=resolve('data/research/living-db/b6-product-review.csv');
const triage=resolve('data/research/living-db/kavyo-b6-product-triage.csv');
const manifest=join(capture,'analysis/b6-historical-preview/source-records.jsonl');
for(const path of [list,triage,manifest])if(!existsSync(path))throw Error('Missing required input: '+path);
function parseCSV(s:string){
 const rows:string[][]=[];let cells:string[]=[],word='',inQuotes=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];if(inQuotes){if(c==='"'){if(s[i+1]==='"'){word+='"';i++;}else inQuotes=false;}else word+=c;}
  else if(c==='"')inQuotes=true;else if(c===','){cells.push(word);word='';}
  else if(c==='\n'){cells.push(word.replace(/\r$/,''));if(cells.some(x=>x))rows.push(cells);cells=[];word='';}
  else word+=c;
 }
 if(inQuotes)throw Error('Malformed CSV');if(word||cells.length){cells.push(word);rows.push(cells);}
 const keys=rows.shift()!.map(x=>x.replace(/^\uFEFF/,''));return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]??''])));
}
const triaged=parseCSV(readFileSync(triage,'utf8'));
const reviewed=parseCSV(readFileSync(list,'utf8'));
if(triaged.length!==86||reviewed.filter(x=>x.disposition==='REVIEW_REQUIRED').length!==86)throw Error('B6 triage/review version mismatch');
const byFp=new Map(triaged.map(x=>[x.fingerprint,x]));
if(byFp.size!==86)throw Error('Duplicate triage identity');
const sourceRows=readFileSync(manifest,'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s) as Record<string,any>);
if(sourceRows.length!==5969)throw Error('Unexpected capture source record count');
const bySource=new Map(sourceRows.map(r=>[`${r.flyerExternalId}|${r.sourceRecordId}`,r]));
const stageRef=(x:Prisma.JsonValue|null):string|null=>{
 if(!x||typeof x!=='object'||Array.isArray(x))return null;
 const v=(x as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
 return typeof v==='string'?v:null;
};
const chunk=<T>(arr:T[],size:number)=>Array.from({length:Math.ceil(arr.length/size)},(_,i)=>arr.slice(i*size,(i+1)*size));
const sourceFlags=(s:string)=>({
 variantOrAssortment:/\b(?:selected|assorted|assortment|variet(?:y|ies)|flavou?rs?|shades?|styles?|any flavour)\b/i.test(s),
 alternatives:/\s(?:or|and\/or)\s/i.test(s),
 priceConditions:/\b(?:member\s+price|members? only|buy\s+\d+|when you buy|minimum|over limit|limit\s+\d+)\b/i.test(s),
 loyaltyComment:/\b(?:scene\+|pc optimum|bonus points|earn \d+ (?:pts|points))\b/i.test(s)
});
const output=resolve('data/research/living-db/b6-source-verification');mkdirSync(output,{recursive:true});
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:dbUrl})});
try{
 const db=await prisma.$queryRaw<Array<{name:string}>>`SELECT current_database() AS name`;
 if(db[0]?.name!=='kavyo_phase_b_test')throw Error('Database identity check failed');
 const sys=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
 if(!sys)throw Error('Missing FLIPP_FLYERS system');
 const all=await prisma.advertisedOffer.findMany({where:{sourceSystemId:sys.id},select:{id:true,productId:true,stableKey:true,sourceSystemId:true,flyerExternalId:true,sourceRecordId:true,conditionEvidence:true}});
 const scoped=all.filter(o=>bySource.has(`${o.flyerExternalId}|${o.sourceRecordId}`));
 if(scoped.length!==5279)throw Error('Expected 5279 ads from capture; found '+scoped.length);
 const ids=[...new Set(scoped.map(o=>stageRef(o.conditionEvidence)).filter((x):x is string=>!!x))];
 const staged=new Map<string,any>();
 for(const part of chunk(ids,250)){
  const rows=await prisma.stagedOffer.findMany({where:{id:{in:part},sourceSystemId:sys.id},select:{id:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true}});
  for(const r of rows)staged.set(r.id,r);
 }
 const dossiers=new Map<string,any[]>(),missing:string[]=[],diffs:string[]=[];
 for(const offer of scoped){
  const stageId=stageRef(offer.conditionEvidence),stage=stageId?staged.get(stageId):null;
  if(!stage){missing.push(offer.id);continue;}
  const ev:PromotionEvidence={offerId:offer.id,stableKey:offer.stableKey,sourceSystemId:offer.sourceSystemId,stagedOfferId:stage.id,
    productName:stage.productName,brand:stage.brand,descriptionText:stage.descriptionText,packageSizeText:stage.packageSizeText,
    quantityValue:stage.quantityValue?.toString()??null,quantityUnit:stage.quantityUnit,
    isMultiVariant:stage.isMultiVariant,isPriceRange:stage.isPriceRange,quantityIsApproximate:stage.quantityIsApproximate};
  const planned=planProductPromotion(ev);
  if(planned.decision!=='CANDIDATE'||!byFp.has(planned.fingerprint))continue;
  const source=bySource.get(`${offer.flyerExternalId}|${offer.sourceRecordId}`);
  if(!source){diffs.push(offer.id);continue;}
  const sourceDetail=join(capture,'items',`${offer.sourceRecordId}.json`);
  if(!existsSync(sourceDetail)){diffs.push(offer.id);continue;}
  const raw=JSON.parse(readFileSync(sourceDetail,'utf8')).item;
  if(String(raw?.id)!==offer.sourceRecordId||String(raw?.flyer_id)!==offer.flyerExternalId)diffs.push(offer.id);
  const fullText=[stage.productName,stage.descriptionText,source.description,source.priceText,source.prePriceText,source.saleStory,source.disclaimer,raw?.flyer_disclaimer_text].filter(Boolean).join(' | ');
  const records=dossiers.get(planned.fingerprint)??[];
  records.push({advertisedOfferId:offer.id,advertisedOfferProductId:offer.productId,stagedOfferId:stage.id,
    retailer:source.retailer,sourceRecordId:source.sourceRecordId,flyerExternalId:source.flyerExternalId,merchantId:source.merchantId,
    rawName:source.name,stagedName:stage.productName,brand:stage.brand,packageSizeText:stage.packageSizeText,
    quantityValue:stage.quantityValue?.toString()??null,quantityUnit:stage.quantityUnit,description:stage.descriptionText,
    rawDescription:source.description,advertisedPrice:source.advertisedPrice,regularPrice:source.regularPrice,
    priceText:source.priceText,prePriceText:source.prePriceText,saleStory:source.saleStory,disclaimer:source.disclaimer,
    validity:{from:source.validFrom,until:source.validUntil},postalCodes:source.postalCodes,sourceUrl:source.sourceUrl,sku:source.sku,
    flags:sourceFlags(fullText),sourceDetailPath:`items/${offer.sourceRecordId}.json`});
  dossiers.set(planned.fingerprint,records);
 }
 const potentialDuplicates=reviewed.filter(x=>x.disposition==='REUSE_ACTIVE');
 const norm=(s:string)=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 const rows=triaged.map(c=>{
  const records=dossiers.get(c.fingerprint)??[];
  const retailers=[...new Set(records.map(x=>x.retailer))];
  const possible=potentialDuplicates.filter(x=>norm(x.brand)===norm(c.brand)&&norm(x.quantityText)===norm(c.quantityText)&&(
     norm(x.productName).includes(norm(c.productName))||norm(c.productName).includes(norm(x.productName))
  )).map(x=>x.productName);
  const flagVariant=records.some(x=>x.flags.variantOrAssortment||x.flags.alternatives);
  const linkCount=records.filter(x=>x.advertisedOfferProductId).length;
  let nextAction=c.triage==='HOLD_OUT_OF_SCOPE'?'HOLD_OUT_OF_SCOPE':c.triage==='HOLD_IDENTITY_OR_PACKAGE'?'HOLD_AMBIGUOUS':
    c.triage==='RECONCILE_EXISTING_FIRST'?'RECONCILE_EXISTING':possible.length?'CHECK_DUPLICATE':
    records.length!==Number(c.offers)?'CHECK_SOURCE_COUNT':flagVariant?'CHECK_SOURCE_VARIANTS':'MANUAL_REVIEW_NEW';
  return {fingerprint:c.fingerprint,productName:c.productName,brand:c.brand,quantityText:c.quantityText,
   triage:c.triage,expectedOfferCount:Number(c.offers),sourceOfferCount:records.length,retailers:retailers.join(';'),
   linkedOffers:linkCount,possibleExistingProducts:possible.join(';'),rawVariantSignals:flagVariant,
   nextAction,approvedForWrite:'NO',sourceRecords:records};
 });
 const bad=rows.filter(x=>x.sourceOfferCount!==x.expectedOfferCount);
 const summary={phase:'B6_4_SOURCE_VERIFICATION',mode:'READ_ONLY',database:db[0].name,capture:basename(capture),
  identities:rows.length,reviewNew:rows.filter(x=>x.triage==='SOURCE_VERIFY_NEW').length,
  reconcileFirst:rows.filter(x=>x.triage==='RECONCILE_EXISTING_FIRST').length,
  held:rows.filter(x=>x.triage.startsWith('HOLD')).length,
  offerSourceDossiers:rows.reduce((s,x)=>s+x.sourceOfferCount,0),sourceCountMismatches:bad.length,
  stageRefsMissing:missing.length,sourceFilesInconsistent:diffs.length,preapprovedIdentities:0,
  actionCounts:Object.fromEntries([...new Set(rows.map(x=>x.nextAction))].sort().map(s=>[s,rows.filter(x=>x.nextAction===s).length])),
  note:'Every source dossier is joined via the persisted advertisement staging reference and recomputed B.5 identity fingerprint. This is not a product approval; manual verification of variants and duplicate candidates remains mandatory.'};
 const csvFields=['fingerprint','productName','brand','quantityText','triage','expectedOfferCount','sourceOfferCount','retailers','linkedOffers','possibleExistingProducts','rawVariantSignals','nextAction','approvedForWrite'];
 const q=(x:unknown)=>'"'+String(x??'').replaceAll('"','""')+'"';
 writeFileSync(join(output,'candidate-verification-db.csv'),[csvFields.join(','),...rows.map(x=>csvFields.map(k=>q((x as any)[k])).join(','))].join('\n')+'\n');
 writeFileSync(join(output,'source-dossiers-db.json'),JSON.stringify(rows,null,2)+'\n');
 writeFileSync(join(output,'summary-db.json'),JSON.stringify({...summary,sourceCountMismatchFingerprints:bad.map(x=>x.fingerprint),missingStageOfferIds:missing,sourceMismatchOfferIds:diffs},null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
 if(missing.length||diffs.length||bad.length)process.exitCode=2;
}finally{await prisma.$disconnect();}

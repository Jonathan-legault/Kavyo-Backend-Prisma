/**
 * B.5 final integrity audit — STRICTLY READ ONLY. No mutation path exists.
 * Local disposable DB only: localhost/kavyo_phase_b_test.
 * Install alongside b54-reviewed-links.json and b54-approved-products.json.
 */
import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const reviewed: Array<{offerId:string;productId:string;reasons:string}> = JSON.parse(readFileSync(resolve(HERE,'b54-reviewed-links.json'),'utf8'));
const approved: {products:Array<{fingerprint:string;offerIds:string[];productName:string;brand:string|null;quantityText:string}>} = JSON.parse(readFileSync(resolve(HERE,'b54-approved-products.json'),'utf8'));
const ENFAGROW_FINGERPRINT='fe5ee8ca1adabc05472fb2e7476e6e2f8906b9f6f5d50efc6d1d511c9ca92713';
const ENFAGROW_OFFER_IDS=['3dc53444-6e67-47e2-ac63-64a7dc492724','ba1e3135-82bf-4f63-8996-85d04776cc0c'];
const MARCANGELO_ID='8a0885a5-71f8-44e3-bc23-4668ca021299';
const MARCANGELO_NEW_FINGERPRINT='c2231d3666a6f53a56bdd5cf93b92ebe563d5ba25a68b29bddd11a5190577df1';

if(process.argv.length>2) throw Error('Audit takes no flags or arguments; it cannot write to the database.');
const cs=process.env.DATABASE_URL;
if(!cs) throw Error('DATABASE_URL is missing');
const url=new URL(cs);
if(!['localhost','127.0.0.1'].includes(url.hostname) || url.pathname!=='/kavyo_phase_b_test')
  throw Error('SAFETY STOP: only localhost/kavyo_phase_b_test permitted');
if(reviewed.length!==17 || new Set(reviewed.map(x=>x.offerId)).size!==17 || new Set(reviewed.map(x=>x.productId)).size!==13) throw Error('Invalid 17-offer manifest');
if(approved.products.length!==4 || new Set(approved.products.map(x=>x.fingerprint)).size!==4 ||
  approved.products.flatMap(x=>x.offerIds).length!==5) throw Error('Invalid approved promotion manifest');
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:cs})});
const checks:Array<{id:string;passed:boolean;details:string;examples?:string[]}>=[];
function check(id:string, passed:boolean, details:string, examples:string[]=[]){ checks.push({id,passed,details,...(examples.length?{examples:examples.slice(0,15)}:{})}); }
function stageRef(x:Prisma.JsonValue|null){
  if(!x||typeof x!=='object'||Array.isArray(x)) return null;
  const id=(x as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof id==='string'?id:null;
}
async function main(){
  const db=await prisma.$queryRaw<Array<{name:string}>>`SELECT current_database() AS name`;
  if(db[0]?.name!=='kavyo_phase_b_test') throw Error('SAFETY STOP: wrong active DB');
  const flipp=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
  if(!flipp) throw Error('FLIPP_FLYERS missing');
  const [products,activeProducts,advertisements,linkedAdvertisements,stagedOffers,priceObservations,evidenceCount,flippAdvertisements]=await Promise.all([
    prisma.product.count(),prisma.product.count({where:{isActive:true}}),prisma.advertisedOffer.count(),
    prisma.advertisedOffer.count({where:{productId:{not:null}}}),prisma.stagedOffer.count(),
    prisma.priceObservation.count(),prisma.productEvidence.count(),prisma.advertisedOffer.count({where:{sourceSystemId:flipp.id}}),
  ]);
  const totals={products,activeProducts,advertisements,linkedAdvertisements,stagedOffers,priceObservations,evidenceCount,flippAdvertisements};
  const expected={products:173,activeProducts:160,advertisements:1560,linkedAdvertisements:173,stagedOffers:2273,priceObservations:0,evidenceCount:174,flippAdvertisements:1560};
  const mismatches=Object.entries(expected).filter(([key,value])=>totals[key as keyof typeof totals]!==value).map(([key,value])=>`${key}: actual=${totals[key as keyof typeof totals]}, expected=${value}`);
  check('BASELINE_COUNTS',mismatches.length===0,mismatches.length?mismatches.join('; '):'Expected B.5 checkpoint counts confirmed');

  const allOffers=await prisma.advertisedOffer.findMany({select:{id:true,sourceSystemId:true,productId:true,conditionEvidence:true,stableKey:true}});
  const stages=await prisma.stagedOffer.findMany({select:{id:true,sourceSystemId:true}});
  const stageMap=new Map(stages.map(x=>[x.id,x]));
  const missingStage:string[]=[],crossSource:string[]=[],missingRefs:string[]=[];
  const seenStable=new Map<string,string>();const duplicateStable:string[]=[];
  for(const offer of allOffers){
    if(offer.sourceSystemId!==flipp.id) continue;
    const sid=stageRef(offer.conditionEvidence);
    if(!sid){missingRefs.push(offer.id);continue;}
    const stage=stageMap.get(sid);
    if(!stage)missingStage.push(`${offer.id}:${sid}`);
    else if(stage.sourceSystemId!==offer.sourceSystemId)crossSource.push(`${offer.id}:${sid}`);
    const prior=seenStable.get(offer.stableKey);
    if(prior)duplicateStable.push(`${offer.id} matches ${prior}`);
    else seenStable.set(offer.stableKey,offer.id);
  }
  check('STAGED_TRACEABILITY',missingStage.length===0&&crossSource.length===0&&missingRefs.length===0,
    `missingSourceRefs=${missingRefs.length}, missingStage=${missingStage.length}, crossSource=${crossSource.length}`,
    [...missingRefs,...missingStage,...crossSource]);
  check('STABLE_KEY_UNIQUENESS',duplicateStable.length===0,`duplicateFlippStableKeys=${duplicateStable.length}`,duplicateStable);

  const allProducts=await prisma.product.findMany({select:{id:true,isActive:true,productName:true,brand:true,quantityText:true}});
  const productMap=new Map(allProducts.map(x=>[x.id,x]));
  const badLinks=allOffers.filter(x=>x.productId&&!productMap.has(x.productId)).map(x=>x.id);
  const inactiveLinks=allOffers.filter(x=>x.productId&&!productMap.get(x.productId)?.isActive).map(x=>x.id);
  check('OFFER_PRODUCT_FK',badLinks.length===0,`brokenProductLinks=${badLinks.length}`,badLinks);
  check('NO_LINKED_INACTIVE_PRODUCTS',inactiveLinks.length===0,`linkedToInactive=${inactiveLinks.length}`,inactiveLinks);

  const reviewedIds=new Set(reviewed.map(x=>x.offerId));
  const reviewedFound=allOffers.filter(x=>reviewedIds.has(x.id));
  const stillLinked=reviewedFound.filter(x=>x.productId!==null).map(x=>x.id);
  check('REMEDIATED_17_OFFERS',reviewedFound.length===17&&stillLinked.length===0,
    `found=${reviewedFound.length}, stillLinked=${stillLinked.length}`,stillLinked);
  const inactiveProductIds=[...new Set(reviewed.map(x=>x.productId))];
  const invalidInactive=inactiveProductIds.filter(id=>!productMap.has(id)||productMap.get(id)!.isActive||allOffers.some(a=>a.productId===id));
  check('REMEDIATED_13_INACTIVE_PRODUCTS',inactiveProductIds.length===13&&invalidInactive.length===0,
    `reviewedProducts=${inactiveProductIds.length}, wronglyActiveOrLinked=${invalidInactive.length}`,invalidInactive);

  const allEvidence=await prisma.productEvidence.findMany({select:{id:true,productId:true,sourceSystemId:true,sourceRecordId:true,evidenceType:true,rawPayload:true}});
  const danglingEvidence=allEvidence.filter(e=>!productMap.has(e.productId)).map(e=>e.id);
  check('EVIDENCE_PRODUCT_FK',danglingEvidence.length===0,`danglingEvidence=${danglingEvidence.length}`,danglingEvidence);
  const identityEvidence=allEvidence.filter(e=>e.evidenceType==='CANONICAL_IDENTITY'&&e.sourceSystemId===flipp.id);
  const seenFingerprint=new Map<string,string>();
  const collisions:string[]=[];const malformed:string[]=[];
  for(const e of identityEvidence){
    if(!e.sourceRecordId.startsWith('IDENTITY:')){malformed.push(e.id);continue;}
    const key=e.sourceRecordId;const prior=seenFingerprint.get(key);
    if(prior)collisions.push(`${e.id} duplicates ${prior}`);
    else seenFingerprint.set(key,e.id);
  }
  check('IDENTITY_FINGERPRINT_UNIQUENESS',collisions.length===0&&malformed.length===0,
    `identityEvidence=${identityEvidence.length}, collisions=${collisions.length}, malformed=${malformed.length}`,[...collisions,...malformed]);
  const inactiveEvidence=allEvidence.filter(e=>inactiveProductIds.includes(e.productId));
  check('INACTIVE_HISTORY_PRESERVED',inactiveProductIds.every(id=>inactiveEvidence.some(e=>e.productId===id)),
    `inactiveProductsWithEvidence=${new Set(inactiveEvidence.map(e=>e.productId)).size}/13; historical records retained`);

  const approvedProblems:string[]=[];
  for(const spec of approved.products){
    const matches=identityEvidence.filter(e=>e.sourceRecordId==='IDENTITY:'+spec.fingerprint);
    if(matches.length!==1){approvedProblems.push(`${spec.productName}: evidence count ${matches.length}`);continue;}
    const p=productMap.get(matches[0].productId);
    if(!p?.isActive || p.productName!==spec.productName||p.brand!==spec.brand||p.quantityText!==spec.quantityText){
      approvedProblems.push(`${spec.productName}: product identity or active state mismatch`);
    }
    for(const offerId of spec.offerIds){
      const offer=allOffers.find(o=>o.id===offerId);
      if(!offer||offer.productId!==matches[0].productId)approvedProblems.push(`${spec.productName}: offer ${offerId} not linked to expected product`);
    }
  }
  check('FOUR_APPROVED_PRODUCTS_FIVE_LINKS',approvedProblems.length===0,
    `approvedIdentities=4, expectedLinks=5, problems=${approvedProblems.length}`,approvedProblems);
  const enfagrowOffers=ENFAGROW_OFFER_IDS.map(id=>allOffers.find(o=>o.id===id));
  const enfEvidence=identityEvidence.filter(e=>e.sourceRecordId==='IDENTITY:'+ENFAGROW_FINGERPRINT);
  const enfOk=enfagrowOffers.every(o=>o&&o.productId===null&&o.sourceSystemId===flipp.id)&&enfEvidence.length===0;
  check('ENFAGROW_HELD',enfOk,`heldOffers=${enfagrowOffers.filter(o=>o&&o.productId===null).length}/2, identityEvidence=${enfEvidence.length}`);
  const marc=productMap.get(MARCANGELO_ID);
  const marcEvidence=identityEvidence.filter(e=>e.productId===MARCANGELO_ID);
  const marcAlias=marcEvidence.filter(e=>e.sourceRecordId==='IDENTITY:'+MARCANGELO_NEW_FINGERPRINT);
  check('MARCANGELO_RECONCILED',!!marc?.isActive&&marc.productName==='Marcangelo seasoned pork tenderloin Smoky BBQ'&&
    marc.quantityText==='500 g'&&marcEvidence.length===2&&marcAlias.length===1,
    `productName=${marc?.productName??'MISSING'}, package=${marc?.quantityText??'MISSING'}, evidence=${marcEvidence.length}, correctedAlias=${marcAlias.length}`);

  // A separate check: no price observations were inferred from advertised prices.
  check('NO_INFERRED_SHELF_PRICES',priceObservations===0,`priceObservations=${priceObservations}`);
  const failed=checks.filter(c=>!c.passed);
  const report={phase:'B5_FINAL',mode:'READ_ONLY',database:db[0].name,generatedAt:new Date().toISOString(),
    status:failed.length?'FAIL':'PASS',passCount:checks.length-failed.length,failCount:failed.length,
    totals,checks,caveats:[
      'This audit checks structural integrity, the exact reviewed remediation manifests, and selected promotion invariants; it does not independently validate retailer prices or product formulations.',
      'Historical evidence on inactive products is intentionally preserved and does not authorize reactivation.',
      'B.5.3 offer eligibility rules are classification-only until explicitly integrated downstream; this audit does not certify basket/comparison calculation readiness.',
      'No database mutations are performed; JSON output is written to local filesystem only.'
    ]};
  const dir=resolve('data/research/living-db');mkdirSync(dir,{recursive:true});
  const reportPath=resolve(dir,'b5-final-integrity-report.json');writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,database:report.database,totals,passCount:report.passCount,failCount:report.failCount,
    checks:checks.map(x=>({id:x.id,passed:x.passed,details:x.details, ...(x.examples?{examples:x.examples}:{})})),report:reportPath},null,2));
  if(failed.length)process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());

/**
 * Review-gated creation of NEW Flipp canonical products.
 * Dry-run by default; never changes products or offer links without approved=true,
 * --write, --backup-confirmed, and an exact local kavyo_phase_b_test connection.
 *
 * npx tsx scripts/review-and-create-flipp-products.ts review/flipp-new-product-approvals.json
 * npx tsx scripts/review-and-create-flipp-products.ts review/flipp-new-product-approvals.json --write --backup-confirmed
 */
import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence, type ProductPromotionCandidate } from '../src/ingestion/living-catalog/product-promotion-plan.js';

type Approval = {
  fingerprint: string; productName: string; brand: string | null;
  quantityText: string; quantityValue: string; quantityUnit: string;
  scopeCategory: string; offerIds: string[];
  approved: boolean; reviewNotes: string;
};
type FileShape = {format: string; sourceSystem: string; entries: Approval[]};
type Offer = { id:string; stableKey:string; sourceSystemId:string; productId:string|null; conditionEvidence:Prisma.JsonValue|null };
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/i;
// Display case and whitespace are not product identity. The fingerprint and canonical
// quantity remain strict, and scope/category must still match the reviewed entry.
const displayKey = (value: string | null | undefined): string =>
  (value ?? '').normalize('NFKC').toLocaleLowerCase('en-CA').replace(/\s+/g, ' ').trim();
const args = process.argv.slice(2);
const pathArg = args.find(a=>!a.startsWith('--'));
const WRITE = args.includes('--write');
if (!pathArg || args.filter(a=>!a.startsWith('--')).length!==1 || args.some(a=>a.startsWith('--')&&!['--write','--backup-confirmed'].includes(a)))
  throw Error('Usage: npx tsx scripts/review-and-create-flipp-products.ts <review.json> [--write --backup-confirmed]');
if (WRITE&&!args.includes('--backup-confirmed')) throw Error('SAFETY STOP: write requires --backup-confirmed');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw Error('DATABASE_URL missing');
const url = new URL(connectionString);
if (!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/kavyo_phase_b_test')
  throw Error('SAFETY STOP: only local kavyo_phase_b_test permitted');
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString})});

function sourceStageId(v:Prisma.JsonValue|null):string|null {
  if (!v||typeof v!=='object'||Array.isArray(v)) return null;
  const id=(v as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof id==='string'&&UUID.test(id)?id:null;
}
function assertFile(file:FileShape) {
  if (file.format!=='KAVYO_NEW_PRODUCT_APPROVALS_V1'||file.sourceSystem!=='FLIPP_FLYERS'||!Array.isArray(file.entries)) throw Error('Invalid approval file');
  if (file.entries.length>50) throw Error('SAFETY STOP: approve at most 50 identity groups per run');
  const fingerprints=new Set<string>();const ids=new Set<string>();
  for (const e of file.entries) {
    if (!SHA.test(e.fingerprint)||!e.productName?.trim()||!e.brand?.trim()||!e.quantityText?.trim()||
        !e.quantityValue||!e.quantityUnit||!e.scopeCategory||!Array.isArray(e.offerIds)||!e.offerIds.length||
        typeof e.approved!=='boolean'||typeof e.reviewNotes!=='string') throw Error('Invalid approval entry');
    if (fingerprints.has(e.fingerprint)) throw Error('Duplicate fingerprint');fingerprints.add(e.fingerprint);
    if (e.approved && !e.reviewNotes.trim()) throw Error(`Approved entry requires evidence notes: ${e.productName}`);
    for (const id of e.offerIds) {
      if (!UUID.test(id)||ids.has(id)) throw Error('Invalid or duplicated offer ID');ids.add(id);
    }
  }
}
async function counts() {
  return {
    products:await prisma.product.count(), evidence:await prisma.productEvidence.count(),
    advertised:await prisma.advertisedOffer.count(), staged:await prisma.stagedOffer.count(),
    observations:await prisma.priceObservation.count(),linked:await prisma.advertisedOffer.count({where:{productId:{not:null}}}),
  };
}
async function main() {
  const bytes=await readFile(resolve(pathArg!));const file=JSON.parse(bytes.toString('utf8')) as FileShape;
  assertFile(file);
  const digest=createHash('sha256').update(bytes).digest('hex');
  try {
    const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if (db[0]?.db!=='kavyo_phase_b_test') throw Error('SAFETY STOP: connected to wrong database');
    const source=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    if (!source) throw Error('Source FLIPP_FLYERS not found');
    const before=await counts();
    const approved=file.entries.filter(x=>x.approved);
    const inspected: Array<{fingerprint:string;productName:string;status:string;offerCount:number;sourceEvidence:unknown[]}> = [];
    const ready: Array<{approval:Approval;offers:Offer[];seed:ProductPromotionCandidate}> = [];
    // Always export evidence for every candidate, including not-yet-approved groups.
    for (const e of file.entries) {
      const offers=await prisma.advertisedOffer.findMany({where:{id:{in:e.offerIds}},select:{id:true,stableKey:true,sourceSystemId:true,productId:true,conditionEvidence:true}});
      if (offers.length!==e.offerIds.length||offers.some(o=>o.sourceSystemId!==source.id)) throw Error(`SAFETY STOP: missing or wrong-source offer: ${e.productName}`);
      const stageIds=offers.map(o=>sourceStageId(o.conditionEvidence));
      if (stageIds.some(id=>!id)||new Set(stageIds).size!==stageIds.length) throw Error(`SAFETY STOP: missing/nonunique staging evidence ${e.productName}`);
      const stages=await prisma.stagedOffer.findMany({where:{id:{in:stageIds as string[]},sourceSystemId:source.id},select:{
        id:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,
        isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true,rawPayload:true,imageUrl:true,sourceUrl:true,
      }});
      if (stages.length!==e.offerIds.length) throw Error(`SAFETY STOP: staged evidence missing ${e.productName}`);
      const stageMap=new Map(stages.map(s=>[s.id,s]));
      let seed:ProductPromotionCandidate|null=null;
      const evidence=[];
      for (const offer of offers) {
        const stage=stageMap.get(sourceStageId(offer.conditionEvidence)!)!;
        const input:PromotionEvidence={offerId:offer.id,stableKey:offer.stableKey,sourceSystemId:offer.sourceSystemId,stagedOfferId:stage.id,
          productName:stage.productName,brand:stage.brand,descriptionText:stage.descriptionText,packageSizeText:stage.packageSizeText,
          quantityValue:stage.quantityValue?.toString()??null,quantityUnit:stage.quantityUnit,
          isMultiVariant:stage.isMultiVariant,isPriceRange:stage.isPriceRange,quantityIsApproximate:stage.quantityIsApproximate};
        const plan=planProductPromotion(input);
        if (plan.decision!=='CANDIDATE'||plan.fingerprint!==e.fingerprint||
            displayKey(plan.productName)!==displayKey(e.productName)||
            displayKey(plan.brand)!==displayKey(e.brand)||
            displayKey(plan.quantityText)!==displayKey(e.quantityText)||
            plan.quantityValue!==e.quantityValue||plan.quantityUnit!==e.quantityUnit||
            plan.scopeCategory!==e.scopeCategory)
          throw Error(`SAFETY STOP: current product validation differs from review file for ${offer.id}: ${JSON.stringify(plan)}`);
        seed??=plan;
        evidence.push({offerId:offer.id,alreadyLinkedProductId:offer.productId,stableKey:offer.stableKey,
          stageId:stage.id,productName:stage.productName,brand:stage.brand,description:stage.descriptionText,
          packageSize:stage.packageSizeText,quantityValue:stage.quantityValue?.toString()??null,quantityUnit:stage.quantityUnit,
          imageUrl:stage.imageUrl,sourceUrl:stage.sourceUrl,rawEvidence:stage.rawPayload});
      }
      // Even for an unapproved candidate, identify pre-existing identity evidence.
      const prior=await prisma.productEvidence.findMany({where:{sourceSystemId:source.id,evidenceType:'CANONICAL_IDENTITY',
        sourceRecordId:`IDENTITY:${e.fingerprint}`},select:{productId:true,verified:true},take:2});
      const linkedIds=new Set(offers.map(o=>o.productId).filter((id):id is string=>id!==null));
      if (prior.length>1||linkedIds.size>1||(prior.length===0&&linkedIds.size>0)||
          (prior.length===1&&(linkedIds.size!==1||!linkedIds.has(prior[0].productId))))
        throw Error(`SAFETY STOP: conflicting or partially linked identity ${e.productName}`);
      const status=prior.length===1?'ALREADY_CREATED':e.approved?'READY_FOR_CREATION':'AWAITING_MANUAL_APPROVAL';
      inspected.push({fingerprint:e.fingerprint,productName:e.productName,status,offerCount:e.offerIds.length,sourceEvidence:evidence});
      if(e.approved && !prior.length) {
        // Prevent a duplicate product when a matching identity exists outside the fingerprint index.
        const names=await prisma.product.findMany({where:{productName:{equals:seed!.productName,mode:'insensitive'}},select:{id:true,brand:true,quantityValue:true,quantityUnit:true}});
        if(names.some(x=>(x.brand??'').toLowerCase()===(seed!.brand??'').toLowerCase()&&
          x.quantityValue?.toString()===seed!.quantityValue&&x.quantityUnit===seed!.quantityUnit))
          throw Error(`SAFETY STOP: potential existing product requires linking, not creation: ${e.productName}`);
        ready.push({approval:e,offers,seed:seed!});
      }
    }
    const dir=resolve('data/research/living-db/new-product-review');await mkdir(dir,{recursive:true});
    const evidencePath=join(dir,'candidate-source-evidence.json');
    await writeFile(evidencePath,JSON.stringify({reviewSha256:digest,candidates:inspected},null,2)+'\n');
    let createdProducts=0,linked=0;
    if(WRITE && ready.length>0) {
      await prisma.$transaction(async tx=>{
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(72941, 11628)::text AS locked`;
        for(const item of ready) {
          const {approval:e,seed}=item;
          const prior=await tx.productEvidence.findMany({where:{sourceSystemId:source.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:`IDENTITY:${e.fingerprint}`},select:{id:true}});
          if(prior.length) throw Error(`SAFETY STOP: identity appeared during write ${e.productName}`);
          const offers=await tx.advertisedOffer.findMany({where:{id:{in:e.offerIds},sourceSystemId:source.id},select:{id:true,productId:true}});
          if(offers.length!==e.offerIds.length||offers.some(x=>x.productId!==null)) throw Error(`SAFETY STOP: offer link changed ${e.productName}`);
          const duplicates=await tx.product.findMany({where:{productName:{equals:seed.productName,mode:'insensitive'}},select:{id:true,brand:true,quantityValue:true,quantityUnit:true}});
          if(duplicates.some(x=>(x.brand??'').toLowerCase()===(seed.brand??'').toLowerCase()&&
              x.quantityValue?.toString()===seed.quantityValue&&x.quantityUnit===seed.quantityUnit))
            throw Error(`SAFETY STOP: matching product appeared ${e.productName}`);
          const product=await tx.product.create({data:{barcode:null,productName:seed.productName,brand:seed.brand,
            quantityValue:seed.quantityValue,quantityUnit:seed.quantityUnit,quantityText:seed.quantityText,
            categories:seed.scopeCategory,isActive:true},select:{id:true}});
          await tx.productEvidence.create({data:{productId:product.id,sourceSystemId:source.id,
            sourceRecordId:`IDENTITY:${e.fingerprint}`,evidenceType:'CANONICAL_IDENTITY',verified:false,
            rawPayload:{confidence:'EXACT_BRAND_NAME_PACKAGE_REVIEW_APPROVED_NOT_GTIN_VERIFIED',identityFingerprint:e.fingerprint,
              sourceStagedOfferId:seed.stagedOfferId,firstAdvertisedOfferId:seed.offerId,
              approvalFileSha256:digest,reviewNotes:e.reviewNotes} as Prisma.InputJsonValue}});
          const result=await tx.advertisedOffer.updateMany({where:{id:{in:e.offerIds},sourceSystemId:source.id,productId:null},data:{productId:product.id}});
          if(result.count!==e.offerIds.length) throw Error(`SAFETY STOP: incomplete link update ${e.productName}`);
          createdProducts++;linked+=result.count;
        }
        if(await tx.priceObservation.count()!==before.observations||await tx.stagedOffer.count()!==before.staged||
           await tx.advertisedOffer.count()!==before.advertised)
          throw Error('SAFETY STOP: unrelated tables changed');
      },{maxWait:30000,timeout:120000});
    }
    const after=await counts();
    if (after.products!==before.products+createdProducts||after.evidence!==before.evidence+createdProducts||
        after.linked!==before.linked+linked||after.staged!==before.staged||after.advertised!==before.advertised||
        after.observations!==before.observations) throw Error('SAFETY ALERT: post-run counts unexpected');
    const report={mode:WRITE?'WRITE':'DRY_RUN',database:db[0].db,reviewFile:resolve(pathArg!),reviewSha256:digest,
      candidateGroups:file.entries.length,approvedGroups:approved.length,alreadyCreated:inspected.filter(x=>x.status==='ALREADY_CREATED').length,
      readyForCreation:ready.length,newProductsPlanned:ready.length,sourceOffersPlanned:ready.reduce((n,x)=>n+x.offers.length,0),
      createdProducts,linked,before,after,evidenceReport:evidencePath,
      notes:['No GTIN verification is asserted. Manual review approval is recorded in unverified ProductEvidence.',
        'All new product creations, evidence records and links are atomic. Existing products are never modified.',
        'No price observations, staging records, advertised offer prices or basket data are changed.']};
    await writeFile(join(dir,WRITE?'creation-write.json':'creation-dry-run.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }finally{await prisma.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});

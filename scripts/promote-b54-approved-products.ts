/** B.5.4: strictly allowlisted new canonical Product promotion.
 * DRY_RUN by default. The --write path is only for localhost/kavyo_phase_b_test.
 * Does not modify the legacy promotion script or basket/comparison logic.
 */
import 'dotenv/config';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient, Prisma} from '../src/generated/prisma/client.js';
import {planProductPromotion, type PromotionEvidence, type ProductPromotionCandidate} from '../src/ingestion/living-catalog/product-promotion-plan.js';

const WRITE = process.argv.slice(2).includes('--write');
const permitted = new Set(['--write']);
for(const a of process.argv.slice(2)) if(!permitted.has(a))throw Error(`Unrecognized option ${a}`);
const SOURCE = 'FLIPP_FLYERS';
const PREFIX = 'IDENTITY:';
const manifestPath = fileURLToPath(new URL('./b54-approved-products.json',import.meta.url));
type Approved = {fingerprint:string;productName:string;brand:string|null;quantityText:string;offerIds:string[]};
const manifest = JSON.parse(await readFile(manifestPath,'utf8')) as {products:Approved[]};
if(manifest.products.length!==4 || manifest.products.reduce((n,x)=>n+x.offerIds.length,0)!==5)
  throw Error('Safety stop: manifest must contain exactly 4 identities and 5 offers');
if(new Set(manifest.products.map(x=>x.fingerprint)).size!==4 ||
  new Set(manifest.products.flatMap(x=>x.offerIds)).size!==5 ||
  manifest.products.some(x=>!/^[a-f0-9]{64}$/.test(x.fingerprint)||x.offerIds.length===0))
  throw Error('Safety stop: invalid or duplicated manifest fingerprints / offer IDs');
const allowedOffers=manifest.products.flatMap(x=>x.offerIds);

function sourceStageId(v:Prisma.JsonValue|null):string|null {
  if(!v||typeof v!=='object'||Array.isArray(v))return null;
  const value=(v as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof value==='string' && /^[0-9a-f-]{36}$/i.test(value)?value:null;
}
async function counts(db:PrismaClient){
  const [products,activeProducts,offers,linkedOffers,stagedOffers,priceObservations,evidence]=await Promise.all([
    db.product.count(),db.product.count({where:{isActive:true}}),db.advertisedOffer.count(),
    db.advertisedOffer.count({where:{productId:{not:null}}}),db.stagedOffer.count(),
    db.priceObservation.count(),db.productEvidence.count(),
  ]);
  return {products,activeProducts,offers,linkedOffers,stagedOffers,priceObservations,evidence};
}

async function main(){
  if(!process.env.DATABASE_URL)throw Error('DATABASE_URL missing');
  const url=new URL(process.env.DATABASE_URL);
  if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/kavyo_phase_b_test')
    throw Error('SAFETY STOP: only localhost/kavyo_phase_b_test is allowed');
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    const dbName=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if(dbName[0]?.db!=='kavyo_phase_b_test')throw Error('Wrong database');
    const source=await prisma.sourceSystem.findUnique({where:{name:SOURCE},select:{id:true}});
    if(!source)throw Error('FLIPP_FLYERS source missing');
    const before=await counts(prisma);
    // Baseline is intentionally strict; a prior successful write is the only permitted alternate state.
    const baseline=before.products===169&&before.activeProducts===156&&before.offers===1560&&
      before.linkedOffers===168&&before.stagedOffers===2273&&before.priceObservations===0&&before.evidence===170;
    const completed=before.products===173&&before.activeProducts===160&&before.offers===1560&&
      before.linkedOffers===173&&before.stagedOffers===2273&&before.priceObservations===0&&before.evidence===174;
    if(!baseline&&!completed)throw Error(`SAFETY STOP: unexpected database baseline: ${JSON.stringify(before)}`);
    const ads=await prisma.advertisedOffer.findMany({
      where:{id:{in:allowedOffers},sourceSystemId:source.id},
      select:{id:true,stableKey:true,sourceSystemId:true,productId:true,conditionEvidence:true},
    });
    if(ads.length!==5)throw Error('SAFETY STOP: missing or differently sourced approved advertisements');
    const ids=ads.map(a=>sourceStageId(a.conditionEvidence));
    if(ids.some(x=>!x)||new Set(ids).size!==5)throw Error('SAFETY STOP: source staging IDs missing or non-unique');
    const rows=await prisma.stagedOffer.findMany({
      where:{id:{in:ids as string[]},sourceSystemId:source.id},
      select:{id:true,sourceSystemId:true,productName:true,brand:true,descriptionText:true,
        packageSizeText:true,quantityValue:true,quantityUnit:true,isMultiVariant:true,
        isPriceRange:true,quantityIsApproximate:true},
    });
    if(rows.length!==5)throw Error('SAFETY STOP: source staging records not found');
    const staged=new Map(rows.map(x=>[x.id,x]));
    const offers=new Map(ads.map(x=>[x.id,x]));
    const plans=new Map<string,ProductPromotionCandidate[]>();
    for(const approved of manifest.products){
      const candidates:ProductPromotionCandidate[]=[];
      for(const offerId of approved.offerIds){
        const offer=offers.get(offerId)!;
        const row=staged.get(sourceStageId(offer.conditionEvidence)!)!;
        const input:PromotionEvidence={
          offerId:offer.id,stableKey:offer.stableKey,sourceSystemId:offer.sourceSystemId,
          stagedOfferId:row.id,productName:row.productName,brand:row.brand,
          descriptionText:row.descriptionText,packageSizeText:row.packageSizeText,
          quantityValue:row.quantityValue?.toString()??null,quantityUnit:row.quantityUnit,
          isMultiVariant:row.isMultiVariant,isPriceRange:row.isPriceRange,
          quantityIsApproximate:row.quantityIsApproximate,
        };
        const plan=planProductPromotion(input);
        if(plan.decision!=='CANDIDATE')throw Error(`SAFETY STOP: ${offerId} now held by planner`);
        if(plan.fingerprint!==approved.fingerprint||plan.productName!==approved.productName||
          plan.brand!==approved.brand||plan.quantityText!==approved.quantityText)
          throw Error(`SAFETY STOP: planner identity changed for ${offerId}: ${JSON.stringify(plan)}`);
        candidates.push(plan);
      }
      plans.set(approved.fingerprint,candidates);
    }
    const inspection=[];
    for(const approved of manifest.products){
      const evidence=await prisma.productEvidence.findMany({where:{sourceSystemId:source.id,
        evidenceType:'CANONICAL_IDENTITY',sourceRecordId:PREFIX+approved.fingerprint},select:{productId:true},take:2});
      const idsFound=new Set(approved.offerIds.map(id=>offers.get(id)!.productId).filter((id):id is string=>id!==null));
      if(evidence.length>1||idsFound.size>1)throw Error(`SAFETY STOP: conflicting evidence for ${approved.productName}`);
      if(evidence.length===0 && idsFound.size!==0)throw Error(`SAFETY STOP: offer linked without matching identity evidence for ${approved.productName}`);
      if(evidence.length===1 && (idsFound.size!==1||!idsFound.has(evidence[0].productId)))
        throw Error(`SAFETY STOP: incomplete or contradictory links for ${approved.productName}`);
      inspection.push({name:approved.productName,fingerprint:approved.fingerprint,offers:approved.offerIds.length,
        action:evidence.length?'ALREADY_PROMOTED':'CREATE_AND_LINK',
        productId:evidence[0]?.productId??null});
    }
    if(baseline && inspection.some(x=>x.action!=='CREATE_AND_LINK'))throw Error('SAFETY STOP: baseline has pre-existing approved identity');
    if(completed && inspection.some(x=>x.action!=='ALREADY_PROMOTED'))throw Error('SAFETY STOP: completion counts but missing approved identity');
    let createdProducts=0,newLinks=0;
    if(WRITE&&!completed){
      // One atomic transaction: either all four products and five links are written or none.
      await prisma.$transaction(async tx=>{
        for(const approved of manifest.products){
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`kavyo-b4:${approved.fingerprint}`}))`;
          const prior=await tx.productEvidence.findMany({where:{sourceSystemId:source.id,
            evidenceType:'CANONICAL_IDENTITY',sourceRecordId:PREFIX+approved.fingerprint},select:{productId:true},take:2});
          if(prior.length!==0)throw Error('SAFETY STOP: identity appeared during transaction');
          const current=await tx.advertisedOffer.findMany({where:{id:{in:approved.offerIds},sourceSystemId:source.id},select:{id:true,productId:true}});
          if(current.length!==approved.offerIds.length||current.some(x=>x.productId!==null))
            throw Error('SAFETY STOP: an offer changed during transaction');
          const seed=plans.get(approved.fingerprint)![0];
          const product=await tx.product.create({data:{
            barcode:null,productName:seed.productName,brand:seed.brand,
            quantityValue:seed.quantityValue,quantityUnit:seed.quantityUnit,
            quantityText:seed.quantityText,categories:seed.scopeCategory,isActive:true,
          },select:{id:true}});
          await tx.productEvidence.create({data:{
            productId:product.id,sourceSystemId:source.id,sourceRecordId:PREFIX+approved.fingerprint,
            evidenceType:'CANONICAL_IDENTITY',verified:false,
            rawPayload:{identityFingerprint:approved.fingerprint,sourceStagedOfferId:seed.stagedOfferId,
              firstAdvertisedOfferId:seed.offerId,confidence:'EXACT_BRAND_NAME_PACKAGE_UNVERIFIED'} as Prisma.InputJsonValue,
          }});
          const updated=await tx.advertisedOffer.updateMany({where:{id:{in:approved.offerIds},
            sourceSystemId:source.id,productId:null},data:{productId:product.id}});
          if(updated.count!==approved.offerIds.length)throw Error('SAFETY STOP: concurrent offer change');
          createdProducts++;newLinks+=updated.count;
        }
        const verify={
          products:await tx.product.count(),activeProducts:await tx.product.count({where:{isActive:true}}),
          offers:await tx.advertisedOffer.count(),linkedOffers:await tx.advertisedOffer.count({where:{productId:{not:null}}}),
          stagedOffers:await tx.stagedOffer.count(),priceObservations:await tx.priceObservation.count(),
          evidence:await tx.productEvidence.count(),
        };
        if(verify.products!==173||verify.activeProducts!==160||verify.offers!==1560||
          verify.linkedOffers!==173||verify.stagedOffers!==2273||verify.priceObservations!==0||verify.evidence!==174)
          throw Error('SAFETY STOP: unexpected in-transaction counts '+JSON.stringify(verify));
      },{timeout:30000});
    }
    const after=await counts(prisma);
    const report={mode:WRITE?'WRITE':'DRY_RUN',database:dbName[0].db,
      result:completed?'ALREADY_COMPLETE':WRITE?'PROMOTED':'READY_FOR_APPROVED_WRITE',
      approvedIdentities:4,approvedAdvertisements:5,excludedEnfagrowFingerprint:
      'fe5ee8ca1adabc05472fb2e7476e6e2f8906b9f6f5d50efc6d1d511c9ca92713',
      inspection,createdProducts,newLinks,before,after,
      note:'Exactly four manifest identities; no changes to other offers, staged data, prices or basket code.'};
    const dir=resolve('data/research/living-db');await mkdir(dir,{recursive:true});
    await writeFile(join(dir,WRITE?'b54-approved-promotion-write.json':'b54-approved-promotion-dry-run.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally {await prisma.$disconnect()}
}
main().catch(e=>{console.error(e);process.exitCode=1});

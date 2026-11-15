/**
 * B.5.4 — guarded remediation of 17 previously linked ambiguous advertisements.
 * Default is a full READ_ONLY dry run. Explicit --write required.
 * Never deletes a product, evidence, price, or source record.
 * Restricts operations to localhost/kavyo_phase_b_test.
 */
import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence } from '../src/ingestion/living-catalog/product-promotion-plan.js';

const reviewPath = fileURLToPath(new URL('./b54-reviewed-links.json', import.meta.url));
type Reviewed = {offerId:string;productId:string;reasons:string};
const reviewed: Reviewed[] = JSON.parse(readFileSync(reviewPath,'utf8')) as Reviewed[];
if (reviewed.length !== 17 || new Set(reviewed.map(x => x.offerId)).size !== 17 ||
    new Set(reviewed.map(x => x.productId)).size !== 13) {
  throw Error('SAFETY STOP: expected 17 offers across 13 products');
}
const write = process.argv.includes('--write');
if (process.argv.some(arg => arg.startsWith('--') && arg !== '--write')) throw Error('Unrecognized option');
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw Error('DATABASE_URL is missing');
const url=new URL(connectionString);
if(!['localhost','127.0.0.1'].includes(url.hostname) || url.pathname!=='/kavyo_phase_b_test') {
  throw Error('SAFETY STOP: only localhost/kavyo_phase_b_test permitted');
}
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString})});

function sourceStageId(value: Prisma.JsonValue|null):string|null {
  if(!value || typeof value!=='object'||Array.isArray(value))return null;
  const id=(value as Record<string, Prisma.JsonValue>).sourceStagedOfferId;
  return typeof id==='string' && id.length>0 ? id:null;
}

async function gather(db: PrismaClient | Prisma.TransactionClient) {
  const findings=[] as Array<{
    offerId:string; productId:string; productName:string; brand:string|null;
    stageId:string; actualHoldReasons:string[]; expectedHoldReason:string;
    isLinked:boolean; status:string;
  }>;
  for(const expected of reviewed){
    const offer=await db.advertisedOffer.findUnique({where:{id:expected.offerId}, select:{
      id:true,productId:true,sourceSystemId:true,stableKey:true,conditionEvidence:true,productName:true,
    }});
    if(!offer)throw Error(`SAFETY STOP: missing offer ${expected.offerId}`);
    if(offer.productId!==expected.productId && offer.productId!==null) {
      throw Error(`SAFETY STOP: offer ${offer.id} was reassigned to another product`);
    }
    const stageId=sourceStageId(offer.conditionEvidence);
    if(!stageId)throw Error(`SAFETY STOP: no original stage reference for ${offer.id}`);
    const stage=await db.stagedOffer.findUnique({where:{id:stageId},select:{
      id:true,sourceSystemId:true,productName:true,brand:true,descriptionText:true,
      packageSizeText:true,quantityValue:true,quantityUnit:true,
      isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true,
    }});
    if(!stage||stage.sourceSystemId!==offer.sourceSystemId) throw Error(`SAFETY STOP: staged evidence mismatch for ${offer.id}`);
    const promotion:PromotionEvidence={
      offerId:offer.id, stagedOfferId:stage.id, stableKey:offer.stableKey, sourceSystemId:stage.sourceSystemId,
      productName:stage.productName, brand:stage.brand, descriptionText:stage.descriptionText,
      packageSizeText:stage.packageSizeText, quantityValue:stage.quantityValue?.toString()??null,
      quantityUnit:stage.quantityUnit, isMultiVariant:stage.isMultiVariant,
      isPriceRange:stage.isPriceRange, quantityIsApproximate:stage.quantityIsApproximate,
    };
    const plan=planProductPromotion(promotion);
    if(plan.decision!=='HOLD' || !plan.reasons.includes(expected.reasons)) {
      throw Error(`SAFETY STOP: changed planner decision for ${offer.id}; expected ${expected.reasons}`);
    }
    const product=await db.product.findUnique({where:{id:expected.productId},select:{id:true,productName:true,brand:true}});
    if(!product)throw Error(`SAFETY STOP: missing product ${expected.productId}`);
    if(stage.brand?.trim()?.toLowerCase()!==product.brand?.trim()?.toLowerCase() ||
       stage.productName.trim().toLowerCase()!==product.productName.trim().toLowerCase()){
      throw Error(`SAFETY STOP: product identity changed for ${offer.id}; investigate manually`);
    }
    findings.push({offerId:offer.id,productId:product.id,productName:product.productName,brand:product.brand,
      stageId:stage.id,actualHoldReasons:plan.reasons,expectedHoldReason:expected.reasons,
      isLinked:offer.productId===expected.productId,status:offer.productId===null?'ALREADY_UNLINKED':'READY_TO_UNLINK'});
  }
  const allProductIds=[...new Set(reviewed.map(r=>r.productId))];
  const products=[] as Array<{
    productId:string; productName:string; active:boolean; linkedOffersBefore:number; reviewedLinkedOffers:number;
    linkedOffersAfter:number; basketItems:number; priceObservations:number; stagedReferences:number;
    verifiedEvidence:number; otherSourceEvidence:number; action:string;
  }>;
  const flipp=await db.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
  if(!flipp)throw Error('SAFETY STOP: FLIPP_FLYERS source missing');
  for(const productId of allProductIds){
    const p=await db.product.findUnique({where:{id:productId},select:{productName:true,isActive:true}});
    if(!p)throw Error('Product disappeared');
    const [linkedOffersBefore,basketItems,priceObservations,stagedReferences,verifiedEvidence,otherSourceEvidence]=await Promise.all([
      db.advertisedOffer.count({where:{productId}}),
      db.basketItem.count({where:{productId}}),
      db.priceObservation.count({where:{productId}}),
      db.stagedOffer.count({where:{matchedProductId:productId}}),
      db.productEvidence.count({where:{productId,verified:true}}),
      db.productEvidence.count({where:{productId,sourceSystemId:{not:flipp.id}}}),
    ]);
    const reviewedLinkedOffers=findings.filter(x=>x.productId===productId && x.isLinked).length;
    const linkedOffersAfter=linkedOffersBefore-reviewedLinkedOffers;
    if(linkedOffersAfter<0)throw Error('Unexpected negative linked offer count');
    const hasDependencies=linkedOffersAfter>0 || basketItems>0 || priceObservations>0 || stagedReferences>0 ||
      verifiedEvidence>0 || otherSourceEvidence>0;
    const action=!p.isActive?'ALREADY_INACTIVE':hasDependencies?'RETAIN_ACTIVE_DEPENDENCIES':'DEACTIVATE_AFTER_UNLINK';
    products.push({productId,productName:p.productName,active:p.isActive,linkedOffersBefore,
      reviewedLinkedOffers,linkedOffersAfter,basketItems,priceObservations,stagedReferences,
      verifiedEvidence,otherSourceEvidence,action});
  }
  const totals={
    products:await db.product.count(),activeProducts:await db.product.count({where:{isActive:true}}),
    offers:await db.advertisedOffer.count(),linkedOffers:await db.advertisedOffer.count({where:{productId:{not:null}}}),
    evidence:await db.productEvidence.count(),stagedOffers:await db.stagedOffer.count(),
    priceObservations:await db.priceObservation.count(),
  };
  return {findings,products,totals};
}

async function main(){
  const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
  if(db[0]?.db!=='kavyo_phase_b_test')throw Error('Wrong database');
  const before=await gather(prisma);
  const result={
    mode:write?'WRITE':'DRY_RUN',database:db[0].db,
    reviewedOffers:reviewed.length,distinctAffectedProducts:before.products.length,
    toUnlink:before.findings.filter(x=>x.isLinked).length,
    alreadyUnlinked:before.findings.filter(x=>!x.isLinked).length,
    toDeactivate:before.products.filter(x=>x.action==='DEACTIVATE_AFTER_UNLINK').length,
    retainedActive:before.products.filter(x=>x.action==='RETAIN_ACTIVE_DEPENDENCIES').length,
    before:before.totals,products:before.products,offers:before.findings,
    protections:['Source stages and raw payloads preserved','All advertised prices and date windows preserved',
      'ProductEvidence retained, including existing identity fingerprints',
      'Products with other offer, basket, price, stage, verified or external evidence references remain active',
      'No deletion; affected unreferenced products are deactivated only','No basket/comparison code or rows changed'],
  };
  if(write){
    await prisma.$transaction(async tx=>{
      // A single lock coordinates THIS remediation only; do not run competing importers concurrently.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('kavyo-b54-linked-variant-remediation'))`;
      const current=await gather(tx);
      if(JSON.stringify(current)!==JSON.stringify(before)) {
        throw Error('SAFETY STOP: DB changed since preview; transaction rolled back');
      }
      for(const item of current.findings.filter(x=>x.isLinked)){
        const changed=await tx.advertisedOffer.updateMany({where:{id:item.offerId,productId:item.productId},data:{productId:null}});
        if(changed.count!==1)throw Error(`SAFETY STOP: concurrent change for ${item.offerId}`);
      }
      for(const product of current.products.filter(x=>x.action==='DEACTIVATE_AFTER_UNLINK')){
        // Recheck dependent relationships inside the transaction before deactivation.
        const [offers,baskets,prices,stages]=await Promise.all([
          tx.advertisedOffer.count({where:{productId:product.productId}}),
          tx.basketItem.count({where:{productId:product.productId}}),
          tx.priceObservation.count({where:{productId:product.productId}}),
          tx.stagedOffer.count({where:{matchedProductId:product.productId}}),
        ]);
        if(offers || baskets || prices || stages)throw Error(`SAFETY STOP: dependencies for ${product.productId}`);
        await tx.product.update({where:{id:product.productId},data:{isActive:false}});
      }
    },{timeout:60000});
    const after=await gather(prisma);
    (result as typeof result & {after?:typeof after.totals}).after=after.totals;
    if(after.totals.products!==before.totals.products || after.totals.offers!==before.totals.offers ||
       after.totals.evidence!==before.totals.evidence || after.totals.stagedOffers!==before.totals.stagedOffers ||
       after.totals.priceObservations!==before.totals.priceObservations ||
       after.totals.linkedOffers!==before.totals.linkedOffers-result.toUnlink){
      throw Error('POST-WRITE VALIDATION FAILED: inspect database before any further changes');
    }
  }
  const path=resolve('data/research/living-db',write?'b54-link-remediation-write.json':'b54-link-remediation-dry-run.json');
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({mode:result.mode,database:result.database,reviewedOffers:result.reviewedOffers,
    distinctAffectedProducts:result.distinctAffectedProducts,toUnlink:result.toUnlink,
    alreadyUnlinked:result.alreadyUnlinked,toDeactivate:result.toDeactivate,
    retainedActive:result.retainedActive,before:result.before,
    ...(write?{after:(result as typeof result & {after?:typeof before.totals}).after}:{}),report:path},null,2));
}
main().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>prisma.$disconnect());

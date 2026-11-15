/** B5.4: one-record, evidence-preserving reconciliation. --write required to mutate.
 * NOT a general-purpose product merger. No basket, comparison or price writes.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence } from '../src/ingestion/living-catalog/product-promotion-plan.js';

const PRODUCT_ID='8a0885a5-71f8-44e3-bc23-4668ca021299';
const OFFER_ID='5777d08d-6093-4bd2-a8e5-79a0bf6ddf1f';
const write=process.argv.includes('--write');
const url=new URL(process.env.DATABASE_URL ?? '');
if (!['localhost','127.0.0.1'].includes(url.hostname) || url.pathname!=='/kavyo_phase_b_test') {
  throw new Error('SAFETY STOP: only localhost/kavyo_phase_b_test permitted');
}
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
function stageId(evidence: Prisma.JsonValue|null): string|null {
  if(!evidence || typeof evidence!=='object' || Array.isArray(evidence)) return null;
  const v=(evidence as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof v==='string'?v:null;
}
async function main(){
  const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
  if(db[0]?.db!=='kavyo_phase_b_test')throw Error('Wrong database');
  const offer=await prisma.advertisedOffer.findUnique({where:{id:OFFER_ID},select:{id:true,sourceSystemId:true,stableKey:true,productId:true,conditionEvidence:true}});
  if(!offer||offer.productId!==PRODUCT_ID)throw Error('Offer missing or no longer linked to expected product');
  const sid=stageId(offer.conditionEvidence);
  if(!sid)throw Error('Source staging id not present in offer evidence');
  const stage=await prisma.stagedOffer.findUnique({where:{id:sid},select:{id:true,sourceSystemId:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true}});
  if(!stage||stage.sourceSystemId!==offer.sourceSystemId)throw Error('Source stage missing or source mismatch');
  if(stage.productName!=='Marcangelo seasoned pork tenderloin'||stage.brand!=='Marcangelo'||
     !/Smoky BBQ flavou?r/i.test(stage.descriptionText??'')||!/500\s*g/i.test(stage.descriptionText??''))
    throw Error('Unexpected source identity: manual review required');
  const input:PromotionEvidence={offerId:offer.id,stagedOfferId:stage.id,stableKey:offer.stableKey,sourceSystemId:stage.sourceSystemId,
    productName:stage.productName,brand:stage.brand,descriptionText:stage.descriptionText,packageSizeText:stage.packageSizeText,
    quantityValue:stage.quantityValue?.toString()??null,quantityUnit:stage.quantityUnit,
    isMultiVariant:stage.isMultiVariant,isPriceRange:stage.isPriceRange,quantityIsApproximate:stage.quantityIsApproximate};
  const plan=planProductPromotion(input);
  if(plan.decision!=='CANDIDATE'||plan.quantityValue!=='500'||plan.quantityUnit!=='g'||
    plan.productName!=='Marcangelo seasoned pork tenderloin Smoky BBQ')
    throw Error('SAFETY STOP: planner did not produce expected identity');
  const key='IDENTITY:'+plan.fingerprint;
  const product=await prisma.product.findUnique({where:{id:PRODUCT_ID},select:{id:true,productName:true,brand:true,quantityText:true,quantityUnit:true,quantityValue:true}});
  if(!product||product.brand!=='Marcangelo'||!product.productName.startsWith('Marcangelo seasoned pork tenderloin'))throw Error('Unexpected product row');
  const original=await prisma.productEvidence.findMany({where:{productId:PRODUCT_ID,evidenceType:'CANONICAL_IDENTITY',sourceSystemId:offer.sourceSystemId},select:{id:true,sourceRecordId:true,rawPayload:true}});
  if(!original.length)throw Error('No original provenance evidence');
  const alias=await prisma.productEvidence.findMany({where:{sourceSystemId:offer.sourceSystemId,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:key},select:{id:true,productId:true}});
  if(alias.some(x=>x.productId!==PRODUCT_ID)||alias.length>1)throw Error('New fingerprint already assigned elsewhere');
  const linked=await prisma.advertisedOffer.count({where:{productId:PRODUCT_ID}});
  if(linked!==1)throw Error('Product has multiple linked offers: manual review before modifying identity');
  const result={mode:write?'WRITE':'DRY_RUN',database:db[0].db,productId:PRODUCT_ID,offerId:OFFER_ID,
    originalEvidenceCount:original.length,oldProduct:product,newIdentity:plan,aliasExists:alias.length===1,
    action:alias.length?'ALREADY_RECONCILED':'ENRICH_EXISTING_AND_ADD_IDENTITY_EVIDENCE',preservesProductId:true,preservesHistoricalEvidence:true};
  if(write && alias.length===0){
    await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`kavyo-b4:${plan.fingerprint}`}))`;
      const still=await tx.advertisedOffer.findUnique({where:{id:OFFER_ID},select:{productId:true}});
      if(still?.productId!==PRODUCT_ID)throw Error('Offer link changed');
      const duplicate=await tx.productEvidence.findFirst({where:{sourceSystemId:offer.sourceSystemId,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:key}});
      if(duplicate)throw Error('Reconciliation changed concurrently; rerun read-only');
      await tx.product.update({where:{id:PRODUCT_ID},data:{productName:plan.productName,quantityText:plan.quantityText,quantityValue:plan.quantityValue,quantityUnit:plan.quantityUnit}});
      await tx.productEvidence.create({data:{productId:PRODUCT_ID,sourceSystemId:offer.sourceSystemId,
        sourceRecordId:key,evidenceType:'CANONICAL_IDENTITY',verified:false,
        rawPayload:{identityFingerprint:plan.fingerprint,sourceStagedOfferId:stage.id,firstAdvertisedOfferId:OFFER_ID,
          correctionOf:original.map(x=>x.sourceRecordId),reason:'B5_4_PACKAGE_AND_VARIANT_ENRICHMENT',
          confidence:'EXACT_BRAND_NAME_PACKAGE_UNVERIFIED'} as Prisma.InputJsonValue}});
    },{timeout:20000});
  }
  console.log(JSON.stringify(result,(_key,value)=>typeof value==='bigint'?value.toString():value,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());

/** Shared Flipp staged -> advertised offer promotion.
 * Read-only by default; --write --backup-confirmed required for atomic insert-only promotion.
 * Existing advertised offers are deliberately never overwritten, including productId.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { prepareFlippAdvertisedOffer, type PreparedAdvertisedOffer } from '../src/ingestion/living-catalog/staged-offer-promotion.js';
import { checkAdvertisementEligibility } from '../src/ingestion/validation/advertisement-eligibility.js';
import { classifyGroceryScope } from '../src/ingestion/scope/grocery-scope.js';

const args=process.argv.slice(2);
const permitted=new Set(['--write','--backup-confirmed']);
if(args.some(a=>!permitted.has(a))) throw Error('Usage: npx tsx scripts/promote-flipp-advertised-offers.ts [--write --backup-confirmed]');
const writable=args.includes('--write');
if(writable&&!args.includes('--backup-confirmed')) throw Error('SAFETY STOP: verified backup required');
const chunk=<T>(xs:T[],n:number):T[][]=>Array.from({length:Math.ceil(xs.length/n)},(_,i)=>xs.slice(i*n,(i+1)*n));

function dataFor(p:PreparedAdvertisedOffer): Prisma.AdvertisedOfferCreateManyInput {
  return {
    stableKey:p.stableKey,sourceSystemId:p.sourceSystemId,retailerId:p.retailerId,
    flyerId:p.flyerId,flyerExternalId:p.flyerExternalId,sourceRecordId:p.sourceRecordId,
    marketKey:p.marketKey,productName:p.productName,packageSizeText:p.packageSizeText,
    advertisedPriceAmount:p.advertisedPriceAmount,regularPriceAmount:p.regularPriceAmount,
    currency:p.currency,promotionText:p.promotionText,
    conditionEvidence:p.conditionEvidence as Prisma.InputJsonValue,sourceUrl:p.sourceUrl,
    ...(p.rawPayload==null?{}:{rawPayload:p.rawPayload as Prisma.InputJsonValue}),
    observedAt:p.observedAt,validFrom:p.validFrom,validUntil:p.validUntil,lastSeenAt:p.observedAt,
  };
}
async function main(){
  if(!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');
  const url=new URL(process.env.DATABASE_URL);
  if(!['localhost','127.0.0.1'].includes(url.hostname)||!['/kavyo_phase_b_test','/kavyo_install_test','/kavyo_dev'].includes(url.pathname))
    throw Error('SAFETY STOP: only approved local Kavyo databases permitted');
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try{
    const db=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if(!['kavyo_phase_b_test','kavyo_install_test','kavyo_dev'].includes(db[0]?.db ?? '')) throw Error('SAFETY STOP: wrong database');
    const src=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    if(!src) throw Error('FLIPP_FLYERS source system not found');
    const before={staged:await prisma.stagedOffer.count(),advertised:await prisma.advertisedOffer.count(),
      products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),
      observations:await prisma.priceObservation.count()};
    const pending=new Map<string,PreparedAdvertisedOffer>();
    const holds:Record<string,number>={};
    let analyzed=0, unpricedReady=0, sameIdentity=0;
    let cursor:string|undefined;
    do{
      const page=await prisma.stagedOffer.findMany({where:{sourceSystemId:src.id},orderBy:{id:'asc'},take:200,
        ...(cursor?{cursor:{id:cursor},skip:1}:{}),
        select:{id:true,sourceSystemId:true,retailerId:true,sourceRecordId:true,recordKey:true,
          productName:true,packageSizeText:true,advertisedPriceAmount:true,regularPriceAmount:true,
          currency:true,promotionText:true,offerComment:true,validFrom:true,validUntil:true,
          observedAt:true,sourceUrl:true,rawPayload:true,normalizedPayload:true,reviewReasons:true,
          isMemberPrice:true,isMultibuy:true,isMultiVariant:true,isPriceRange:true,
          quantityIsApproximate:true,flyerId:true,brand:true,descriptionText:true,
          flyer:{select:{externalId:true,postalCode:true}}}});
      if(!page.length) break;
      for(const row of page){
        analyzed++;
        const elig=checkAdvertisementEligibility({name:row.productName,
          description:row.descriptionText??null,currentPrice:row.advertisedPriceAmount?.toString()??null});
        if(elig.status==='REJECT'){holds['ADVERTISING_BANNER']=(holds['ADVERTISING_BANNER']??0)+1;continue;}
        const scope=classifyGroceryScope({name:row.productName,description:row.descriptionText,brand:row.brand});
        if(scope.status==='OUT_OF_SCOPE'){holds['OUT_OF_SCOPE']=(holds['OUT_OF_SCOPE']??0)+1;continue;}
        const prepared=prepareFlippAdvertisedOffer(row);
        if(prepared.kind==='HOLD'){
          for(const reason of prepared.reasons) holds[reason]=(holds[reason]??0)+1;
          continue;
        }
        if(prepared.offer.advertisedPriceAmount===null) unpricedReady++;
        if(pending.has(prepared.offer.stableKey)){
          sameIdentity++;
          const prev=pending.get(prepared.offer.stableKey)!;
          // Different evidence for same stable identity requires human review;
          // do not quietly pick a capture or invent a preferred price.
          if(prev.advertisedPriceAmount!==prepared.offer.advertisedPriceAmount ||
             prev.productName!==prepared.offer.productName){
            throw Error(`SAFETY STOP: conflicting staged offers share stable identity ${prepared.offer.stableKey}`);
          }
          continue;
        }
        pending.set(prepared.offer.stableKey,prepared.offer);
      }
      cursor=page[page.length-1].id;
    }while(true);
    const stableKeys=[...pending.keys()];
    const existing=new Set<string>();
    for(const group of chunk(stableKeys,500)){
      for(const row of await prisma.advertisedOffer.findMany({where:{stableKey:{in:group}},select:{stableKey:true}}))
        existing.add(row.stableKey);
    }
    const missing=stableKeys.filter(key=>!existing.has(key));
    let inserted=0;
    if(writable){
      await prisma.$transaction(async tx=>{
        await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock(72941, 11626)::text AS locked`);
        // Recheck all source identities after lock: refuse stale or raced write plan.
        for(const group of chunk(stableKeys,500)){
          const actual=await tx.advertisedOffer.findMany({where:{stableKey:{in:group}},select:{stableKey:true}});
          for(const row of actual){
            if(!existing.has(row.stableKey)) throw Error(`SAFETY STOP: changed offer identity ${row.stableKey}; rerun`);
          }
        }
        for(const group of chunk(missing,100)){
          const result=await tx.advertisedOffer.createMany({data:group.map(key=>dataFor(pending.get(key)!)),skipDuplicates:false});
          if(result.count!==group.length) throw Error('SAFETY STOP: missing advertised inserts');
          inserted+=result.count;
        }
      },{maxWait:30000,timeout:300000});
    }
    const after={staged:await prisma.stagedOffer.count(),advertised:await prisma.advertisedOffer.count(),
      products:await prisma.product.count(),evidence:await prisma.productEvidence.count(),
      observations:await prisma.priceObservation.count()};
    if(before.products!==after.products||before.evidence!==after.evidence||before.observations!==after.observations||
      before.staged!==after.staged) throw Error('SAFETY ALERT: unrelated table counts changed');
    const report={mode:writable?'WRITE':'DRY_RUN',database:db[0].db,analyzed,eligibleStaged:stableKeys.length,
      unpricedReady,sameIdentity,alreadyAdvertised:existing.size,toInsert:missing.length,inserted,
      held:holds,before,after,
      notes:['Insert-only promotion: existing advertised offers and product links are never overwritten.',
        'Unpriced ads are eligible. REVIEW scope is retained; confident OUT_OF_SCOPE and banners are held.',
        'No price_observations or canonical products created.',
        'All writes run in a single transaction protected by a cooperative advisory lock.']};
    const folder=resolve('data/research/living-db');await mkdir(folder,{recursive:true});
    await writeFile(join(folder,writable?'flipp-offers-write.json':'flipp-offers-dry-run.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

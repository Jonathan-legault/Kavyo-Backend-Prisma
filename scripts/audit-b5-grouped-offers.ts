/** B5.3 read-only audit; runs against the already imported Flipp offers. */
import 'dotenv/config';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient,Prisma} from '../src/generated/prisma/client.js';
import {interpretFlyerOffer} from '../src/ingestion/living-catalog/offer-eligibility.js';

if(process.argv.some(x=>x==='--write'||x==='--apply'))throw Error('B5.3 audit is READ ONLY');
const limitArg=process.argv.find(x=>x.startsWith('--limit='))?.slice(8);
const limit=limitArg===undefined?0:Number(limitArg);
if(!Number.isSafeInteger(limit)||limit<0)throw Error('Use --limit=N, N >= 0; zero means all');
const url=new URL(process.env.DATABASE_URL || 'postgresql://invalid:invalid@invalid/invalid');
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/kavyo_phase_b_test')
  throw Error('SAFETY STOP: requires local kavyo_phase_b_test');
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
const stageId=(j:Prisma.JsonValue|null):string|null=>{
  if(!j||typeof j!=='object'||Array.isArray(j))return null;
  const v=(j as Record<string,Prisma.JsonValue>).sourceStagedOfferId;
  return typeof v==='string' ? v : null;
};
const csv=(v:unknown):string=>'"'+String(v??'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
const counts=(values:string[])=>Object.fromEntries([...new Set(values)].sort().map(k=>[k,values.filter(x=>x===k).length]));
async function run(){
  try {
    const current=await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if(current[0]?.db!=='kavyo_phase_b_test')throw Error('Wrong database');
    const source=await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    if(!source)throw Error('FLIPP_FLYERS source missing');
    const offers=await prisma.advertisedOffer.findMany({
      where:{sourceSystemId:source.id},orderBy:{id:'asc'},take:limit||undefined,
      select:{id:true,productId:true,productName:true,advertisedPriceAmount:true,promotionText:true,conditionEvidence:true,retailer:{select:{name:true}}},
    });
    const ids=offers.map(x=>stageId(x.conditionEvidence)).filter((x):x is string=>!!x);
    const stages=await prisma.stagedOffer.findMany({where:{id:{in:ids}},select:{id:true,productName:true,brand:true,descriptionText:true,
      packageSizeText:true,advertisedPriceAmount:true,advertisedPriceUnit:true,pricingBasis:true,promotionText:true,offerComment:true,
      isMultiVariant:true,isPriceRange:true,isMemberPrice:true,isMultibuy:true}});
    const byId=new Map(stages.map(x=>[x.id,x]));
    const rows:string[][]=[];
    const coverages:string[]=[];const eligibility:string[]=[];const basis:string[]=[];
    let missingStage=0,linkedGrouped=0,unknownBasis=0;
    for(const offer of offers){
      const stage=byId.get(stageId(offer.conditionEvidence)??'');
      if(!stage){missingStage++;continue;}
      const interpreted=interpretFlyerOffer({productName:stage.productName,brand:stage.brand,
        descriptionText:stage.descriptionText,packageSizeText:stage.packageSizeText,
        advertisedPriceAmount:stage.advertisedPriceAmount?.toString()??null,
        advertisedPriceUnit:stage.advertisedPriceUnit,pricingBasis:stage.pricingBasis,
        promotionText:stage.promotionText??offer.promotionText,offerComment:stage.offerComment,
        isMultiVariant:stage.isMultiVariant,isPriceRange:stage.isPriceRange,
        isMemberPrice:stage.isMemberPrice,isMultibuy:stage.isMultibuy});
      coverages.push(interpreted.coverage);eligibility.push(interpreted.priceEligibility);basis.push(interpreted.sellingPriceBasis);
      if(interpreted.coverage!=='SINGLE_PRODUCT'&&offer.productId)linkedGrouped++;
      if(interpreted.sellingPriceBasis==='UNKNOWN')unknownBasis++;
      rows.push([offer.id,offer.retailer?.name??'',stage.productName,stage.brand??'',stage.descriptionText??'',stage.packageSizeText??'',
        String(interpreted.checkoutPriceAmount??''),stage.advertisedPriceUnit??'',stage.promotionText??'',interpreted.coverage,
        interpreted.canonicalProductAction,interpreted.sellingPriceBasis,interpreted.sellingBasisConfidence,
        interpreted.priceEligibility,interpreted.pricingConditions.join('; '),interpreted.customerComments.join(' | '),
        interpreted.reviewReasons.join('; '),offer.productId??'']);
    }
    const out=resolve('data/research/living-db');await mkdir(out,{recursive:true});
    const headers=['advertised_offer_id','retailer','product_name','brand','description','package_size','advertised_amount','price_label',
      'source_promotion','coverage','product_action','selling_basis','basis_confidence','price_eligibility','pricing_conditions',
      'customer_comments','review_reasons','existing_product_id'];
    await writeFile(join(out,'b5-grouped-offers-review.csv'),[headers,...rows].map(r=>r.map(csv).join(',')).join('\n')+'\n');
    const report={mode:'READ_ONLY',database:current[0].db,analyzed:offers.length,classified:rows.length,missingStage,
      coverageCounts:counts(coverages),priceEligibilityCounts:counts(eligibility),sellingBasisCounts:counts(basis),
      linkedGroupedOffers:linkedGrouped,unknownSellingBasis:unknownBasis,
      warnings:[
        'This audit does not change any database rows or canonical product links.',
        'Pricing basis UNKNOWN does not authorize a basket calculation.',
        'A grouped offer must not be linked to arbitrary individual products or split into invented SKUs.',
        'This preliminary classifier is not wired into any basket or comparison service.',
      ],generatedAt:new Date().toISOString()};
    await writeFile(join(out,'b5-grouped-offers-summary.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally {await prisma.$disconnect();}
}
run().catch(e=>{console.error(e);process.exitCode=1});

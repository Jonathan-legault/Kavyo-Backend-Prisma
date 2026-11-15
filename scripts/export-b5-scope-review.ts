/** B.5 read-only export of Flipp offers held for uncertain grocery scope.
 * Uses the SAME B.4 planner to reproduce SCOPE_REVIEW_NO_CONFIDENT_CATEGORY_SIGNAL.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence } from '../src/ingestion/living-catalog/product-promotion-plan.js';

const REASON = 'SCOPE_REVIEW_NO_CONFIDENT_CATEGORY_SIGNAL';
const outputDir = resolve('data/research/living-db');
const amount = (v: unknown): string => v == null ? '' : String(v);
const csv = (v: unknown): string => {
  let s = amount(v).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  // Prevent Excel/Sheets from interpreting untrusted supplier text as a formula.
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
function stagedOfferId(e: Prisma.JsonValue | null): string | null {
  if (!e || Array.isArray(e) || typeof e !== 'object') return null;
  const v = (e as Record<string, Prisma.JsonValue>).sourceStagedOfferId;
  return typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
}
async function main() {
  if (!process.env.DATABASE_URL) throw Error('Missing DATABASE_URL');
  const url = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/kavyo_phase_b_test')
    throw Error('SAFETY STOP: export only permits localhost/kavyo_phase_b_test');
  const prisma = new PrismaClient({adapter: new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    const db = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
    if (db[0]?.db !== 'kavyo_phase_b_test') throw Error('Wrong database');
    const source = await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'},select:{id:true}});
    if (!source) throw Error('Missing FLIPP_FLYERS source');
    const rows: Array<Record<string,string>> = [];
    let seen = 0, missingStaging = 0;
    let cursor: string | undefined;
    while (true) {
      const offers = await prisma.advertisedOffer.findMany({
        where:{sourceSystemId:source.id}, orderBy:{id:'asc'},take:200,
        ...(cursor ? {cursor:{id:cursor},skip:1}:{}),
        select:{id:true,stableKey:true,sourceSystemId:true,productId:true,retailerId:true,
          advertisedPriceAmount:true,regularPriceAmount:true,currency:true,promotionText:true,
          validFrom:true,validUntil:true,sourceUrl:true,conditionEvidence:true},
      });
      if (!offers.length) break;
      const ids = offers.map(x=>stagedOfferId(x.conditionEvidence)).filter((x):x is string=>x!==null);
      const stages = await prisma.stagedOffer.findMany({
        where:{id:{in:ids},sourceSystemId:source.id},
        select:{id:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,
          quantityValue:true,quantityUnit:true,isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true},
      });
      const byId = new Map(stages.map(x=>[x.id,x]));
      for (const offer of offers) {
        seen++;
        const id = stagedOfferId(offer.conditionEvidence);
        const s = id ? byId.get(id) : undefined;
        if (!s) { missingStaging++; continue; }
        const input: PromotionEvidence = {
          offerId:offer.id,stableKey:offer.stableKey,sourceSystemId:offer.sourceSystemId,
          stagedOfferId:s.id,productName:s.productName,brand:s.brand,
          descriptionText:s.descriptionText,packageSizeText:s.packageSizeText,
          quantityValue:s.quantityValue?.toString()??null,quantityUnit:s.quantityUnit,
          isMultiVariant:s.isMultiVariant,isPriceRange:s.isPriceRange,
          quantityIsApproximate:s.quantityIsApproximate,
        };
        const plan = planProductPromotion(input);
        if (plan.decision !== 'HOLD' || !plan.reasons.includes(REASON)) continue;
        rows.push({
          offer_id:offer.id,
          product_name:amount(s.productName), brand:amount(s.brand),
          description:amount(s.descriptionText), package_size:amount(s.packageSizeText),
          quantity: [amount(s.quantityValue), amount(s.quantityUnit)].filter(Boolean).join(' '),
          advertised_price:amount(offer.advertisedPriceAmount),
          regular_price:amount(offer.regularPriceAmount), currency:amount(offer.currency),
          promotion_text:amount(offer.promotionText), retailer_id:offer.retailerId,
          valid_from:offer.validFrom?.toISOString()??'',valid_until:offer.validUntil?.toISOString()??'',
          source_url:amount(offer.sourceUrl), other_hold_reasons:plan.reasons.filter(x=>x!==REASON).join(' | '),
          reviewer_decision:'', suggested_category:'', reviewer_notes:'',
        });
      }
      cursor=offers[offers.length-1].id;
    }
    // Alphabetical ordering makes review and filtering practical.
    rows.sort((a,b)=>a.product_name.localeCompare(b.product_name)||a.offer_id.localeCompare(b.offer_id));
    await mkdir(outputDir,{recursive:true});
    const columns=['offer_id','product_name','brand','description','package_size','quantity',
      'advertised_price','regular_price','currency','promotion_text','retailer_id',
      'valid_from','valid_until','source_url','other_hold_reasons',
      'reviewer_decision','suggested_category','reviewer_notes'];
    function makeCsv(records:typeof rows) {
      return [columns.map(csv).join(','),...records.map(row=>columns.map(c=>csv(row[c])).join(','))].join('\r\n')+'\r\n';
    }
    const all = join(outputDir,'b5-scope-review-all.csv');
    const sample = join(outputDir,'b5-scope-review-first-50.csv');
    await writeFile(all,makeCsv(rows),'utf8');
    await writeFile(sample,makeCsv(rows.slice(0,50)),'utf8');
    console.log(JSON.stringify({mode:'READ_ONLY',database:db[0].db,advertisementsScanned:seen,
      missingStaging,scopeReviewRows:rows.length,expectedFromPreviousDryRun:514,
      fullCsv:all,sampleCsv:sample,sampleNames:rows.slice(0,15).map(x=>({name:x.product_name,brand:x.brand,description:x.description,package:x.package_size}))},null,2));
  } finally {await prisma.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1});

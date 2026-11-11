/** READ ONLY: reads StagedOffer and Product, writes only local JSON/CSV reports. */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { planProductMatches, summarizeProductDryRun, type StagedProductInput } from '../src/ingestion/product/product-dry-run.js';

function option(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i=0;i<args.length;i++) {
    if (args[i] === `--${name}`) return args[i+1];
    if (args[i].startsWith(`--${name}=`)) return args[i].slice(name.length+3);
  }
  return undefined;
}
function csv(value: unknown): string {
  // Quote cells and neutralize spreadsheet formula injection when opened in Excel.
  const s = String(value ?? '');
  return '"' + (/^[\s]*[=+@\-]/.test(s) ? "'" + s : s).replace(/"/g,'""') + '"';
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const rawLimit = option('limit') ?? '500';
  const limit = Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error('--limit must be a nonnegative integer (0 = all)');
  const batchId = option('batch-id');
  const output = resolve(option('output') ?? 'data/research/flipp/product-matching-dry-run');
  const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    // Product.catalog includes only fields needed by the pure matcher.
    const catalog = await prisma.product.findMany({select:{id:true,productName:true,brand:true,barcode:true,quantityValue:true,quantityUnit:true,quantityText:true}});
    const where = batchId ? {ingestBatchId:batchId} : {};
    const stagedTotal = await prisma.stagedOffer.count({where});
    const records: StagedProductInput[] = [];
    let cursor: string | undefined;
    while (limit === 0 || records.length < limit) {
      const page = await prisma.stagedOffer.findMany({
        where, orderBy:{id:'asc'}, take:Math.min(250,limit===0?250:limit-records.length),
        ...(cursor ? {cursor:{id:cursor},skip:1} : {}),
        select:{id:true,retailerName:true,sourceRecordId:true,status:true,productName:true,brand:true,
          descriptionText:true,packageSizeText:true,quantityValue:true,quantityUnit:true,
          quantityIsApproximate:true,isMultiVariant:true,isPriceRange:true},
      });
      if (!page.length) break;
      records.push(...page);
      cursor = page[page.length-1].id;
    }
    const rows = planProductMatches(records,catalog);
    const summary = {
      input:{batchId:batchId ?? null,limit,stagedTotalAtStart:stagedTotal,catalogProducts:catalog.length},
      ...summarizeProductDryRun(rows),
      generatedAt:new Date().toISOString(),
      warnings:[
        'Read-only run. No Product, StagedOffer or PriceObservation rows were modified.',
        'Barcode matching disabled for staging: no verified GTIN source exists in StagedOffer.',
        'Scope REVIEW rows are not considered automatic product candidates.',
        'Staged product identity may be incomplete. Do not interpret CREATE_CANDIDATE as permission to insert.',
        'No database snapshot isolation is applied: concurrent DB changes can alter results.',
      ],
    };
    mkdirSync(output,{recursive:true});
    writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
    const keys = ['stagedOfferId','retailer','sourceRecordId','stagedStatus','productName','brand','packageText','scopeStatus','scopeReason','decision','productId','matchMethod','candidateGroup','reasons'] as const;
    const content = [keys.map(csv).join(','),...rows.map(row=>keys.map(k=>csv(row[k])).join(','))].join('\n')+'\n';
    writeFileSync(join(output,'product-decisions.csv'),content);
    console.log(JSON.stringify({output,...summary},null,2));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

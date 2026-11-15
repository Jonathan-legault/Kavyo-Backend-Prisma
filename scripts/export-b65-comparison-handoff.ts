/** B.6.5 read-only historical advertised-offer handoff. No database mutations. */
import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw Error('DATABASE_URL is required');
const uri = new URL(connectionString);
if (!['localhost', '127.0.0.1'].includes(uri.hostname) || uri.pathname !== '/kavyo_phase_b_test') {
  throw Error('SAFETY STOP: only local kavyo_phase_b_test is allowed');
}
const capture = resolve('data/research/flipp/2026-11-09T22-22-05-015Z');
const sourcePath = join(capture, 'analysis/b6-historical-preview/source-records.jsonl');
const sourceRows = readFileSync(sourcePath, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line) as {
  sourceRecordId: string; flyerExternalId: string; retailer: string; advertisedPrice: string | null;
});
const key = (flyer: string, record: string) => `${flyer}\u0000${record}`;
const sourceKeys = new Set(sourceRows.filter(x => x.advertisedPrice !== null && Number(x.advertisedPrice) > 0).map(x => key(x.flyerExternalId, x.sourceRecordId)));
if (sourceRows.length !== 5969 || sourceKeys.size !== 5279) throw Error('Historical capture manifest differs from verified B.6 counts');
const out = resolve('data/research/living-db/b65-handoff');
const iso = (d: Date | null) => d?.toISOString() ?? '';
const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""').replaceAll(/\r?\n/g, ' ')}"`;
const writeCsv = (name: string, header: string[], rows: unknown[][]) => {
  writeFileSync(join(out, name), [header.map(csv).join(','), ...rows.map(row => row.map(csv).join(','))].join('\n') + '\n');
};
const decimal = (x: {toString(): string} | null) => x === null ? '' : x.toString();
const flag = (x: unknown) => typeof x === 'object' && x !== null && !Array.isArray(x) ? JSON.stringify(x) : '';
// Remove staging lineage from the grouping key; preserve full evidence in the raw export.
const semanticConditions = (x: unknown) => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return '';
  const clean = Object.fromEntries(Object.entries(x as Record<string, unknown>)
    .filter(([k]) => !['sourceStagedOfferId'].includes(k))
    .sort(([a],[b]) => a.localeCompare(b)));
  return JSON.stringify(clean);
};
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
async function main() {
  const db = await prisma.$queryRaw<Array<{name: string}>>`SELECT current_database() AS name`;
  if (db[0]?.name !== 'kavyo_phase_b_test') throw Error('Unexpected connected DB');
  const source = await prisma.sourceSystem.findUnique({where: {name:'FLIPP_FLYERS'},select:{id:true}});
  if (!source) throw Error('Missing FLIPP_FLYERS source');
  const all = await prisma.advertisedOffer.findMany({
    where: {sourceSystemId: source.id},
    select: {
      id:true, stableKey:true, flyerExternalId:true, sourceRecordId:true, marketKey:true, productId:true,
      storeId:true, retailerId:true, advertisedPriceAmount:true, regularPriceAmount:true, currency:true,
      validFrom:true, validUntil:true, observedAt:true, promotionText:true, conditionEvidence:true, sourceUrl:true,
      retailer:{select:{name:true}},
      product:{select:{id:true,productName:true,brand:true,quantityValue:true,quantityUnit:true,quantityText:true,isActive:true}}
    }
  });
  const offers = all.filter(x => sourceKeys.has(key(x.flyerExternalId,x.sourceRecordId)));
  if (offers.length !== 5279) throw Error(`Expected 5279 historical ads; found ${offers.length}. Aborting export.`);
  const linked = offers.filter(x => x.product?.isActive === true);
  const distinct = new Map<string, typeof linked>();
  for (const a of linked) {
    const k = `${a.productId}\u0000${a.retailerId}`;
    const list = distinct.get(k) ?? []; list.push(a); distinct.set(k, list);
  }
  const products = new Map<string, {productId:string; productName:string; brand:string; package:string; retailerMap:Map<string,typeof linked>}>();
  for (const [pair, list] of distinct) {
    const first = list[0]; const p = first.product!;
    const bucket = products.get(p.id) ?? {productId:p.id,productName:p.productName,brand:p.brand ?? '',package:p.quantityText ?? [decimal(p.quantityValue),p.quantityUnit ?? ''].filter(Boolean).join(' '),retailerMap:new Map<string,typeof linked>()};
    bucket.retailerMap.set(first.retailer.name, list); products.set(p.id, bucket);
  }
  const records = [...products.values()].sort((a,b) => b.retailerMap.size - a.retailerMap.size || a.productName.localeCompare(b.productName));
  const overlap = records.filter(p => p.retailerMap.size >= 2);
  const summaries = records.map(p => {
    const retailerRows = [...p.retailerMap].sort(([a],[b])=>a.localeCompare(b));
    const retailers = retailerRows.map(([name])=>name);
    const representativeOffers = retailerRows.reduce((total,[,o])=>total + o.length,0);
    return [p.productId,p.productName,p.brand,p.package,retailers.length,retailers.join('; '),representativeOffers];
  });
  // Raw historical offer rows are intentionally not deduplicated: they preserve flyer, market and temporal provenance.
  const offerCols = ['productId','productName','brand','quantityText','retailerId','retailerName','storeId','marketKey','advertisedPriceCAD','regularPriceCAD','validFrom','validUntil','observedAt','promotionText','conditionEvidenceJSON','sourceUrl','advertisedOfferId','flyerExternalId','sourceRecordId','stableKey'];
  const offerRows = linked.sort((a,b)=> (a.product?.productName ?? '').localeCompare(b.product?.productName ?? '') || a.retailer.name.localeCompare(b.retailer.name) || a.id.localeCompare(b.id)).map(a=>[
    a.productId,a.product!.productName,a.product!.brand,a.product!.quantityText,a.retailerId,a.retailer.name,a.storeId,a.marketKey,
    decimal(a.advertisedPriceAmount),decimal(a.regularPriceAmount),iso(a.validFrom),iso(a.validUntil),iso(a.observedAt),a.promotionText,
    flag(a.conditionEvidence),a.sourceUrl,a.id,a.flyerExternalId,a.sourceRecordId,a.stableKey
  ]);
  // Representative retailer rows are grouped by product+retailer+market+price+validity+conditions.
  // Never flatten differing prices, regional markets, conditions, or validity windows into one unconditional price.
  const grouped = new Map<string, typeof linked>();
  for (const a of linked) {
    const k = JSON.stringify([a.productId,a.retailerId,a.marketKey,decimal(a.advertisedPriceAmount),decimal(a.regularPriceAmount),iso(a.validFrom),iso(a.validUntil),a.currency,a.promotionText,semanticConditions(a.conditionEvidence)]);
    const list = grouped.get(k)??[];list.push(a);grouped.set(k,list);
  }
  const groupedRows = [...grouped.values()].map(list=>{
    const a=list[0];return [a.productId,a.product!.productName,a.product!.brand,a.product!.quantityText,a.retailer.name,a.marketKey,
      decimal(a.advertisedPriceAmount),decimal(a.regularPriceAmount),iso(a.validFrom),iso(a.validUntil),a.promotionText,flag(a.conditionEvidence),
      list.length,list.map(v=>v.id).join(';'),list.map(v=>v.flyerExternalId).join(';'),list.some(v=>v.storeId!==null) ? 'SOME' : 'NONE'];
  }).sort((a,b)=>String(a[1]).localeCompare(String(b[1])) || String(a[4]).localeCompare(String(b[4])));
  const now=new Date();
  const currentlyValid = linked.filter(a => a.validFrom !== null && a.validUntil !== null && a.validFrom <= now && a.validUntil >= now);
  const retailerCounts = [...new Set(offers.map(a=>a.retailer.name))].sort().map(name=>({retailer:name,allAdvertisements:offers.filter(x=>x.retailer.name===name).length,linkedAdvertisements:linked.filter(x=>x.retailer.name===name).length,distinctProducts:new Set(linked.filter(x=>x.retailer.name===name).map(x=>x.productId)).size}));
  const report={phase:'B6_5',mode:'READ_ONLY',database:db[0].name,capture:'2026-11-09T22-22-05-015Z',generatedAt:now.toISOString(),
    sourceAdvertisements:offers.length,linkedToActiveProduct:linked.length,linkedDistinctProducts:records.length,
    linkedDistinctProductRetailerPairs:distinct.size,productsWithTwoOrMoreRetailers:overlap.length,
    linkedOffersValidAtExportTime:currentlyValid.length,deduplicatedOfferRepresentations:groupedRows.length,
    observedPriceRows:await prisma.priceObservation.count(),retailers:retailerCounts,
    caveats:['This is a historical advertisement export, NOT store-verified shelf prices or an inventory feed',
      'MarketKey and multiple flyer IDs are preserved; repeated postal captures do not count as separate retailers',
      'Product/retailer overlap is based on persisted canonical product links, not loose name or fingerprint matches',
      'No automatic store assignment is made where storeId is null',
      'No advertised offer is assumed applicable to a basket without validity and condition checks',
      'PriceObservation and teammate basket comparison service are untouched']};
  mkdirSync(out,{recursive:true});
  writeCsv('historical-linked-offers.csv',offerCols,offerRows);
  writeCsv('historical-deduplicated-offers.csv', ['productId','productName','brand','quantityText','retailerName','marketKey','advertisedPriceCAD','regularPriceCAD','validFrom','validUntil','promotionText','conditionEvidenceJSON','sourceOfferRows','advertisedOfferIds','flyerExternalIds','storeIdCoverage'],groupedRows);
  writeCsv('canonical-product-retailer-coverage.csv',['productId','productName','brand','quantityText','distinctRetailers','retailers','sourceOfferRows'],summaries);
  writeCsv('cross-retailer-canonical-products.csv',['productId','productName','brand','quantityText','distinctRetailers','retailers','sourceOfferRows'],summaries.filter(row => Number(row[4])>=2));
  writeFileSync(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await prisma.$disconnect()});

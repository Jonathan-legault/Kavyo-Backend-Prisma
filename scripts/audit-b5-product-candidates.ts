/** Read-only B.5.2 candidate-vs-catalog audit. No schema changes or mutations. */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { planProductPromotion, type PromotionEvidence, type ProductPromotionCandidate } from '../src/ingestion/living-catalog/product-promotion-plan.js';

const SOURCE = 'FLIPP_FLYERS';
const PREFIX = 'IDENTITY:';
const outDir = resolve('data/research/living-db');
const asStagedId = (v: Prisma.JsonValue | null): string | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const id = (v as Record<string, Prisma.JsonValue>).sourceStagedOfferId;
  return typeof id === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) ? id : null;
};
const esc = (v: unknown): string => {
  let s = v === null || v === undefined ? '' : String(v);
  // Prevent spreadsheet formula execution when opening exported source text in Excel.
  if (/^[\s\uFEFF]*[=+@\-\t\r]/u.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g,'""') + '"';
};
const csv = (headers: string[], rows: Record<string,unknown>[]): string =>
  '\uFEFF' + headers.map(esc).join(',') + '\r\n' + rows.map(r => headers.map(k=>esc(r[k])).join(',')).join('\r\n') + '\r\n';

type Entry = {plan: ProductPromotionCandidate; offerId: string; linkedProductId: string|null;
  price: string|null; description: string|null; validFrom: string|null; validUntil: string|null};

async function main() {
  const urlText = process.env.DATABASE_URL;
  if (!urlText) throw Error('DATABASE_URL is missing');
  const u = new URL(urlText);
  if (!['localhost','127.0.0.1'].includes(u.hostname) || u.pathname !== '/kavyo_phase_b_test')
    throw Error('SAFETY STOP: audit only allowed on localhost/kavyo_phase_b_test');
  const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:urlText})});
  try {
    const db = await prisma.$queryRaw<Array<{db:string}>>`SELECT current_database() AS db`;
    if (db[0]?.db !== 'kavyo_phase_b_test') throw Error('SAFETY STOP: connected to wrong DB');
    const source = await prisma.sourceSystem.findUnique({where:{name:SOURCE},select:{id:true}});
    if (!source) throw Error('SourceSystem FLIPP_FLYERS missing');
    const identityEvidence = await prisma.productEvidence.findMany({
      where:{sourceSystemId:source.id,evidenceType:'CANONICAL_IDENTITY',sourceRecordId:{startsWith:PREFIX}},
      select:{sourceRecordId:true,productId:true},
    });
    const evidenceByFingerprint = new Map<string,Set<string>>();
    for (const e of identityEvidence) {
      const fp=e.sourceRecordId.slice(PREFIX.length);
      const ids=evidenceByFingerprint.get(fp)??new Set<string>();ids.add(e.productId);evidenceByFingerprint.set(fp,ids);
    }
    const groups = new Map<string, Entry[]>();
    const rejectedLinked: Array<{offerId:string;productId:string;reasons:string}> = [];
    const missingStaging:string[]=[];
    const reasonCounts = new Map<string,number>();
    let total=0, eligible=0, held=0, linkedAtStart=0;
    let cursor:string|undefined;
    for (;;) {
      const offers=await prisma.advertisedOffer.findMany({
        where:{sourceSystemId:source.id},orderBy:{id:'asc'},take:200,
        ...(cursor?{cursor:{id:cursor},skip:1}:{}),
        select:{id:true,stableKey:true,sourceSystemId:true,productId:true,
          conditionEvidence:true,advertisedPriceAmount:true,validFrom:true,validUntil:true},
      });
      if (!offers.length) break;
      const stagedIds=offers.map(o=>asStagedId(o.conditionEvidence)).filter((x):x is string=>x!==null);
      const rows=await prisma.stagedOffer.findMany({
        where:{sourceSystemId:source.id,id:{in:stagedIds}},
        select:{id:true,productName:true,brand:true,descriptionText:true,packageSizeText:true,
          quantityValue:true,quantityUnit:true,isMultiVariant:true,isPriceRange:true,quantityIsApproximate:true},
      });
      const byId=new Map(rows.map(r=>[r.id,r]));
      for (const o of offers) {
        total++;
        if (o.productId) linkedAtStart++;
        const sid=asStagedId(o.conditionEvidence);
        const r=sid ? byId.get(sid) : undefined;
        if (!r) { missingStaging.push(o.id);continue; }
        const evidence:PromotionEvidence={
          offerId:o.id,stableKey:o.stableKey,sourceSystemId:o.sourceSystemId,stagedOfferId:r.id,
          productName:r.productName,brand:r.brand,descriptionText:r.descriptionText,
          packageSizeText:r.packageSizeText,quantityValue:r.quantityValue?.toString()??null,
          quantityUnit:r.quantityUnit,isMultiVariant:r.isMultiVariant,
          isPriceRange:r.isPriceRange,quantityIsApproximate:r.quantityIsApproximate,
        };
        const p=planProductPromotion(evidence);
        if (p.decision==='HOLD') {
          held++;
          for (const reason of p.reasons)reasonCounts.set(reason,(reasonCounts.get(reason)??0)+1);
          if (o.productId) rejectedLinked.push({offerId:o.id,productId:o.productId,reasons:p.reasons.join(' | ')});
          continue;
        }
        eligible++;
        const group=groups.get(p.fingerprint)??[];
        group.push({plan:p,offerId:o.id,linkedProductId:o.productId,
          price:o.advertisedPriceAmount?.toString()??null,description:r.descriptionText,
          validFrom:o.validFrom?.toISOString()??null,validUntil:o.validUntil?.toISOString()??null});
        groups.set(p.fingerprint,group);
      }
      cursor=offers[offers.length-1].id;
    }
    const detailed:Record<string,unknown>[]=[];
    const newRows:Record<string,unknown>[]=[];
    const anomalies:Record<string,unknown>[]=[];
    let reused=0, newIdentities=0, matchedOfferRows=0, newOfferRows=0;
    const fingerprints=[...groups.keys()].sort();
    for (const fp of fingerprints) {
      const items=groups.get(fp)!;
      const currentIds=evidenceByFingerprint.get(fp)??new Set<string>();
      const linkedIds=new Set(items.map(x=>x.linkedProductId).filter((x):x is string=>!!x));
      const status=currentIds.size===1?'EXISTING_IDENTITY':currentIds.size===0?'NEW_IDENTITY':'DUPLICATE_IDENTITY_EVIDENCE';
      if (status==='EXISTING_IDENTITY')reused++; else if(status==='NEW_IDENTITY')newIdentities++;
      if (status==='EXISTING_IDENTITY')matchedOfferRows+=items.length; else if(status==='NEW_IDENTITY')newOfferRows+=items.length;
      const issues:string[]=[];
      if(currentIds.size>1)issues.push('MULTIPLE_PRODUCTS_FOR_ONE_FINGERPRINT');
      if(linkedIds.size>1)issues.push('MULTIPLE_LINKED_PRODUCTS_IN_GROUP');
      if(currentIds.size===0 && linkedIds.size>0)issues.push('LINKED_OFFERS_WITHOUT_IDENTITY_EVIDENCE');
      if(currentIds.size===1 && [...linkedIds].some(id=>!currentIds.has(id)))issues.push('LINKED_PRODUCT_CONTRADICTS_FINGERPRINT');
      const seed=items[0];
      const record:Record<string,unknown>={
        status,fingerprint:fp,productName:seed.plan.productName,brand:seed.plan.brand,
        quantityText:seed.plan.quantityText,quantityValue:seed.plan.quantityValue,
        quantityUnit:seed.plan.quantityUnit,scopeCategory:seed.plan.scopeCategory,
        offerCount:items.length,linkedOfferCount:items.filter(x=>x.linkedProductId).length,
        productId:[...currentIds].join(' | '),linkedProductIds:[...linkedIds].join(' | '),
        offerIds:items.map(x=>x.offerId).join(' | '),
        advertisedPrices:[...new Set(items.map(x=>x.price??'UNKNOWN'))].join(' | '),
        descriptions:[...new Set(items.map(x=>x.description??''))].join(' | '),
        validFrom:items.map(x=>x.validFrom).filter(Boolean).sort()[0]??null,
        validUntil:items.map(x=>x.validUntil).filter(Boolean).sort().at(-1)??null,
        issues:issues.join(' | '),reviewDecision:'',reviewNotes:'',
      };
      detailed.push(record);
      if(status==='NEW_IDENTITY')newRows.push(record);
      if(issues.length)anomalies.push(record);
    }
    const headers=['status','fingerprint','productName','brand','quantityText','quantityValue','quantityUnit','scopeCategory',
      'offerCount','linkedOfferCount','productId','linkedProductIds','offerIds','advertisedPrices','descriptions','validFrom','validUntil','issues','reviewDecision','reviewNotes'];
    const summary={
      database:db[0].db,mode:'READ_ONLY',generatedAt:new Date().toISOString(),
      totalAdvertisedFlippOffers:total,eligibleOfferRows:eligible,distinctCandidateIdentities:groups.size,
      existingIdentityFingerprints:reused,newIdentityFingerprints:newIdentities,
      eligibleRowsWithExistingFingerprint:matchedOfferRows,eligibleRowsWithNewFingerprint:newOfferRows,
      linkedOffersAtStart:linkedAtStart,heldOfferRows:held,missingStaging:missingStaging.length,
      evidenceIdentityCount:identityEvidence.length,anomalousCandidateIdentities:anomalies.length,
      previouslyLinkedButNowHeld:rejectedLinked.length,
      holdReasonCounts:Object.fromEntries([...reasonCounts].sort((a,b)=>b[1]-a[1])),
      caveats:[
        'New means fingerprint not found in ProductEvidence, NOT necessarily a SKU never seen before.',
        'Compare names and variants manually in new-candidates.csv before any write.',
        'Previously linked but now held indicates classifier drift; no links are removed by this audit.',
        'This script makes no database mutations.',
      ],
    };
    await mkdir(outDir,{recursive:true});
    await Promise.all([
      writeFile(join(outDir,'b5-all-candidates.csv'),csv(headers,detailed),'utf8'),
      writeFile(join(outDir,'b5-new-candidates.csv'),csv(headers,newRows),'utf8'),
      writeFile(join(outDir,'b5-candidate-anomalies.csv'),csv(headers,anomalies),'utf8'),
      writeFile(join(outDir,'b5-linked-now-held.csv'),csv(['offerId','productId','reasons'],rejectedLinked),'utf8'),
      writeFile(join(outDir,'b5-candidate-diff-summary.json'),JSON.stringify(summary,null,2)+'\n','utf8'),
    ]);
    console.log(JSON.stringify(summary,null,2));
    console.log(`Reports saved under ${outDir}`);
  } finally { await prisma.$disconnect(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

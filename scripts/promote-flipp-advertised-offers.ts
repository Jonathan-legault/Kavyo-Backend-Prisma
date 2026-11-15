/** Flipp StagedOffer -> AdvertisedOffer. Defaults to READ ONLY. --write explicitly enables upserts.
 * Guarded to run ONLY against the isolated kavyo_phase_b_test PostgreSQL database.
 * No Product, StagedOffer, or PriceObservation rows are changed.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client.js';
import { prepareFlippAdvertisedOffer, type PreparedAdvertisedOffer } from '../src/ingestion/living-catalog/staged-offer-promotion.js';

const args = process.argv.slice(2);
const writable = args.includes('--write');
const readOption = (name: string) => {
  const index = args.indexOf('--' + name);
  if (index >= 0) return args[index + 1];
  return args.find(a => a.startsWith('--' + name + '='))?.slice(name.length + 3);
};
const limit = Number(readOption('limit') ?? '0');
if (!Number.isSafeInteger(limit) || limit < 0) throw new Error('Use --limit <integer>, 0 means all');

function recordData(p: PreparedAdvertisedOffer) {
  return {
    sourceSystemId: p.sourceSystemId,
    retailerId: p.retailerId,
    flyerId: p.flyerId,
    flyerExternalId: p.flyerExternalId,
    sourceRecordId: p.sourceRecordId,
    marketKey: p.marketKey,
    productName: p.productName,
    packageSizeText: p.packageSizeText,
    advertisedPriceAmount: p.advertisedPriceAmount,
    regularPriceAmount: p.regularPriceAmount,
    currency: p.currency,
    promotionText: p.promotionText,
    conditionEvidence: p.conditionEvidence as Prisma.InputJsonValue,
    sourceUrl: p.sourceUrl,
    ...(p.rawPayload == null ? {} : { rawPayload: p.rawPayload as Prisma.InputJsonValue }),
    observedAt: p.observedAt,
    validFrom: p.validFrom,
    validUntil: p.validUntil,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL missing');
  const u = new URL(process.env.DATABASE_URL);
  if (u.pathname !== '/kavyo_phase_b_test' || !['localhost','127.0.0.1'].includes(u.hostname)) {
    throw Error('SAFETY STOP: This importer only permits localhost/kavyo_phase_b_test');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const db = await prisma.$queryRaw<Array<{db: string}>>`SELECT current_database() AS db`;
    if (db[0]?.db !== 'kavyo_phase_b_test') throw Error('SAFETY STOP: current_database() mismatch');
    const source = await prisma.sourceSystem.findUnique({where:{name:'FLIPP_FLYERS'}, select:{id:true}});
    if (!source) throw Error('FLIPP_FLYERS SourceSystem not found');
    const count = await prisma.stagedOffer.count({where:{sourceSystemId:source.id}});
    const before = await Promise.all([
      prisma.product.count(), prisma.priceObservation.count(), prisma.stagedOffer.count(), prisma.advertisedOffer.count(),
    ]);
    const seen = new Set<string>();
    const holds: Array<{stagedOfferId:string;reasons:string[]}> = [];
    let analyzed=0, ready=0, duplicateInputs=0, created=0, updated=0;
    let cursor: string | undefined;
    const now = new Date();
    while (limit === 0 || analyzed < limit) {
      const page = await prisma.stagedOffer.findMany({
        where:{sourceSystemId:source.id}, orderBy:{id:'asc'}, take:Math.min(200, limit===0?200:limit-analyzed),
        ...(cursor?{cursor:{id:cursor},skip:1}:{}),
        select:{id:true,sourceSystemId:true,retailerId:true,sourceRecordId:true,recordKey:true,productName:true,
          packageSizeText:true,advertisedPriceAmount:true,regularPriceAmount:true,currency:true,promotionText:true,
          offerComment:true,validFrom:true,validUntil:true,observedAt:true,sourceUrl:true,rawPayload:true,
          normalizedPayload:true,reviewReasons:true,isMemberPrice:true,isMultibuy:true,isMultiVariant:true,
          isPriceRange:true,quantityIsApproximate:true,flyerId:true,
          flyer:{select:{externalId:true,postalCode:true}}},
      });
      if (!page.length) break;
      for (const row of page) {
        analyzed++;
        const result = prepareFlippAdvertisedOffer(row);
        if (result.kind === 'HOLD') { holds.push({stagedOfferId:result.stagedOfferId,reasons:result.reasons}); continue; }
        ready++;
        const p = result.offer;
        if (seen.has(p.stableKey)) duplicateInputs++;
        seen.add(p.stableKey);
        if (!writable) continue;
        const existed = await prisma.advertisedOffer.findUnique({where:{stableKey:p.stableKey},select:{id:true}});
        const data = recordData(p);
        await prisma.advertisedOffer.upsert({
          where:{stableKey:p.stableKey},
          create:{...data,stableKey:p.stableKey,lastSeenAt:now},
          update:{...data,lastSeenAt:now},
        });
        if (existed) updated++; else created++;
      }
      cursor=page[page.length-1].id;
    }
    const after = await Promise.all([
      prisma.product.count(), prisma.priceObservation.count(), prisma.stagedOffer.count(), prisma.advertisedOffer.count(),
    ]);
    if (before.slice(0,3).some((v,i)=>v!==after[i])) {
      throw Error('SAFETY ALERT: unrelated table count changed during execution; inspect concurrent processes');
    }
    const report = {
      mode:writable?'WRITE':'DRY_RUN', database:db[0].db, totalFlippStaged:count, analyzed,
      ready, held:holds.length, uniqueOfferKeys:seen.size, duplicateInputKeys:duplicateInputs,
      created, updated,
      before:{products:before[0],priceObservations:before[1],stagedOffers:before[2],advertisedOffers:before[3]},
      after:{products:after[0],priceObservations:after[1],stagedOffers:after[2],advertisedOffers:after[3]},
      holds:holds.slice(0,100),
      generatedAt:new Date().toISOString(),
      notes:[
        'No canonical products created or matched; Product IDs intentionally remain null.',
        'Input filtering uses SourceSystem FLIPP_FLYERS, not staged status.',
        'This imports advertised claims, not verified shelf prices or inventory.',
        'A repeated source item with a changed price updates the same stable key; offer revisions are not yet append-only.',
      ],
    };
    const dir=resolve('data/research/living-db');
    await mkdir(dir,{recursive:true});
    await writeFile(join(dir,writable?'flipp-offers-write.json':'flipp-offers-dry-run.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally { await prisma.$disconnect(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

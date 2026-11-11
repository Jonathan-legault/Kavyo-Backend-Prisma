import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

/** Read-only relational audit. NEVER deletes, inserts, or modifies database rows. */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const [links] = await prisma.$queryRaw<Array<{
      totalProducts: number; basketLinked: number; priceLinked: number;
      stagedLinked: number; linkedToAny: number; noKnownLinks: number;
    }>>`
      SELECT COUNT(*)::integer AS "totalProducts",
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM basket_items b WHERE b.product_id=p.id))::integer AS "basketLinked",
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM price_observations po WHERE po.product_id=p.id))::integer AS "priceLinked",
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM staged_offers so WHERE so.matched_product_id=p.id))::integer AS "stagedLinked",
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM basket_items b WHERE b.product_id=p.id)
          OR EXISTS (SELECT 1 FROM price_observations po WHERE po.product_id=p.id)
          OR EXISTS (SELECT 1 FROM staged_offers so WHERE so.matched_product_id=p.id))::integer AS "linkedToAny",
        COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM basket_items b WHERE b.product_id=p.id)
          AND NOT EXISTS (SELECT 1 FROM price_observations po WHERE po.product_id=p.id)
          AND NOT EXISTS (SELECT 1 FROM staged_offers so WHERE so.matched_product_id=p.id))::integer AS "noKnownLinks"
      FROM products p
    `;
    const foreignKeys = await prisma.$queryRaw<Array<{ childTable: string; constraintName: string }>>`
      SELECT conrelid::regclass::text AS "childTable", conname AS "constraintName"
      FROM pg_constraint WHERE contype='f' AND confrelid='products'::regclass ORDER BY 1
    `;
    const [stagedOffers, priceObservations, basketItems, sourceSystems, byPriceSource, byStagedSource] = await Promise.all([
      prisma.stagedOffer.count(), prisma.priceObservation.count(), prisma.basketItem.count(),
      prisma.sourceSystem.findMany({ select: { id:true,name:true,sourceType:true } }),
      prisma.priceObservation.groupBy({ by:["sourceSystemId"], _count:{ _all:true } }),
      prisma.stagedOffer.groupBy({ by:["sourceSystemId"], _count:{ _all:true } }),
    ]);
    const sources = new Map(sourceSystems.map(s => [s.id,s.name]));
    const report = {
      generatedAt: new Date().toISOString(), links, foreignKeys,
      totals: { stagedOffers, priceObservations, basketItems }, sourceSystems,
      priceObservationsBySource: byPriceSource.map(x => ({ source:sources.get(x.sourceSystemId)??x.sourceSystemId,count:x._count._all })),
      stagedOffersBySource: byStagedSource.map(x => ({ source:sources.get(x.sourceSystemId)??x.sourceSystemId,count:x._count._all })),
      warnings: [
        "READ ONLY. No products were modified.",
        "Product has no direct provenance field. Unlinked does NOT prove Open Food Facts origin.",
        "Never delete from this audit alone; inspect all dependencies and back up first."
      ],
    };
    const dir=resolve("data/research/living-db");
    await mkdir(dir,{recursive:true});
    await writeFile(resolve(dir,"catalog-audit.json"),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify(report,null,2));
  } finally { await prisma.$disconnect(); }
}
main().catch(err=>{console.error(err);process.exitCode=1;});

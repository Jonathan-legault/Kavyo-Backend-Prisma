import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

/** Read-only staging quality audit; no product creation or offer promotion. */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const byReason = new Map<string, number>();
  const byRetailer = new Map<string, { total: number; missingPrice: number; missingRegularPrice: number;
    missingPackage: number; missingBrand: number; grouped: number; dateMissing: number; matched: number }>();
  let total = 0;
  try {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.stagedOffer.findMany({
        take: 500, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: "asc" },
        select: {
          id: true, retailerName: true, productName: true, brand: true, packageSizeText: true,
          advertisedPriceAmount: true, regularPriceAmount: true, isMultiVariant: true,
          reviewReasons: true, validFrom: true, validUntil: true, matchedProductId: true,
        },
      });
      if (!rows.length) break;
      for (const row of rows) {
        total++;
        const counts = byRetailer.get(row.retailerName) ?? {
          total: 0, missingPrice: 0, missingRegularPrice: 0, missingPackage: 0,
          missingBrand: 0, grouped: 0, dateMissing: 0, matched: 0,
        };
        counts.total++;
        if (row.advertisedPriceAmount === null) counts.missingPrice++;
        if (row.regularPriceAmount === null) counts.missingRegularPrice++;
        if (!row.packageSizeText?.trim()) counts.missingPackage++;
        if (!row.brand?.trim()) counts.missingBrand++;
        if (row.isMultiVariant) counts.grouped++;
        if (!row.validFrom || !row.validUntil) counts.dateMissing++;
        if (row.matchedProductId) counts.matched++;
        byRetailer.set(row.retailerName, counts);
        const reasons = Array.isArray(row.reviewReasons) ? row.reviewReasons : [];
        for (const reason of new Set(reasons.filter((x): x is string => typeof x === "string"))) {
          byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
        }
      }
      cursor = rows[rows.length - 1].id;
    }
    const report = {
      generatedAt: new Date().toISOString(), total,
      retailers: [...byRetailer.entries()].map(([retailer, stats]) => ({ retailer, ...stats }))
        .sort((a,b) => b.total-a.total),
      reviewReasons: [...byReason.entries()].map(([reason, count]) => ({ reason, count }))
        .sort((a,b) => b.count-a.count),
      caveats: [
        "This describes existing StagedOffer data; it does not recalculate product scope.",
        "No source item detail is verified here; grouped offers may advertise several SKU variants.",
        "Missing regular price and missing package size are not reasons to discard the original offer.",
        "Read-only: no rows were modified.",
      ],
    };
    const dir = resolve("data/research/living-db");
    await mkdir(dir,{recursive:true});
    await writeFile(resolve(dir,"staging-quality.json"),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify(report,null,2));
  } finally { await prisma.$disconnect(); }
}
main().catch(err=>{console.error(err);process.exitCode=1;});

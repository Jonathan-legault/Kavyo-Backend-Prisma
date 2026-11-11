import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

/**
 * Read-only Phase B audit. A price observation's source does NOT establish
 * the source of its related canonical Product record.
 *
 * Usage: npx tsx scripts/phase-b-audit-catalog.ts
 *        npx tsx scripts/phase-b-audit-catalog.ts --out data/research/phase-b/catalog-audit.json
 */
async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Verify the DEVELOPMENT database before running.");
  }
  const outFlag = process.argv.indexOf("--out");
  const out = outFlag >= 0 ? process.argv[outFlag + 1] : undefined;
  if (outFlag >= 0 && !out) throw new Error("--out requires a file path");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const [
      products,
      productsWithPriceObservations,
      productsWithBasketItems,
      productsWithStagedOffers,
      productsWithAnyDependencies,
      missingBarcodes,
      stagedOffers,
      priceObservations,
      basketItems,
      stagedLinked,
      sourceSystems,
      bySource,
      sampleProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { priceObservations: { some: {} } } }),
      prisma.product.count({ where: { basketItems: { some: {} } } }),
      prisma.product.count({ where: { stagedOffers: { some: {} } } }),
      prisma.product.count({ where: { OR: [
        { priceObservations: { some: {} } },
        { basketItems: { some: {} } },
        { stagedOffers: { some: {} } },
      ] } }),
      prisma.product.count({ where: { barcode: "" } }),
      prisma.stagedOffer.count(),
      prisma.priceObservation.count(),
      prisma.basketItem.count(),
      prisma.stagedOffer.count({ where: { matchedProductId: { not: null } } }),
      prisma.sourceSystem.findMany({ select: { id: true, name: true, sourceType: true } }),
      prisma.priceObservation.groupBy({ by: ["sourceSystemId"], _count: { _all: true } }),
      prisma.product.findMany({
        take: 15, orderBy: { createdAt: "asc" },
        select: { id: true, barcode: true, productName: true, brand: true, createdAt: true },
      }),
    ]);
    const sourceNames = new Map(sourceSystems.map((s) => [s.id, s.name]));
    const report = {
      generatedAt: new Date().toISOString(),
      mode: "READ_ONLY",
      totals: { products, stagedOffers, priceObservations, basketItems },
      productReferences: {
        productsWithPriceObservations,
        productsWithBasketItems,
        productsWithStagedOffers,
        productsWithAnyDependencies,
        productsWithoutTrackedDependencies: products - productsWithAnyDependencies,
        stagedOffersLinkedToProducts: stagedLinked,
      },
      catalog: { emptyBarcodeStrings: missingBarcodes, sampleProducts },
      observationSources: bySource.map((s) => ({
        sourceSystem: sourceNames.get(s.sourceSystemId) ?? s.sourceSystemId,
        observationRows: s._count._all,
      })),
      warnings: [
        "Product has no direct source/provenance field in the current schema.",
        "Open Food Facts ownership CANNOT be inferred safely from a barcode or a price observation's source.",
        "Unreferenced products are NOT automatically safe to delete: historical and external uses require review.",
        "No database rows were created, updated or deleted.",
      ],
    };
    const json = JSON.stringify(report, null, 2);
    console.log(json);
    if (out) {
      const path = resolve(out);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, json + "\n", "utf8");
      console.log("Wrote audit: " + path);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

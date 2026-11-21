import { PrismaService } from "./src/prisma/prisma.service.js";

async function main() {
  const prisma = new PrismaService();

  try {
    await prisma.$connect();

    const rows = await prisma.stagedOffer.findMany({
      where: {
        sourceRecordId: "1049922614",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        ingestBatchId: true,
        retailerName: true,
        productName: true,
        advertisedPriceText: true,
        advertisedPriceAmount: true,
        promotionType: true,
        promotionQuantity: true,
        rawPayload: true,
      },
    });

    const result = rows.map((row) => {
      const raw = row.rawPayload as any;
      const item = raw?.item;
      const detail = raw?.detail;

      return {
        id: row.id,
        ingestBatchId: row.ingestBatchId,
        retailerName: row.retailerName,
        productName: row.productName,
        advertisedPriceText: row.advertisedPriceText,
        advertisedPriceAmount: row.advertisedPriceAmount,
        promotionType: row.promotionType,
        promotionQuantity: row.promotionQuantity,
        originalItem: {
          name: item?.name,
          price: item?.price,
          availableFields: item ? Object.keys(item) : [],
        },
        originalDetail: {
          description: detail?.description,
          sale_story: detail?.sale_story,
          price_text: detail?.price_text,
          disclaimer_text: detail?.disclaimer_text,
          current_price_range: detail?.current_price_range,
          original_price_range: detail?.original_price_range,
          availableFields: detail ? Object.keys(detail) : [],
        },
      };
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

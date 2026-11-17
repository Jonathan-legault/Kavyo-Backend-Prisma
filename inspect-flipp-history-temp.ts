import { PrismaService } from "./src/prisma/prisma.service.ts";

async function main() {
  const prisma = new PrismaService();

  try {
    await prisma.$connect();

    const rows = await prisma.stagedOffer.findMany({
      where: { sourceRecordId: "1049922614" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        ingestBatchId: true,
        createdAt: true,
        promotionType: true,
        promotionQuantity: true,
        normalizedPayload: true,
      },
    });

    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // -----------------------
  // Roles
  // -----------------------

  const roles = [
    {
      name: "USER",
      description: "Standard Kavyo application user",
    },
    {
      name: "ADMIN",
      description: "Administrative access to Kavyo",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  // -----------------------
  // Source systems
  // -----------------------

  const sourceSystems = [
    {
      name: "OPEN_FOOD_FACTS",
      sourceType: "PRODUCT_CATALOG",
      baseUrl: "https://world.openfoodfacts.org",
    },
    {
      name: "OPEN_PRICES",
      sourceType: "PRICE_DATA",
      baseUrl: "https://prices.openfoodfacts.org",
    },
    {
      name: "MANUAL_IMPORT",
      sourceType: "MANUAL",
      baseUrl: null,
    },
    {
      name: "SAVE_ON_FOODS_WEB",
      sourceType: "RETAILER_WEBSITE",
      baseUrl: "https://www.saveonfoods.com",
    },
    {
      name: "REAL_CANADIAN_SUPERSTORE_WEB",
      sourceType: "RETAILER_WEBSITE",
      baseUrl: "https://www.realcanadiansuperstore.ca",
    },
    {
      name: "SOBEYS_WEB",
      sourceType: "RETAILER_WEBSITE",
      baseUrl: "https://www.sobeys.com",
    },
  ];

  for (const source of sourceSystems) {
    await prisma.sourceSystem.upsert({
      where: { name: source.name },
      update: {
        sourceType: source.sourceType,
        baseUrl: source.baseUrl,
        isActive: true,
      },
      create: {
        ...source,
        isActive: true,
      },
    });
  }

  // -----------------------
  // Retailers and test stores
  // -----------------------

  const retailerData = [
    {
      name: "Real Canadian Superstore",
      website: "https://www.realcanadiansuperstore.ca",
      store: {
        name: "Real Canadian Superstore Seton Way",
        address: "19655 Seton Way SE",
        city: "Calgary",
        province: "AB",
        postalCode: "T3M 2N9",
      },
    },
    {
      name: "Save-On-Foods",
      website: "https://www.saveonfoods.com",
      store: {
        name: "Save-On-Foods Seton",
        address: "19489 Seton Crescent SE #130",
        city: "Calgary",
        province: "AB",
        postalCode: "T3M 1T4",
      },
    },
    {
      name: "Sobeys",
      website: "https://www.sobeys.com",
      store: {
        name: "Sobeys Mahogany",
        address: "7 Mahogany Plaza SE #1200",
        city: "Calgary",
        province: "AB",
        postalCode: "T3M 2P8",
      },
    },
  ];

  for (const item of retailerData) {
    const retailer = await prisma.retailer.upsert({
      where: {
        name: item.name,
      },
      update: {
        website: item.website,
        isActive: true,
      },
      create: {
        name: item.name,
        website: item.website,
        isActive: true,
      },
    });

    const existingStore = await prisma.store.findFirst({
      where: {
        retailerId: retailer.id,
        address: item.store.address,
      },
    });

    if (existingStore) {
      await prisma.store.update({
        where: {
          id: existingStore.id,
        },
        data: {
          name: item.store.name,
          city: item.store.city,
          province: item.store.province,
          postalCode: item.store.postalCode,
          isActive: true,
        },
      });
    } else {
      await prisma.store.create({
        data: {
          retailerId: retailer.id,
          name: item.store.name,
          address: item.store.address,
          city: item.store.city,
          province: item.store.province,
          postalCode: item.store.postalCode,
          isActive: true,
        },
      });
    }
  }

  console.log("Kavyo seed completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

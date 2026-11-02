import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { ingestFlyers } from "../src/flyers/ingestion/flyer-ingestion.js";

interface CliOptions {
  postalCode: string;
  locale: string;
  concurrency: number;
  flyerIds: number[] | undefined;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  try {
    const result = await ingestFlyers(prisma, {
      postalCode: options.postalCode,
      locale: options.locale,
      concurrency: options.concurrency,
      flyerIds: options.flyerIds,
      onProgress: (message) => console.log(message),
    });

    console.log("\nFlyer ingestion completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

function parseArgs(args: string[]): CliOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      values.set(rawKey, inlineValue);
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(rawKey, next);
      index += 1;
    } else {
      values.set(rawKey, "true");
    }
  }

  if (values.has("help")) {
    console.log(
      [
        "Usage: npm run ingest:flyers -- [options]",
        "",
        "Options:",
        "  --postal-code <code>   Flyer retrieval postal code (default: T3M 1T4)",
        "  --locale <locale>      Flipp locale (default: en-ca)",
        "  --concurrency <n>      Concurrent item-detail requests (default: 4)",
        "  --flyer-ids <ids>      Optional comma-separated Flipp flyer IDs",
      ].join("\n"),
    );
    process.exit(0);
  }

  const flyerIdsValue = values.get("flyer-ids");
  const flyerIds = flyerIdsValue
    ? flyerIdsValue
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    : undefined;

  const concurrency = Number(values.get("concurrency") ?? "4");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12) {
    throw new Error("--concurrency must be an integer between 1 and 12");
  }

  return {
    postalCode: values.get("postal-code") ?? process.env.FLYER_POSTAL_CODE ?? "T3M 1T4",
    locale: values.get("locale") ?? "en-ca",
    concurrency,
    flyerIds,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

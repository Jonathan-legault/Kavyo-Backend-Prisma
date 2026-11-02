import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { FlippClient } from "../flipp/flipp.client.js";
import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from "../flipp/flipp.types.js";
import {
  normalizeFlyerOffer,
  type NormalizedFlyerOffer,
} from "../normalization/flyer-normalizer.js";
import {
  FLYER_RETAILERS,
  FLYER_SOURCE_BASE_URL,
  FLYER_SOURCE_SYSTEM_NAME,
  findFlyerRetailerByMerchantId,
} from "./retailers.js";

const GROCERY_CATEGORY_PATTERN = /grocer/i;
const CREATE_MANY_CHUNK_SIZE = 100;

export interface IngestFlyersOptions {
  postalCode?: string;
  locale?: string;
  concurrency?: number;
  requestDelayMs?: number;
  flyerIds?: number[];
  now?: Date;
  onProgress?: (message: string) => void;
}

export interface IngestedFlyerSummary {
  externalId: number;
  name: string;
  retailerName: string;
  totalItems: number;
  pricedItems: number;
  normalizedOffers: number;
  normalizedStatus: number;
  pendingReview: number;
}

export interface IngestFlyersResult {
  batchId: string;
  postalCode: string;
  startedAt: string;
  completedAt: string;
  recordsRead: number;
  recordsInserted: number;
  recordsRejected: number;
  normalizedStatus: number;
  pendingReview: number;
  missingRetailers: string[];
  flyers: IngestedFlyerSummary[];
}

interface SelectedFlyer {
  flyer: FlippFlyer;
  retailerName: string;
  retailerId: string;
}

export async function ingestFlyers(
  prisma: PrismaClient,
  options: IngestFlyersOptions = {},
): Promise<IngestFlyersResult> {
  const postalCode = normalizePostalCode(options.postalCode ?? "T3M 1T4");
  const now = options.now ?? new Date();
  const startedAt = new Date();
  const log = options.onProgress ?? (() => undefined);

  const sourceSystem = await prisma.sourceSystem.upsert({
    where: { name: FLYER_SOURCE_SYSTEM_NAME },
    update: {
      sourceType: "FLYER_AGGREGATOR",
      baseUrl: FLYER_SOURCE_BASE_URL,
      licenseInfo:
        "Public flyer JSON used by retailer flyer widgets. Confirm Flipp and retailer terms before production use.",
      isActive: true,
    },
    create: {
      name: FLYER_SOURCE_SYSTEM_NAME,
      sourceType: "FLYER_AGGREGATOR",
      baseUrl: FLYER_SOURCE_BASE_URL,
      licenseInfo:
        "Public flyer JSON used by retailer flyer widgets. Confirm Flipp and retailer terms before production use.",
    },
  });

  const retailers = new Map<string, { id: string; name: string }>();
  for (const config of FLYER_RETAILERS) {
    const retailer = await prisma.retailer.upsert({
      where: { name: config.name },
      update: {
        website: config.website,
        isActive: true,
      },
      create: {
        name: config.name,
        website: config.website,
      },
      select: { id: true, name: true },
    });
    retailers.set(config.name, retailer);
  }

  const batch = await prisma.ingestBatch.create({
    data: {
      sourceSystemId: sourceSystem.id,
      status: "RUNNING",
      startedAt,
      sourceReference: `FLIPP ${postalCode}`,
    },
  });

  try {
    const client = new FlippClient({
      postalCode,
      locale: options.locale,
      concurrency: options.concurrency,
      requestDelayMs: options.requestDelayMs,
    });

    log(`Fetching flyer list for ${postalCode}`);
    const flyerList = await client.listFlyers();
    const selected = selectFlyers(flyerList, retailers, {
      now,
      flyerIds: options.flyerIds,
    });

    const missingRetailers = FLYER_RETAILERS.filter(
      (config) => !selected.some((entry) => entry.retailerName === config.name),
    ).map((config) => config.name);

    if (selected.length === 0) {
      throw new Error(
        `No active grocery flyers found for ${FLYER_RETAILERS.map((r) => r.name).join(", ")} at ${postalCode}`,
      );
    }

    if (missingRetailers.length > 0) {
      log(`Warning: no active flyer found for ${missingRetailers.join(", ")}`);
    }

    const offerRows: Prisma.StagedOfferCreateManyInput[] = [];
    const flyerSummaries: IngestedFlyerSummary[] = [];
    let recordsRead = 0;
    let recordsRejected = 0;

    for (const entry of selected) {
      const { flyer, retailerName, retailerId } = entry;
      log(`Fetching items for ${retailerName} flyer ${flyer.id}`);

      const details = await client.getFlyer(flyer.id);
      const pricedItems = details.items.filter((item) => hasAdvertisedPrice(item));
      recordsRead += pricedItems.length;

      const itemDetails = await client.getItemDetails(
        pricedItems.map((item) => item.id),
        (completed, total) => {
          if (completed === total || completed % 100 === 0) {
            log(`  ${retailerName}: fetched ${completed}/${total} item details`);
          }
        },
      );

      const flyerRecord = await prisma.flyer.upsert({
        where: {
          sourceSystemId_externalId: {
            sourceSystemId: sourceSystem.id,
            externalId: String(flyer.id),
          },
        },
        update: {
          retailerId,
          merchantId: String(flyer.merchant_id),
          name: flyer.name,
          postalCode,
          locale: options.locale ?? "en-ca",
          validFrom: toDate(flyer.valid_from),
          validUntil: toDate(flyer.valid_to),
          sourceUrl: buildFlyerUrl(flyer.id),
          thumbnailUrl: flyer.thumbnail_url ?? null,
          fetchedAt: now,
          rawPayload: flyerSummaryPayload(flyer, pricedItems.length),
        },
        create: {
          sourceSystemId: sourceSystem.id,
          retailerId,
          merchantId: String(flyer.merchant_id),
          externalId: String(flyer.id),
          name: flyer.name,
          postalCode,
          locale: options.locale ?? "en-ca",
          validFrom: toDate(flyer.valid_from),
          validUntil: toDate(flyer.valid_to),
          sourceUrl: buildFlyerUrl(flyer.id),
          thumbnailUrl: flyer.thumbnail_url ?? null,
          fetchedAt: now,
          rawPayload: flyerSummaryPayload(flyer, pricedItems.length),
        },
        select: { id: true },
      });

      const normalizedOffers = pricedItems.map((item) => {
        const detail = itemDetails.get(item.id) ?? fallbackDetail(item);
        return normalizeFlyerOffer({
          retailerName,
          flyer,
          item,
          detail,
          observedAt: startOfDay(now),
          sourceUrl: buildFlyerUrl(flyer.id),
        });
      });

      for (const offer of normalizedOffers) {
        if (!offer.advertisedPriceAmount) {
          recordsRejected += 1;
        }

        offerRows.push(toCreateInput(offer, {
          ingestBatchId: batch.id,
          sourceSystemId: sourceSystem.id,
          flyerId: flyerRecord.id,
          retailerId,
        }));
      }

      const statusCounts = countStatuses(normalizedOffers);
      flyerSummaries.push({
        externalId: flyer.id,
        name: flyer.name,
        retailerName,
        totalItems: details.items.length,
        pricedItems: pricedItems.length,
        normalizedOffers: normalizedOffers.length,
        normalizedStatus: statusCounts.NORMALIZED,
        pendingReview: statusCounts.PENDING_REVIEW,
      });

      log(
        `  ${retailerName}: ${pricedItems.length} priced items, ${statusCounts.NORMALIZED} normalized, ${statusCounts.PENDING_REVIEW} pending review`,
      );
    }

    const statusCounts = countStatusesFromRows(offerRows);
    let recordsInserted = 0;

    for (let index = 0; index < offerRows.length; index += CREATE_MANY_CHUNK_SIZE) {
      const chunk = offerRows.slice(index, index + CREATE_MANY_CHUNK_SIZE);
      const result = await prisma.stagedOffer.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      recordsInserted += result.count;
    }

    const completedAt = new Date();
    const sourceReference = buildSourceReference(postalCode, flyerSummaries);
    await prisma.ingestBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        completedAt,
        recordsRead,
        recordsInserted,
        recordsRejected,
        sourceReference,
      },
    });

    return {
      batchId: batch.id,
      postalCode,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      recordsRead,
      recordsInserted,
      recordsRejected,
      normalizedStatus: statusCounts.NORMALIZED,
      pendingReview: statusCounts.PENDING_REVIEW,
      missingRetailers,
      flyers: flyerSummaries,
    };
  } catch (error) {
    await prisma.ingestBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

interface SelectFlyerOptions {
  now: Date;
  flyerIds?: number[];
}

function selectFlyers(
  flyers: FlippFlyer[],
  retailers: Map<string, { id: string; name: string }>,
  options: SelectFlyerOptions,
): SelectedFlyer[] {
  const allowedIds =
    options.flyerIds && options.flyerIds.length > 0
      ? new Set(options.flyerIds)
      : null;

  const selected: SelectedFlyer[] = [];
  for (const config of FLYER_RETAILERS) {
    const retailer = retailers.get(config.name);
    if (!retailer) {
      continue;
    }

    const candidates = flyers
      .filter((flyer) => flyer.merchant_id === config.merchantId)
      .filter((flyer) => (allowedIds ? allowedIds.has(flyer.id) : true))
      .filter((flyer) => {
        if (allowedIds) {
          return true;
        }
        return (
          isActiveFlyer(flyer, options.now) &&
          isGroceryFlyer(flyer) &&
          flyer.relationship !== false
        );
      })
      .sort((left, right) => flyerArea(right) - flyerArea(left));

    const flyer = candidates[0];
    if (flyer) {
      selected.push({
        flyer,
        retailerName: config.name,
        retailerId: retailer.id,
      });
    }
  }

  return selected;
}

function isActiveFlyer(flyer: FlippFlyer, now: Date): boolean {
  const validFrom = toDate(flyer.valid_from);
  const validUntil = toDate(flyer.valid_to);
  if (!validFrom || !validUntil) {
    return false;
  }

  return validFrom.getTime() <= now.getTime() && now.getTime() <= validUntil.getTime();
}

function isGroceryFlyer(flyer: FlippFlyer): boolean {
  return (
    flyer.categories?.some((category) => GROCERY_CATEGORY_PATTERN.test(category)) ??
    false
  );
}

function flyerArea(flyer: FlippFlyer): number {
  return (flyer.width ?? 0) * (flyer.height ?? 0);
}

function hasAdvertisedPrice(item: FlippFlyerItem): boolean {
  if (item.price === null || item.price === undefined) {
    return false;
  }

  const match = /^\s*\$?\s*(\d+(?:\.\d+)?)\s*$/.exec(String(item.price));
  return Boolean(match && Number(match[1]) > 0);
}

function fallbackDetail(item: FlippFlyerItem): FlippItemDetail {
  return {
    id: item.id,
    flyer_id: item.flyer_id,
    name: item.name,
    description: null,
    price_text: item.post_price_text ?? item.pre_price_text ?? null,
    sale_story: item.sale_story ?? null,
    sku: null,
  };
}

function toCreateInput(
  offer: NormalizedFlyerOffer,
  keys: {
    ingestBatchId: string;
    sourceSystemId: string;
    flyerId: string;
    retailerId: string;
  },
): Prisma.StagedOfferCreateManyInput {
  return {
    ingestBatchId: keys.ingestBatchId,
    sourceSystemId: keys.sourceSystemId,
    flyerId: keys.flyerId,
    retailerId: keys.retailerId,
    sourceRecordId: truncate(offer.sourceRecordId, 150),
    retailerName: truncate(offer.retailerName, 150),
    productName: truncate(offer.productName, 500),
    brand: truncate(offer.brand, 200),
    descriptionText: offer.descriptionText,
    packageSizeText: truncate(offer.packageSizeText, 200),
    quantityValue: offer.quantityValue,
    quantityUnit: truncate(offer.quantityUnit, 20),
    quantityIsApproximate: offer.quantityIsApproximate,
    family: truncate(offer.family, 80),
    advertisedPriceText: truncate(offer.advertisedPriceText, 100),
    advertisedPriceAmount: offer.advertisedPriceAmount,
    regularPriceAmount: offer.regularPriceAmount,
    pricingBasis: truncate(offer.pricingBasis, 30),
    isMemberPrice: offer.isMemberPrice,
    isMultibuy: offer.isMultibuy,
    isMultiVariant: offer.isMultiVariant,
    isPriceRange: offer.isPriceRange,
    unitPrice: offer.unitPrice,
    unitPriceBasis: truncate(offer.unitPriceBasis, 20),
    currency: offer.currency,
    promotionText: offer.promotionText,
    validFrom: offer.validFrom,
    validUntil: offer.validUntil,
    observedAt: offer.observedAt,
    imageUrl: truncate(offer.imageUrl, 1000),
    sourceUrl: truncate(offer.sourceUrl, 1000),
    matchKey: truncate(offer.matchKey, 300),
    familyKey: truncate(offer.familyKey, 150),
    status: truncate(offer.status, 30),
    reviewRequired: offer.reviewRequired,
    reviewReasons: offer.reviewReasons as Prisma.InputJsonValue,
    normalizedPayload: offer.normalizedPayload as Prisma.InputJsonValue,
    rawPayload: offer.rawPayload as Prisma.InputJsonValue,
  };
}

function countStatuses(offers: NormalizedFlyerOffer[]): {
  NORMALIZED: number;
  PENDING_REVIEW: number;
} {
  let normalized = 0;
  let pending = 0;
  for (const offer of offers) {
    if (offer.status === "NORMALIZED") {
      normalized += 1;
    } else {
      pending += 1;
    }
  }

  return { NORMALIZED: normalized, PENDING_REVIEW: pending };
}

function countStatusesFromRows(
  rows: Prisma.StagedOfferCreateManyInput[],
): { NORMALIZED: number; PENDING_REVIEW: number } {
  let normalized = 0;
  let pending = 0;
  for (const row of rows) {
    if (row.status === "NORMALIZED") {
      normalized += 1;
    } else {
      pending += 1;
    }
  }

  return { NORMALIZED: normalized, PENDING_REVIEW: pending };
}

function normalizePostalCode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function buildFlyerUrl(flyerId: number): string {
  return `https://flipp.com/en-ca/calgary-ab/flyer/${flyerId}`;
}

function flyerSummaryPayload(
  flyer: FlippFlyer,
  itemCount: number,
): Prisma.InputJsonValue {
  return {
    externalId: flyer.id,
    name: flyer.name,
    merchant: flyer.merchant,
    merchantId: flyer.merchant_id,
    validFrom: flyer.valid_from,
    validTo: flyer.valid_to,
    categories: flyer.categories ?? [],
    width: flyer.width ?? null,
    height: flyer.height ?? null,
    path: flyer.path ?? null,
    itemCount,
  };
}

function buildSourceReference(
  postalCode: string,
  flyers: IngestedFlyerSummary[],
): string {
  const summary = flyers
    .map(
      (flyer) =>
        `${flyer.retailerName} ${flyer.externalId} (${flyer.normalizedOffers})`,
    )
    .join(", ");
  return `FLIPP ${postalCode}: ${summary}`.slice(0, 500);
}

function truncate(value: string, maxLength: number): string;
function truncate(
  value: string | null | undefined,
  maxLength: number,
): string | null;
function truncate(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

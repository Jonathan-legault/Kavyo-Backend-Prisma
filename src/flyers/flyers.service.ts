import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type {
  CompareFlyerOffersQueryDto,
  ListFlyerOffersQueryDto,
} from "./dto/list-flyer-offers.dto.js";
import { FLYER_SOURCE_SYSTEM_NAME } from "./ingestion/retailers.js";

const OFFER_SELECT = {
  id: true,
  sourceRecordId: true,
  retailerName: true,
  productName: true,
  brand: true,
  descriptionText: true,
  packageSizeText: true,
  quantityValue: true,
  quantityUnit: true,
  quantityIsApproximate: true,
  family: true,
  advertisedPriceText: true,
  advertisedPriceAmount: true,
  regularPriceAmount: true,
  pricingBasis: true,
  isMemberPrice: true,
  isMultibuy: true,
  isMultiVariant: true,
  isPriceRange: true,
  unitPrice: true,
  unitPriceBasis: true,
  currency: true,
  promotionText: true,
  validFrom: true,
  validUntil: true,
  observedAt: true,
  imageUrl: true,
  sourceUrl: true,
  matchKey: true,
  familyKey: true,
  status: true,
  reviewRequired: true,
  reviewReasons: true,
  flyer: {
    select: {
      externalId: true,
      name: true,
      sourceUrl: true,
      validFrom: true,
      validUntil: true,
    },
  },
} satisfies Prisma.StagedOfferSelect;

type OfferRow = Prisma.StagedOfferGetPayload<{ select: typeof OFFER_SELECT }>;

export interface SerializedOffer {
  id: string;
  sourceRecordId: string;
  retailerName: string;
  productName: string;
  brand: string | null;
  descriptionText: string | null;
  packageSizeText: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  quantityIsApproximate: boolean;
  family: string | null;
  advertisedPriceText: string | null;
  advertisedPriceAmount: number | null;
  regularPriceAmount: number | null;
  pricingBasis: string;
  isMemberPrice: boolean;
  isMultibuy: boolean;
  isMultiVariant: boolean;
  isPriceRange: boolean;
  unitPrice: number | null;
  unitPriceBasis: string | null;
  currency: string;
  promotionText: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  observedAt: Date;
  imageUrl: string | null;
  sourceUrl: string | null;
  matchKey: string | null;
  familyKey: string | null;
  status: string;
  reviewRequired: boolean;
  reviewReasons: string[];
  flyer: {
    externalId: string;
    name: string;
    sourceUrl: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
  };
}

@Injectable()
export class FlyersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const batch = await this.getLatestBatch();
    if (!batch) {
      return {
        batch: null,
        offers: 0,
        retailers: [],
        flyers: [],
      };
    }

    const [retailerStatusCounts, flyerOfferCounts, flyers] = await Promise.all([
      this.prisma.stagedOffer.groupBy({
        by: ["retailerName", "status"],
        where: { ingestBatchId: batch.id },
        _count: { _all: true },
      }),
      this.prisma.stagedOffer.groupBy({
        by: ["flyerId"],
        where: { ingestBatchId: batch.id },
        _count: { _all: true },
      }),
      this.prisma.flyer.findMany({
        where: {
          stagedOffers: {
            some: { ingestBatchId: batch.id },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          externalId: true,
          name: true,
          merchantId: true,
          postalCode: true,
          validFrom: true,
          validUntil: true,
          sourceUrl: true,
          thumbnailUrl: true,
          retailer: {
            select: { name: true },
          },
        },
      }),
    ]);

    const flyerOfferCountMap = new Map(
      flyerOfferCounts.map((row) => [row.flyerId, row._count._all]),
    );

    const retailers = new Map<
      string,
      { retailerName: string; total: number; normalized: number; pendingReview: number }
    >();
    for (const row of retailerStatusCounts) {
      const current = retailers.get(row.retailerName) ?? {
        retailerName: row.retailerName,
        total: 0,
        normalized: 0,
        pendingReview: 0,
      };
      current.total += row._count._all;
      if (row.status === "NORMALIZED") {
        current.normalized += row._count._all;
      } else if (row.status === "PENDING_REVIEW") {
        current.pendingReview += row._count._all;
      }
      retailers.set(row.retailerName, current);
    }

    return {
      batch: {
        id: batch.id,
        status: batch.status,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
        sourceReference: batch.sourceReference,
        recordsRead: batch.recordsRead,
        recordsInserted: batch.recordsInserted,
        recordsRejected: batch.recordsRejected,
      },
      offers: batch.recordsInserted,
      retailers: [...retailers.values()].sort((left, right) =>
        left.retailerName.localeCompare(right.retailerName),
      ),
      flyers: flyers.map((flyer) => ({
        externalId: flyer.externalId,
        name: flyer.name,
        merchantId: flyer.merchantId,
        retailerName: flyer.retailer?.name ?? null,
        postalCode: flyer.postalCode,
        validFrom: flyer.validFrom,
        validUntil: flyer.validUntil,
        sourceUrl: flyer.sourceUrl,
        thumbnailUrl: flyer.thumbnailUrl,
        offerCount: flyerOfferCountMap.get(flyer.id) ?? 0,
      })),
    };
  }

  async listOffers(query: ListFlyerOffersQueryDto) {
    const batchId = query.batchId ?? (await this.getLatestBatchId());
    if (!batchId) {
      return {
        batchId: null,
        count: 0,
        offers: [],
      };
    }

    const where = buildOfferWhere(query, batchId);
    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;
    const orderBy = buildOrderBy(query.sort ?? "unitPrice");

    const [rows, count] = await Promise.all([
      this.prisma.stagedOffer.findMany({
        where,
        select: OFFER_SELECT,
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.stagedOffer.count({ where }),
    ]);

    return {
      batchId,
      count,
      offers: rows.map(serializeOffer),
    };
  }

  async getOffer(id: string) {
    const row = await this.prisma.stagedOffer.findUnique({
      where: { id },
      select: OFFER_SELECT,
    });

    if (!row) {
      throw new NotFoundException("Flyer offer not found");
    }

    return serializeOffer(row);
  }

  async compareOffers(query: CompareFlyerOffersQueryDto) {
    const mode = query.mode ?? "FAMILY";
    const result = await this.listOffers({
      q: query.q,
      retailer: query.retailer,
      status: query.status ?? "NORMALIZED",
      batchId: query.batchId,
      limit: Math.min(query.limit ?? 300, 300),
    });

    const groups = new Map<string, SerializedOffer[]>();
    for (const offer of result.offers) {
      const key = mode === "EXACT" ? offer.matchKey : offer.familyKey;
      if (!key) {
        continue;
      }

      const offers = groups.get(key) ?? [];
      offers.push(offer);
      groups.set(key, offers);
    }

    const comparisonGroups = [...groups.entries()]
      .map(([key, offers]) => buildComparisonGroup(key, offers))
      .sort((left, right) => {
        if (left.hasComparison !== right.hasComparison) {
          return left.hasComparison ? -1 : 1;
        }
        if (left.retailerCount !== right.retailerCount) {
          return right.retailerCount - left.retailerCount;
        }
        return left.cheapestPrice - right.cheapestPrice;
      });

    return {
      query: query.q,
      mode,
      comparisonType: mode === "EXACT" ? "EXACT_PRODUCT" : "SIMILAR_PRODUCT",
      comparisonNote:
        mode === "EXACT"
          ? "Offers share the same normalized product name and package size."
          : "Offers are grouped by grocery family and unit-price basis. They are similar products, not guaranteed identical items.",
      batchId: result.batchId,
      asOf: new Date().toISOString(),
      offerCount: result.offers.length,
      groupCount: comparisonGroups.length,
      comparisonGroupCount: comparisonGroups.filter((group) => group.hasComparison)
        .length,
      groups: comparisonGroups,
    };
  }

  private async getLatestBatchId(): Promise<string | null> {
    const batch = await this.getLatestBatch();
    return batch?.id ?? null;
  }

  private async getLatestBatch() {
    return this.prisma.ingestBatch.findFirst({
      where: {
        sourceSystem: { name: FLYER_SOURCE_SYSTEM_NAME },
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        sourceReference: true,
        recordsRead: true,
        recordsInserted: true,
        recordsRejected: true,
      },
    });
  }
}

function buildOfferWhere(
  query: ListFlyerOffersQueryDto,
  batchId: string,
): Prisma.StagedOfferWhereInput {
  const where: Prisma.StagedOfferWhereInput = { ingestBatchId: batchId };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  } else if (!query.status) {
    where.status = "NORMALIZED";
  }

  if (query.retailer) {
    where.retailerName = {
      contains: query.retailer,
      mode: "insensitive",
    };
  }

  if (query.family) {
    where.family = {
      equals: query.family.toLowerCase(),
    };
  }

  if (query.q) {
    where.OR = [
      { productName: { contains: query.q, mode: "insensitive" } },
      { brand: { contains: query.q, mode: "insensitive" } },
      { family: { contains: query.q, mode: "insensitive" } },
      { packageSizeText: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(
  sort: "unitPrice" | "price" | "name",
): Prisma.StagedOfferOrderByWithRelationInput[] {
  if (sort === "price") {
    return [{ advertisedPriceAmount: "asc" }, { productName: "asc" }];
  }

  if (sort === "name") {
    return [{ productName: "asc" }, { retailerName: "asc" }];
  }

  return [
    { unitPrice: "asc" },
    { advertisedPriceAmount: "asc" },
    { productName: "asc" },
  ];
}

function serializeOffer(row: OfferRow): SerializedOffer {
  return {
    ...row,
    quantityValue: decimalToNumber(row.quantityValue),
    advertisedPriceAmount: decimalToNumber(row.advertisedPriceAmount),
    regularPriceAmount: decimalToNumber(row.regularPriceAmount),
    unitPrice: decimalToNumber(row.unitPrice),
    reviewReasons: Array.isArray(row.reviewReasons)
      ? row.reviewReasons.filter((reason): reason is string => typeof reason === "string")
      : [],
  };
}

function decimalToNumber(
  value: Prisma.Decimal | number | string | null,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = value.toNumber();
  return Number.isFinite(parsed) ? parsed : null;
}

function buildComparisonGroup(key: string, offers: SerializedOffer[]) {
  const cheapestByRetailer = new Map<string, SerializedOffer>();
  for (const offer of offers) {
    const current = cheapestByRetailer.get(offer.retailerName);
    if (!current || offerEffectivePrice(offer) < offerEffectivePrice(current)) {
      cheapestByRetailer.set(offer.retailerName, offer);
    }
  }

  const retailerOffers = [...cheapestByRetailer.values()].sort(
    (left, right) => offerEffectivePrice(left) - offerEffectivePrice(right),
  );
  const prices = retailerOffers
    .map((offer) => offer.unitPrice)
    .filter((price): price is number => price !== null);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const spread =
    minPrice !== null && maxPrice !== null ? maxPrice - minPrice : null;
  const spreadPercent =
    spread !== null && minPrice !== null && minPrice > 0
      ? (spread / minPrice) * 100
      : null;
  const first = retailerOffers[0];

  return {
    key,
    family: first?.family ?? null,
    unitPriceBasis: first?.unitPriceBasis ?? null,
    retailerCount: retailerOffers.length,
    hasComparison: retailerOffers.length > 1,
    offerCount: offers.length,
    cheapest: first ?? null,
    cheapestPrice: first ? offerEffectivePrice(first) : Number.POSITIVE_INFINITY,
    minUnitPrice: minPrice,
    maxUnitPrice: maxPrice,
    priceSpread: spread,
    priceSpreadPercent: spreadPercent,
    offers: retailerOffers,
  };
}

function offerEffectivePrice(offer: SerializedOffer): number {
  return offer.unitPrice ?? offer.advertisedPriceAmount ?? Number.POSITIVE_INFINITY;
}

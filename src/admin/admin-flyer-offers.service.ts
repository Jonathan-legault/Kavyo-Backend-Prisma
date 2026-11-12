import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { FLYER_SOURCE_SYSTEM_NAME } from "../flyers/ingestion/retailers.js";
import {
  decimalToNumber,
  toJsonObject,
  toStringArray,
} from "../flyers/offer-utils.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AdminListFlyerOffersQueryDto } from "./dto/admin-list-flyer-offers.dto.js";
import type { ReviewFlyerOfferDto } from "./dto/review-flyer-offer.dto.js";

const ADMIN_OFFER_SELECT = {
  id: true,
  ingestBatchId: true,
  sourceSystemId: true,
  retailerId: true,
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
  promotionType: true,
  promotionQuantity: true,
  promotionTotalPrice: true,
  promotionUnitPrice: true,
  memberProgram: true,
  memberPriceAmount: true,
  nonMemberPriceAmount: true,
  priceMinAmount: true,
  priceMaxAmount: true,
  conditionsText: true,
  promotionConditions: true,
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
  reviewDecision: true,
  reviewNotes: true,
  reviewedAt: true,
  reviewedByUserId: true,
  matchedProductId: true,
  flyer: {
    select: {
      id: true,
      externalId: true,
      name: true,
      sourceUrl: true,
      validFrom: true,
      validUntil: true,
    },
  },
  retailer: {
    select: {
      id: true,
      name: true,
    },
  },
  matchedProduct: {
    select: {
      id: true,
      productName: true,
      brand: true,
      barcode: true,
      catalogKey: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.StagedOfferSelect;

type AdminOfferRow = Prisma.StagedOfferGetPayload<{
  select: typeof ADMIN_OFFER_SELECT;
}>;

@Injectable()
export class AdminFlyerOffersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminListFlyerOffersQueryDto) {
    const batchId = query.batchId ?? (await this.getLatestBatchId());
    if (!batchId) {
      return {
        batchId: null,
        count: 0,
        statusCounts: {},
        offers: [],
      };
    }

    const where = buildOfferWhere(query, batchId);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [rows, count, statusCounts] = await Promise.all([
      this.prisma.stagedOffer.findMany({
        where,
        select: ADMIN_OFFER_SELECT,
        orderBy: [{ reviewRequired: "desc" }, { observedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      this.prisma.stagedOffer.count({ where }),
      this.prisma.stagedOffer.groupBy({
        by: ["status"],
        where: { ingestBatchId: batchId },
        _count: { _all: true },
      }),
    ]);

    return {
      batchId,
      count,
      statusCounts: Object.fromEntries(
        statusCounts.map((row) => [row.status, row._count._all]),
      ),
      offers: rows.map(serializeAdminOffer),
    };
  }

  async getSummary(batchId?: string) {
    const resolvedBatchId = batchId ?? (await this.getLatestBatchId());
    const where: Prisma.StagedOfferWhereInput = resolvedBatchId
      ? { ingestBatchId: resolvedBatchId }
      : {};

    const [statusCounts, promotionTypeCounts, decisionCounts, total] =
      await Promise.all([
        this.prisma.stagedOffer.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
        }),
        this.prisma.stagedOffer.groupBy({
          by: ["promotionType"],
          where,
          _count: { _all: true },
        }),
        this.prisma.stagedOffer.groupBy({
          by: ["reviewDecision"],
          where,
          _count: { _all: true },
        }),
        this.prisma.stagedOffer.count({ where }),
      ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((row) => [row.status, row._count._all]),
    );
    const promotionTypeMap = Object.fromEntries(
      promotionTypeCounts.map((row) => [
        row.promotionType,
        row._count._all,
      ]),
    );
    const decisionMap = Object.fromEntries(
      decisionCounts.map((row) => [
        row.reviewDecision ?? "UNREVIEWED",
        row._count._all,
      ]),
    );

    return {
      batchId: resolvedBatchId,
      total,
      pendingReview: statusMap.PENDING_REVIEW ?? 0,
      normalized: statusMap.NORMALIZED ?? 0,
      rejected: statusMap.REJECTED ?? 0,
      byStatus: statusMap,
      byPromotionType: promotionTypeMap,
      byReviewDecision: decisionMap,
    };
  }

  async getOffer(id: string) {
    const row = await this.prisma.stagedOffer.findUnique({
      where: { id },
      select: ADMIN_OFFER_SELECT,
    });

    if (!row) {
      throw new NotFoundException("Flyer offer not found");
    }

    return serializeAdminOffer(row);
  }

  async reviewOffer(
    id: string,
    dto: ReviewFlyerOfferDto,
    reviewerId: string,
  ) {
    const offer = await this.prisma.stagedOffer.findUnique({
      where: { id },
      select: ADMIN_OFFER_SELECT,
    });

    if (!offer) {
      throw new NotFoundException("Flyer offer not found");
    }

    if (dto.decision === "REJECT") {
      const updated = await this.prisma.$transaction(async (tx) => {
        await withdrawPublishedPrice(tx, offer);

        return tx.stagedOffer.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewRequired: false,
            reviewDecision: "REJECTED",
            reviewNotes: dto.notes ?? offer.reviewNotes,
            reviewedAt: new Date(),
            reviewedByUserId: reviewerId,
            matchedProductId: null,
          },
          select: ADMIN_OFFER_SELECT,
        });
      });

      return {
        decision: "REJECT" as const,
        offer: serializeAdminOffer(updated),
      };
    }

    if (dto.decision === "NEEDS_INFO") {
      const updated = await this.prisma.$transaction(async (tx) => {
        await withdrawPublishedPrice(tx, offer);

        return tx.stagedOffer.update({
          where: { id },
          data: {
            status: "PENDING_REVIEW",
            reviewRequired: true,
            reviewDecision: "NEEDS_INFO",
            reviewNotes: dto.notes ?? offer.reviewNotes,
            reviewedAt: new Date(),
            reviewedByUserId: reviewerId,
          },
          select: ADMIN_OFFER_SELECT,
        });
      });

      return {
        decision: "NEEDS_INFO" as const,
        offer: serializeAdminOffer(updated),
      };
    }

    return this.approveOffer(offer, dto, reviewerId);
  }

  private async approveOffer(
    offer: AdminOfferRow,
    dto: ReviewFlyerOfferDto,
    reviewerId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await resolveProduct(tx, offer, dto);
      const priceObservation =
        dto.publishPrice === true
          ? await publishPriceObservation(tx, offer, product.id, dto)
          : null;

      const updated = await tx.stagedOffer.update({
        where: { id: offer.id },
        data: {
          status: "NORMALIZED",
          reviewRequired: false,
          reviewDecision: "APPROVED",
          reviewNotes: dto.notes ?? offer.reviewNotes,
          reviewedAt: new Date(),
          reviewedByUserId: reviewerId,
          matchedProductId: product.id,
        },
        select: ADMIN_OFFER_SELECT,
      });

      return {
        decision: "APPROVE" as const,
        offer: serializeAdminOffer(updated),
        product: {
          id: product.id,
          barcode: product.barcode,
          catalogKey: product.catalogKey,
          productName: product.productName,
          brand: product.brand,
        },
        priceObservation,
      };
    });
  }

  private async getLatestBatchId(): Promise<string | null> {
    const batch = await this.prisma.ingestBatch.findFirst({
      where: {
        sourceSystem: { name: FLYER_SOURCE_SYSTEM_NAME },
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });

    return batch?.id ?? null;
  }
}

async function resolveProduct(
  tx: Prisma.TransactionClient,
  offer: AdminOfferRow,
  dto: ReviewFlyerOfferDto,
) {
  if (dto.productId) {
    const product = await tx.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new BadRequestException("Product not found");
    }
    return product;
  }

  if (offer.matchedProductId) {
    const product = await tx.product.findUnique({
      where: { id: offer.matchedProductId },
    });
    if (product) {
      return product;
    }
  }

  if (offer.isMultiVariant) {
    throw new BadRequestException(
      "Multi-variant offer requires an explicit productId after the variant is resolved.",
    );
  }

  if (dto.barcode) {
    const product = await tx.product.findUnique({
      where: { barcode: dto.barcode },
    });
    if (product) {
      return product;
    }
  }

  const catalogKey = dto.catalogKey ?? buildCatalogKey(offer);
  if (!catalogKey) {
    throw new BadRequestException(
      "This offer has no stable product key. Provide catalogKey or productId.",
    );
  }

  const existing = await tx.product.findUnique({
    where: { catalogKey },
  });
  if (existing) {
    return existing;
  }

  if (dto.createProduct !== true) {
    throw new BadRequestException(
      "No matching product found. Set createProduct=true or provide productId.",
    );
  }

  return tx.product.create({
    data: {
      barcode: dto.barcode ?? null,
      catalogKey,
      productName: dto.productName ?? offer.productName,
      brand: dto.brand ?? offer.brand,
      quantityValue: offer.quantityValue,
      quantityUnit: offer.quantityUnit,
      quantityText: offer.packageSizeText,
      categories: offer.family,
      isActive: true,
    },
  });
}

async function publishPriceObservation(
  tx: Prisma.TransactionClient,
  offer: AdminOfferRow,
  productId: string,
  dto: ReviewFlyerOfferDto,
) {
  if (!dto.storeId) {
    throw new BadRequestException(
      "storeId is required when publishPrice is enabled.",
    );
  }

  const store = await tx.store.findUnique({
    where: { id: dto.storeId },
    select: { id: true, retailerId: true, isActive: true },
  });
  if (!store || !store.isActive) {
    throw new BadRequestException("Store not found or inactive");
  }
  if (offer.retailerId && store.retailerId !== offer.retailerId) {
    throw new BadRequestException(
      "Store does not belong to the offer retailer",
    );
  }

  const promotionConditions = toJsonObject(offer.promotionConditions);
  const requiresCoupon = promotionConditions?.requiresCoupon === true;
  const freeItem = promotionConditions?.freeItem === true;
  const bogo = promotionConditions?.bogo === true;
  const minSpend =
    typeof promotionConditions?.minSpend === "number"
      ? promotionConditions.minSpend
      : null;
  const promotionType = offer.promotionType;

  if (offer.isMemberPrice || promotionType === "MEMBER_PRICE") {
    throw new BadRequestException(
      "Member-only pricing cannot be published as a general sale price until member-aware pricing is supported.",
    );
  }

  if (offer.isMultibuy || promotionType === "MULTIBUY") {
    throw new BadRequestException(
      "Multibuy pricing cannot be published as a single-unit sale price.",
    );
  }

  if (promotionType === "BOGO" || bogo) {
    throw new BadRequestException(
      "Buy-one-get-one pricing cannot be published as a single-unit sale price.",
    );
  }

  if (freeItem) {
    throw new BadRequestException(
      "A free-item promotion cannot be published as a single-unit sale price.",
    );
  }

  if (requiresCoupon) {
    throw new BadRequestException(
      "Coupon pricing cannot be published as a general sale price.",
    );
  }

  if (promotionType === "SPEND_THRESHOLD" || minSpend !== null) {
    throw new BadRequestException(
      "A minimum-spend promotion cannot be published as a single-unit sale price.",
    );
  }

  const explicitPriceRequired =
    offer.isMultiVariant ||
    promotionType === "PRICE_RANGE" ||
    promotionType === "OTHER";

  if (explicitPriceRequired && dto.unitPrice === undefined) {
    throw new BadRequestException(
      "This offer has unresolved promotion conditions. Provide an explicit unitPrice before publishing.",
    );
  }

  const advertisedPrice = decimalToNumber(offer.advertisedPriceAmount);
  const promotionUnitPrice = decimalToNumber(offer.promotionUnitPrice);
  const hasPriceRange = decimalToNumber(offer.priceMinAmount) !== null;

  if (hasPriceRange && dto.unitPrice === undefined && promotionUnitPrice === null) {
    throw new BadRequestException(
      "This offer has a price range. Provide the resolved unitPrice before publishing.",
    );
  }

  const effectivePrice = dto.unitPrice ?? promotionUnitPrice ?? advertisedPrice;
  if (!effectivePrice || effectivePrice <= 0) {
    throw new BadRequestException(
      "A positive price is required before publishing.",
    );
  }

  const regularPrice =
    decimalToNumber(offer.regularPriceAmount) ?? effectivePrice;
  const salePrice = effectivePrice < regularPrice ? effectivePrice : null;

  const existing = await tx.priceObservation.findFirst({
    where: {
      productId,
      storeId: store.id,
      sourceSystemId: offer.sourceSystemId,
      sourceRecordId: offer.sourceRecordId,
    },
    select: { id: true },
  });

  const data = {
    productId,
    storeId: store.id,
    sourceSystemId: offer.sourceSystemId,
    ingestBatchId: offer.ingestBatchId,
    regularPrice,
    salePrice,
    currency: offer.currency,
    observedAt: offer.observedAt,
    validFrom: offer.validFrom,
    validUntil: offer.validUntil,
    sourceRecordId: offer.sourceRecordId,
  };

  const observation = existing
    ? await tx.priceObservation.update({
        where: { id: existing.id },
        data,
      })
    : await tx.priceObservation.create({ data });

  return {
    id: observation.id,
    productId: observation.productId,
    storeId: observation.storeId,
    regularPrice: decimalToNumber(observation.regularPrice),
    salePrice: decimalToNumber(observation.salePrice),
    currency: observation.currency,
    observedAt: observation.observedAt,
    validFrom: observation.validFrom,
    validUntil: observation.validUntil,
  };
}

function buildOfferWhere(
  query: AdminListFlyerOffersQueryDto,
  batchId: string,
): Prisma.StagedOfferWhereInput {
  const where: Prisma.StagedOfferWhereInput = { ingestBatchId: batchId };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.retailer) {
    where.retailerName = {
      contains: query.retailer,
      mode: "insensitive",
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

function buildCatalogKey(offer: AdminOfferRow): string | null {
  if (!offer.matchKey) {
    return null;
  }

  return `FLIPP|${offer.matchKey}`.slice(0, 300);
}

async function withdrawPublishedPrice(
  tx: Prisma.TransactionClient,
  offer: AdminOfferRow,
): Promise<void> {
  await tx.priceObservation.deleteMany({
    where: {
      sourceSystemId: offer.sourceSystemId,
      sourceRecordId: offer.sourceRecordId,
    },
  });
}

function serializeAdminOffer(row: AdminOfferRow) {
  return {
    ...row,
    quantityValue: decimalToNumber(row.quantityValue),
    advertisedPriceAmount: decimalToNumber(row.advertisedPriceAmount),
    regularPriceAmount: decimalToNumber(row.regularPriceAmount),
    promotionTotalPrice: decimalToNumber(row.promotionTotalPrice),
    promotionUnitPrice: decimalToNumber(row.promotionUnitPrice),
    memberPriceAmount: decimalToNumber(row.memberPriceAmount),
    nonMemberPriceAmount: decimalToNumber(row.nonMemberPriceAmount),
    priceMinAmount: decimalToNumber(row.priceMinAmount),
    priceMaxAmount: decimalToNumber(row.priceMaxAmount),
    unitPrice: decimalToNumber(row.unitPrice),
    promotionConditions: toJsonObject(row.promotionConditions),
    reviewReasons: toStringArray(row.reviewReasons),
  };
}

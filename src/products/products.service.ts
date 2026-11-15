import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import {
  AdvertisedOfferInput,
  evaluateAdvertisedOffer,
  selectBestAdvertisedOffer,
} from "../basket/calculation/advertised-offer-pricing.js";
import { toNumber } from "../basket/calculation/pricing.js";
import { decimalToNumber } from "../flyers/offer-utils.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ListProductsQueryDto } from "./dto/list-products.dto.js";

const DEFAULT_LIMIT = 60;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsQueryDto) {
    const now = new Date();
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? 0;
    const postalCode = query.postalCode?.trim() || null;

    const filters: Prisma.ProductWhereInput[] = [];

    if (query.q?.trim()) {
      const needle = query.q.trim();
      filters.push({
        OR: [
          { productName: { contains: needle, mode: "insensitive" } },
          { brand: { contains: needle, mode: "insensitive" } },
          { quantityText: { contains: needle, mode: "insensitive" } },
        ],
      });
    }

    if (query.category?.trim()) {
      filters.push({
        categories: {
          equals: query.category.trim().toUpperCase(),
          mode: "insensitive",
        },
      });
    }

    if (query.retailerId) {
      filters.push({
        OR: [
          {
            advertisedOffers: {
              some: { retailerId: query.retailerId },
            },
          },
          {
            priceObservations: {
              some: {
                store: { retailerId: query.retailerId },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(filters.length > 0 ? { AND: filters } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ productName: "asc" }, { brand: "asc" }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          barcode: true,
          productName: true,
          brand: true,
          quantityValue: true,
          quantityUnit: true,
          quantityText: true,
          categories: true,
        },
      }),
    ]);

    const productIds = rows.map((row) => row.id);
    const nowOffers = await this.currentOffers(productIds, now);
    const offersByProduct = new Map<string, AdvertisedOfferInput[]>();

    for (const offer of nowOffers) {
      if (!offer.productId) {
        continue;
      }

      const entries = offersByProduct.get(offer.productId) ?? [];
      entries.push(offer);
      offersByProduct.set(offer.productId, entries);
    }

    const retailerNames = new Map<string, string>();
    const verifiedCounts = new Map<string, number>();

    if (productIds.length > 0) {
      const [retailers, observationCounts] = await Promise.all([
        this.prisma.retailer.findMany({
          where: {
            id: {
              in: [...new Set(nowOffers.map((offer) => offer.retailerId))],
            },
          },
          select: { id: true, name: true },
        }),
        this.prisma.priceObservation.groupBy({
          by: ["productId"],
          where: {
            productId: { in: productIds },
            currency: "CAD",
            observedAt: { lte: now },
          },
          _count: { _all: true },
        }),
      ]);

      for (const retailer of retailers) {
        retailerNames.set(retailer.id, retailer.name);
      }

      for (const count of observationCounts) {
        verifiedCounts.set(count.productId, count._count._all);
      }
    }

    return {
      total,
      count: rows.length,
      limit,
      offset,
      postalCode,
      asOf: now.toISOString(),
      products: rows.map((row) => {
        const offers = offersByProduct.get(row.id) ?? [];
        const bestOffer = selectBestAdvertisedOffer(offers, now, {
          customerPostalCode: postalCode,
        });
        const currentOfferCount = offers.filter(
          (offer) =>
            evaluateAdvertisedOffer(offer, now, {
              customerPostalCode: postalCode,
            }).eligible,
        ).length;

        return {
          id: row.id,
          barcode: row.barcode,
          productName: row.productName,
          brand: row.brand,
          quantityValue: decimalToNumber(row.quantityValue),
          quantityUnit: row.quantityUnit,
          quantityText: row.quantityText,
          categories: row.categories,
          category: row.categories ?? "OTHER",
          verifiedStorePriceCount: verifiedCounts.get(row.id) ?? 0,
          currentOfferCount,
          latestAdvertisedOffer: bestOffer
            ? {
                id: bestOffer.offer.id,
                retailerId: bestOffer.offer.retailerId,
                retailerName:
                  retailerNames.get(bestOffer.offer.retailerId) ?? "Retailer",
                marketKey: bestOffer.offer.marketKey,
                marketMatch: bestOffer.marketMatch,
                advertisedPrice: bestOffer.unitPrice,
                regularPrice: toNumber(
                  bestOffer.offer.regularPriceAmount,
                ),
                currency: "CAD",
                promotionText: bestOffer.offer.promotionText,
                observedAt: bestOffer.offer.observedAt.toISOString(),
                validFrom:
                  bestOffer.offer.validFrom?.toISOString() ?? null,
                validUntil:
                  bestOffer.offer.validUntil?.toISOString() ?? null,
              }
            : null,
        };
      }),
    };
  }

  private async currentOffers(
    productIds: string[],
    now: Date,
  ): Promise<AdvertisedOfferInput[]> {
    if (productIds.length === 0) {
      return [];
    }

    return this.prisma.advertisedOffer.findMany({
      where: {
        productId: { in: productIds },
        currency: "CAD",
        advertisedPriceAmount: { gt: 0 },
        observedAt: { lte: now },
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
        ],
      },
      select: {
        id: true,
        productId: true,
        retailerId: true,
        marketKey: true,
        advertisedPriceAmount: true,
        regularPriceAmount: true,
        currency: true,
        promotionText: true,
        conditionEvidence: true,
        observedAt: true,
        validFrom: true,
        validUntil: true,
      },
      orderBy: { observedAt: "desc" },
    });
  }
}

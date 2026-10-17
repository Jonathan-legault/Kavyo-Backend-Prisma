import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CompareBasketDto } from "./dto/compare-basket.dto.js";

@Injectable()
export class BasketService {
  constructor(private readonly prisma: PrismaService) {}

  async compare(dto: CompareBasketDto) {
    const now = new Date();

    // 1. Combine quantities if a product appears more than once.
    const quantities = new Map<string, number>();

    for (const item of dto.items) {
      const currentQuantity = quantities.get(item.productId) ?? 0;

      quantities.set(
        item.productId,
        currentQuantity + item.quantity,
      );
    }

    const productIds = [...quantities.keys()];

    // 2. Find the requested active products.
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        productName: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        "One or more product IDs are invalid or inactive.",
      );
    }

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    // 3. Find active stores belonging to active retailers.
    const stores = await this.prisma.store.findMany({
      where: {
        isActive: true,
        retailer: {
          is: { isActive: true },
        },
      },
      include: {
        retailer: {
          select: { name: true },
        },
      },
    });

    const activeStoreIds = new Set(
      stores.map((store) => store.id),
    );

    // 4. Find price observations that are currently applicable.
    const observations =
      await this.prisma.priceObservation.findMany({
        where: {
          productId: { in: productIds },
          currency: "CAD",
          observedAt: { lte: now },
          AND: [
            {
              OR: [
                { validFrom: null },
                { validFrom: { lte: now } },
              ],
            },
            {
              OR: [
                { validUntil: null },
                { validUntil: { gt: now } },
              ],
            },
          ],
        },
        orderBy: {
          observedAt: "desc",
        },
      });

    // 5. Keep the latest eligible observation per store/product.
    const latestPrices = new Map<
      string,
      (typeof observations)[number]
    >();

    for (const observation of observations) {
      if (!activeStoreIds.has(observation.storeId)) {
        continue;
      }

      const key =
        `${observation.storeId}:${observation.productId}`;

      if (!latestPrices.has(key)) {
        latestPrices.set(key, observation);
      }
    }

    // 6. Calculate the basket for each active store.
    const comparisons = stores.map((store) => {
      let total = 0;
      const missingProducts: {
        productId: string;
        productName: string;
        quantity: number;
      }[] = [];

      const items = productIds.map((productId) => {
        const product = productsById.get(productId)!;
        const quantity = quantities.get(productId)!;
        const key = `${store.id}:${productId}`;
        const observation = latestPrices.get(key);

        // Prefer sale price; otherwise use regular price.
        const price =
          observation?.salePrice ??
          observation?.regularPrice ??
          null;

        // A missing price must not count as zero.
        if (price === null) {
          missingProducts.push({
            productId,
            productName: product.productName,
            quantity,
          });

          return {
            productId,
            productName: product.productName,
            quantity,
            unitPrice: null,
            lineTotal: null,
          };
        }

        const unitPrice = price.toNumber();
        const lineTotal = unitPrice * quantity;

        total += lineTotal;

        return {
          productId,
          productName: product.productName,
          quantity,
          unitPrice,
          lineTotal: Number(lineTotal.toFixed(3)),
        };
      });

      const isComplete = missingProducts.length === 0;

      return {
        storeId: store.id,
        storeName: store.name ?? store.retailer.name,
        retailerName: store.retailer.name,
        isComplete,
        total: isComplete
          ? Number(total.toFixed(3))
          : null,
        items,
        missingProducts,
      };
    });

    // 7. Recommend only a store with every product priced.
    const completeStores = comparisons
      .filter((store) => store.isComplete)
      .sort((a, b) => a.total! - b.total!);

    return {
      currency: "CAD",
      asOf: now.toISOString(),
      comparisons,
      cheapestCompleteStore: completeStores[0] ?? null,
    };
  }
}

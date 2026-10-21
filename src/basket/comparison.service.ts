import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  calculateStoreBasket,
  CalculatedBasketItem,
  MissingBasketProduct,
  NumericValue,
  pickCheapestCompleteStore,
  PriceObservationInput,
  RequestedBasketItem,
  roundMoney,
  toFiniteNumber,
} from "./calculation/pricing.js";
import { PostalCodeService, PostalLocation } from "./calculation/postal-code.service.js";
import {
  DEFAULT_TRAVEL_OPTIONS,
  estimateTravel,
  TravelOptions,
} from "./calculation/travel.js";
import { BasketItemDto, CompareOptionsDto } from "./dto/compare-basket.dto.js";

type LocationPrecision = "STORE_RECORD" | "FSA_CENTROID";

interface StoreLocation {
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
}

export interface StoreComparisonResult {
  storeId: string;
  storeName: string;
  retailerName: string;
  address: string | null;
  postalCode: string | null;
  storeLocation: StoreLocation | null;
  distanceKm: number | null;
  roundTripDistanceKm: number | null;
  travelCost: number | null;
  travelIncluded: boolean;
  productSubtotal: number;
  estimatedTotal: number | null;
  isComplete: boolean;
  availableItemCount: number;
  missingItemCount: number;
  missingProducts: MissingBasketProduct[];
  items: CalculatedBasketItem[];
  oldestPriceObservedAt: string | null;
  hasExpiredSale: boolean;
  hasStalePrice: boolean;
}

export interface StoreComparisonSummary {
  storeId: string;
  storeName: string;
  retailerName: string;
  productSubtotal: number;
  travelCost: number | null;
  estimatedTotal: number | null;
  distanceKm: number | null;
  roundTripDistanceKm: number | null;
}

export interface BasketComparisonResult {
  currency: "CAD";
  asOf: string;
  basketId: string | null;
  postalCode: string | null;
  customerLocation: PostalLocation | null;
  travelAssumptions: {
    included: boolean;
    travelCostPerKm: number;
    roundTrip: boolean;
    roadDistanceFactor: number;
    averageSpeedKmH: number;
    distanceMethod: "HAVERSINE_ROAD_FACTOR";
    locationPrecision: "FSA_CENTROID" | null;
  };
  comparisons: StoreComparisonResult[];
  cheapestCompleteStore: StoreComparisonSummary | null;
  closestPartialStore: StoreComparisonSummary | null;
  recommendation: {
    action: "GO_TO_STORE" | "STAY" | "SWITCH" | "NO_COMPLETE_STORE";
    storeId: string | null;
    storeName: string | null;
    retailerName: string | null;
    productSubtotal: number | null;
    travelCost: number | null;
    estimatedTotal: number | null;
    distanceKm: number | null;
    savingsVsNextCheapest: number | null;
    savingsVsBaseline: number | null;
    baselineStoreId: string | null;
    message: string;
  };
  warnings: string[];
}

@Injectable()
export class BasketComparisonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postalCodeService: PostalCodeService,
  ) {}

  /**
   * Stateless comparison used by POST /basket/compare. Postal code is
   * optional here so the original quick-compare request remains usable; when
   * it is omitted the response is product-price-only.
   */
  async compareItems(
    items: BasketItemDto[],
    options: CompareOptionsDto,
  ): Promise<BasketComparisonResult> {
    const quantities = new Map<string, number>();

    for (const item of items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const productIds = [...quantities.keys()];

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

    const requestedItems: RequestedBasketItem[] = productIds.map(
      (productId) => ({
        productId,
        productName: productsById.get(productId)!.productName,
        quantity: quantities.get(productId)!,
      }),
    );

    return this.compareResolvedItems(requestedItems, options, null);
  }

  /**
   * Compares a persisted basket. The postal code can be stored on the basket
   * or supplied with the compare request.
   */
  async compareBasket(
    basketId: string,
    options: CompareOptionsDto,
  ): Promise<BasketComparisonResult> {
    const basket = await this.prisma.basket.findUnique({
      where: { id: basketId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!basket) {
      throw new NotFoundException("Basket not found.");
    }

    if (basket.status !== "active") {
      throw new BadRequestException("Basket is not active.");
    }

    if (basket.items.length === 0) {
      throw new BadRequestException("Basket is empty. Add at least one item.");
    }

    const inactiveItem = basket.items.find((item) => !item.product.isActive);

    if (inactiveItem) {
      throw new BadRequestException(
        `Product ${inactiveItem.product.productName} is no longer active.`,
      );
    }

    const postalCode = options.postalCode ?? basket.postalCode ?? undefined;

    if (!postalCode) {
      throw new BadRequestException(
        "postalCode is required. Store it on the basket or include it in the compare request.",
      );
    }

    const requestedItems: RequestedBasketItem[] = basket.items.map((item) => ({
      productId: item.productId,
      productName: item.product.productName,
      quantity: item.quantity,
    }));

    return this.compareResolvedItems(
      requestedItems,
      { ...options, postalCode },
      basket.id,
    );
  }

  private async compareResolvedItems(
    requestedItems: RequestedBasketItem[],
    options: CompareOptionsDto,
    basketId: string | null,
  ): Promise<BasketComparisonResult> {
    const now = new Date();

    if (requestedItems.some((item) => item.quantity < 1)) {
      throw new BadRequestException(
        "Every basket item must have a quantity of at least 1.",
      );
    }

    const customerLocation = options.postalCode
      ? this.postalCodeService.locate(options.postalCode)
      : null;

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

    if (stores.length === 0) {
      throw new BadRequestException("No active stores are configured.");
    }

    const productIds = requestedItems.map((item) => item.productId);

    // Fetch every observation for the requested products. validUntil belongs
    // to the sale, not to the whole observation, so expired sales must still
    // be able to fall back to the regular price.
    const observations = await this.prisma.priceObservation.findMany({
      where: {
        productId: { in: productIds },
        storeId: { in: stores.map((store) => store.id) },
        currency: "CAD",
        observedAt: { lte: now },
      },
      orderBy: {
        observedAt: "desc",
      },
    });

    const travelOptions: TravelOptions = {
      travelCostPerKm: options.travelCostPerKm,
      roundTrip: options.roundTrip,
      roadDistanceFactor: options.roadDistanceFactor,
    };

    const comparisons: StoreComparisonResult[] = stores.map((store) => {
      const pricing = calculateStoreBasket(
        store.id,
        requestedItems,
        observations as PriceObservationInput[],
        now,
      );

      const storeLocation = this.resolveStoreLocation(store);
      const travel =
        customerLocation && storeLocation
          ? estimateTravel(customerLocation, storeLocation, travelOptions)
          : null;

      const travelIncluded = travel !== null;
      const hasUnknownTravelCost =
        customerLocation !== null && storeLocation === null;

      let estimatedTotal: number | null = null;

      if (pricing.isComplete) {
        if (travelIncluded) {
          estimatedTotal = roundMoney(
            pricing.productSubtotal + travel.travelCost,
          );
        } else if (!hasUnknownTravelCost) {
          // No postal code was supplied: give a product-only total.
          estimatedTotal = pricing.productSubtotal;
        }
      }

      return {
        storeId: store.id,
        storeName: store.name ?? store.retailer.name,
        retailerName: store.retailer.name,
        address: store.address,
        postalCode: store.postalCode,
        storeLocation,
        distanceKm: travel?.roadDistanceKm ?? null,
        roundTripDistanceKm: travel?.billedDistanceKm ?? null,
        travelCost: travel?.travelCost ?? null,
        travelIncluded,
        productSubtotal: pricing.productSubtotal,
        estimatedTotal,
        isComplete: pricing.isComplete,
        availableItemCount: pricing.availableItemCount,
        missingItemCount: pricing.missingItemCount,
        missingProducts: pricing.missingProducts,
        items: pricing.items,
        oldestPriceObservedAt:
          pricing.oldestObservedAt?.toISOString() ?? null,
        hasExpiredSale: pricing.hasExpiredSale,
        hasStalePrice: pricing.hasStalePrice,
      };
    });

    const completeStores = comparisons
      .filter(
        (store) => store.isComplete && store.estimatedTotal !== null,
      )
      .sort((a, b) => a.estimatedTotal! - b.estimatedTotal!);

    const partialStores = comparisons
      .filter((store) => !store.isComplete)
      .sort(
        (a, b) =>
          b.availableItemCount - a.availableItemCount ||
          a.missingItemCount - b.missingItemCount ||
          a.productSubtotal - b.productSubtotal,
      );

    const unknownTravelStores = comparisons.filter(
      (store) =>
        store.isComplete &&
        customerLocation !== null &&
        !store.travelIncluded,
    );

    const rankedComparisons = [
      ...completeStores,
      ...unknownTravelStores,
      ...partialStores,
    ];

    const cheapest = pickCheapestCompleteStore(completeStores);
    const nextCheapest = completeStores[1] ?? null;
    const closestPartial = partialStores[0] ?? null;

    const baseline = options.baselineStoreId
      ? (comparisons.find(
          (store) => store.storeId === options.baselineStoreId,
        ) ?? null)
      : null;

    if (options.baselineStoreId && !baseline) {
      throw new BadRequestException(
        "baselineStoreId does not match an active store.",
      );
    }

    const savingsVsNextCheapest =
      cheapest && nextCheapest && nextCheapest.estimatedTotal !== null
        ? roundMoney(
            nextCheapest.estimatedTotal - cheapest.estimatedTotal!,
          )
        : null;

    const savingsVsBaseline =
      cheapest &&
      baseline &&
      baseline.isComplete &&
      baseline.estimatedTotal !== null
        ? roundMoney(
            baseline.estimatedTotal - cheapest.estimatedTotal!,
          )
        : null;

    const recommendation = this.buildRecommendation({
      cheapest,
      nextCheapest,
      baseline,
      closestPartial,
      unknownTravelStores,
      requestedItemCount: requestedItems.length,
      savingsVsNextCheapest,
      savingsVsBaseline,
      travelIncluded: customerLocation !== null,
    });

    return {
      currency: "CAD",
      asOf: now.toISOString(),
      basketId,
      postalCode: customerLocation?.postalCode ?? null,
      customerLocation,
      travelAssumptions: {
        included: customerLocation !== null,
        travelCostPerKm:
          options.travelCostPerKm ??
          DEFAULT_TRAVEL_OPTIONS.travelCostPerKm,
        roundTrip:
          options.roundTrip ?? DEFAULT_TRAVEL_OPTIONS.roundTrip,
        roadDistanceFactor:
          options.roadDistanceFactor ??
          DEFAULT_TRAVEL_OPTIONS.roadDistanceFactor,
        averageSpeedKmH: DEFAULT_TRAVEL_OPTIONS.averageSpeedKmH,
        distanceMethod: "HAVERSINE_ROAD_FACTOR",
        locationPrecision: customerLocation
          ? "FSA_CENTROID"
          : null,
      },
      comparisons: rankedComparisons,
      cheapestCompleteStore: cheapest
        ? this.toSummary(cheapest)
        : null,
      closestPartialStore: closestPartial
        ? this.toSummary(closestPartial)
        : null,
      recommendation,
      warnings: this.buildWarnings({
        comparisons,
        customerLocation,
      }),
    };
  }

  private resolveStoreLocation(store: {
    latitude: NumericValue;
    longitude: NumericValue;
    postalCode: string | null;
  }): StoreLocation | null {
    const latitude = toFiniteNumber(store.latitude);
    const longitude = toFiniteNumber(store.longitude);

    if (
      latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return {
        latitude,
        longitude,
        precision: "STORE_RECORD",
      };
    }

    if (!store.postalCode) {
      return null;
    }

    try {
      const fallback = this.postalCodeService.locate(store.postalCode);

      return {
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        precision: "FSA_CENTROID",
      };
    } catch {
      return null;
    }
  }

  private toSummary(
    store: StoreComparisonResult,
  ): StoreComparisonSummary {
    return {
      storeId: store.storeId,
      storeName: store.storeName,
      retailerName: store.retailerName,
      productSubtotal: store.productSubtotal,
      travelCost: store.travelCost,
      estimatedTotal: store.estimatedTotal,
      distanceKm: store.distanceKm,
      roundTripDistanceKm: store.roundTripDistanceKm,
    };
  }

  private buildRecommendation(input: {
    cheapest: StoreComparisonResult | null;
    nextCheapest: StoreComparisonResult | null;
    baseline: StoreComparisonResult | null;
    closestPartial: StoreComparisonResult | null;
    unknownTravelStores: StoreComparisonResult[];
    requestedItemCount: number;
    savingsVsNextCheapest: number | null;
    savingsVsBaseline: number | null;
    travelIncluded: boolean;
  }) {
    const {
      cheapest,
      nextCheapest,
      baseline,
      closestPartial,
      unknownTravelStores,
      requestedItemCount,
      savingsVsNextCheapest,
      savingsVsBaseline,
      travelIncluded,
    } = input;

    if (!cheapest) {
      if (unknownTravelStores.length > 0) {
        const names = unknownTravelStores
          .slice(0, 3)
          .map((store) => store.storeName)
          .join(", ");

        return {
          action: "NO_COMPLETE_STORE" as const,
          storeId: null,
          storeName: null,
          retailerName: null,
          productSubtotal: null,
          travelCost: null,
          estimatedTotal: null,
          distanceKm: null,
          savingsVsNextCheapest: null,
          savingsVsBaseline: null,
          baselineStoreId: baseline?.storeId ?? null,
          message: `A travel cost could not be estimated for ${names}, so no complete store can be recommended.`,
        };
      }

      const closestText = closestPartial
        ? ` The closest match is ${closestPartial.storeName} with ${closestPartial.availableItemCount} of ${requestedItemCount} items` +
          (closestPartial.missingProducts.length > 0
            ? `; missing ${this.describeMissing(closestPartial.missingProducts)}.`
            : ".")
        : "";

      return {
        action: "NO_COMPLETE_STORE" as const,
        storeId: closestPartial?.storeId ?? null,
        storeName: closestPartial?.storeName ?? null,
        retailerName: closestPartial?.retailerName ?? null,
        productSubtotal: closestPartial?.productSubtotal ?? null,
        travelCost: closestPartial?.travelCost ?? null,
        estimatedTotal: null,
        distanceKm: closestPartial?.distanceKm ?? null,
        savingsVsNextCheapest: null,
        savingsVsBaseline: null,
        baselineStoreId: baseline?.storeId ?? null,
        message:
          "No store currently has every item in this basket." + closestText,
      };
    }

    const totalText = this.describeTotal(cheapest, travelIncluded);
    const nextText = nextCheapest
      ? ` This is ${this.formatMoney(
          savingsVsNextCheapest ?? 0,
        )} cheaper than the next complete store (${nextCheapest.storeName}).`
      : " It is the only store with every requested item.";

    if (baseline && baseline.storeId === cheapest.storeId) {
      return {
        action: "STAY" as const,
        storeId: cheapest.storeId,
        storeName: cheapest.storeName,
        retailerName: cheapest.retailerName,
        productSubtotal: cheapest.productSubtotal,
        travelCost: cheapest.travelCost,
        estimatedTotal: cheapest.estimatedTotal,
        distanceKm: cheapest.distanceKm,
        savingsVsNextCheapest,
        savingsVsBaseline: 0,
        baselineStoreId: baseline.storeId,
        message: `Stay at ${cheapest.storeName}. It is already the cheapest complete option at ${totalText}.${nextText}`,
      };
    }

    if (baseline) {
      const baselineText =
        baseline.isComplete && baseline.estimatedTotal !== null
          ? `saving ${this.formatMoney(
              savingsVsBaseline ?? 0,
            )} versus ${baseline.storeName}`
          : baseline.isComplete
            ? `but ${baseline.storeName} has no travel estimate, so its total cannot be compared`
            : `and ${baseline.storeName} cannot fulfil the full basket (${baseline.missingItemCount} missing item${
                baseline.missingItemCount === 1 ? "" : "s"
              })`;

      return {
        action: "SWITCH" as const,
        storeId: cheapest.storeId,
        storeName: cheapest.storeName,
        retailerName: cheapest.retailerName,
        productSubtotal: cheapest.productSubtotal,
        travelCost: cheapest.travelCost,
        estimatedTotal: cheapest.estimatedTotal,
        distanceKm: cheapest.distanceKm,
        savingsVsNextCheapest,
        savingsVsBaseline,
        baselineStoreId: baseline.storeId,
        message: `Switch to ${cheapest.storeName}. The estimated total is ${totalText}, ${baselineText}.${nextText}`,
      };
    }

    return {
      action: "GO_TO_STORE" as const,
      storeId: cheapest.storeId,
      storeName: cheapest.storeName,
      retailerName: cheapest.retailerName,
      productSubtotal: cheapest.productSubtotal,
      travelCost: cheapest.travelCost,
      estimatedTotal: cheapest.estimatedTotal,
      distanceKm: cheapest.distanceKm,
      savingsVsNextCheapest,
      savingsVsBaseline: null,
      baselineStoreId: null,
      message: `Go to ${cheapest.storeName}. The estimated total is ${totalText}.${nextText}${
        travelIncluded ? "" : " Add a postal code to include travel costs."
      }`,
    };
  }

  private describeTotal(
    store: StoreComparisonResult,
    travelIncluded: boolean,
  ): string {
    const groceries = this.formatMoney(store.productSubtotal);

    if (
      !travelIncluded ||
      store.travelCost === null ||
      store.roundTripDistanceKm === null
    ) {
      return `${groceries} for groceries (travel not included)`;
    }

    return `${this.formatMoney(
      store.estimatedTotal ?? 0,
    )} total (${groceries} groceries + ${this.formatMoney(
      store.travelCost,
    )} round-trip travel for ${store.roundTripDistanceKm.toFixed(1)} km)`;
  }

  private describeMissing(
    missingProducts: MissingBasketProduct[],
  ): string {
    const names = missingProducts
      .slice(0, 3)
      .map((product) => product.productName);

    if (missingProducts.length > 3) {
      names.push(`and ${missingProducts.length - 3} more`);
    }

    return names.join(", ");
  }

  private buildWarnings(input: {
    comparisons: StoreComparisonResult[];
    customerLocation: PostalLocation | null;
  }): string[] {
    const warnings = new Set<string>();

    if (!input.customerLocation) {
      warnings.add(
        "Travel cost is excluded because no postal code was provided.",
      );
    } else {
      warnings.add(
        "Travel distance is estimated from the postal-code area (FSA) centroid and a road-distance factor; actual driving distance may differ.",
      );
    }

    if (input.comparisons.some((store) => store.hasExpiredSale)) {
      warnings.add(
        "One or more flyer sale prices have expired. The regular price was used instead.",
      );
    }

    if (input.comparisons.some((store) => store.hasStalePrice)) {
      warnings.add(
        "Some prices are more than 24 hours old. Confirm them before travelling.",
      );
    }

    if (
      input.customerLocation &&
      input.comparisons.some(
        (store) =>
          store.isComplete &&
          !store.travelIncluded,
      )
    ) {
      warnings.add(
        "One or more stores could not be located, so they were excluded from the travel-aware recommendation.",
      );
    }

    if (
      input.comparisons.some(
        (store) => !store.isComplete,
      )
    ) {
      warnings.add(
        "Some stores are missing one or more requested products and are not eligible to be the cheapest complete store.",
      );
    }

    return [...warnings];
  }

  private formatMoney(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}

export type EffectivePriceType = "SALE" | "REGULAR";

export type SaleStatus = "ACTIVE" | "EXPIRED" | "SCHEDULED" | "NONE";

/**
 * Prisma returns DECIMAL columns as Decimal objects. Accept anything that can
 * be coerced to a finite, non-negative number so the calculation layer stays
 * independent of the generated Prisma client.
 */
export type NumericValue =
  | number
  | string
  | { toString(): string }
  | null
  | undefined;

export interface PriceObservationInput {
  productId: string;
  storeId: string;
  regularPrice: NumericValue;
  salePrice: NumericValue;
  currency: string;
  observedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
}

export interface RequestedBasketItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface EffectivePrice {
  unitPrice: number;
  priceType: EffectivePriceType;
  saleStatus: SaleStatus;
  regularPrice: number | null;
  salePrice: number | null;
}

export interface CalculatedBasketItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  priceType: EffectivePriceType;
  saleStatus: SaleStatus;
  regularPrice: number | null;
  salePrice: number | null;
  observedAt: Date;
  priceAgeHours: number;
}

export interface MissingBasketProduct {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StoreBasketCalculation {
  storeId: string;
  items: CalculatedBasketItem[];
  missingProducts: MissingBasketProduct[];
  availableItemCount: number;
  missingItemCount: number;
  isComplete: boolean;
  productSubtotal: number;
  oldestObservedAt: Date | null;
  hasExpiredSale: boolean;
  hasStalePrice: boolean;
}

export const STALE_PRICE_HOURS = 24;

/**
 * Coerces a Prisma Decimal-like value to a finite number. Negative values are
 * valid for coordinates, so callers that need a non-negative amount should use
 * toNumber instead.
 */
export function toFiniteNumber(value: NumericValue): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = typeof value === "number" ? value : Number(value.toString());

  return Number.isFinite(numeric) ? numeric : null;
}

export function toNumber(value: NumericValue): number | null {
  const numeric = toFiniteNumber(value);

  if (numeric === null || numeric < 0) {
    return null;
  }

  return numeric;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function priceAgeHours(observedAt: Date, now: Date): number {
  const hours = (now.getTime() - observedAt.getTime()) / 3_600_000;

  return Math.max(0, Math.round(hours * 10) / 10);
}

/**
 * A sale price is used only while its validity window is open. If the flyer
 * sale has expired, the regular price is used instead of dropping the whole
 * observation. This is important for price freshness and for stores whose
 * regular price is still valid after a sale ends.
 */
export function selectEffectivePrice(
  observation: PriceObservationInput,
  now: Date,
): EffectivePrice | null {
  const regularPrice = toNumber(observation.regularPrice);
  const salePrice = toNumber(observation.salePrice);

  let saleStatus: SaleStatus = "NONE";

  if (salePrice !== null) {
    if (observation.validFrom && observation.validFrom > now) {
      saleStatus = "SCHEDULED";
    } else if (observation.validUntil && observation.validUntil <= now) {
      saleStatus = "EXPIRED";
    } else {
      saleStatus = "ACTIVE";
    }
  }

  if (salePrice !== null && saleStatus === "ACTIVE") {
    return {
      unitPrice: salePrice,
      priceType: "SALE",
      saleStatus,
      regularPrice,
      salePrice,
    };
  }

  if (regularPrice !== null) {
    return {
      unitPrice: regularPrice,
      priceType: "REGULAR",
      saleStatus,
      regularPrice,
      salePrice,
    };
  }

  return null;
}

/**
 * Calculates one store's basket using the latest observation per product.
 * A missing price is reported explicitly and is never counted as $0.
 */
export function calculateStoreBasket(
  storeId: string,
  requestedItems: RequestedBasketItem[],
  observations: PriceObservationInput[],
  now: Date,
): StoreBasketCalculation {
  const latestByProduct = new Map<string, PriceObservationInput>();

  for (const observation of observations) {
    if (observation.storeId !== storeId || observation.currency !== "CAD") {
      continue;
    }

    const current = latestByProduct.get(observation.productId);

    if (!current || observation.observedAt > current.observedAt) {
      latestByProduct.set(observation.productId, observation);
    }
  }

  const items: CalculatedBasketItem[] = [];
  const missingProducts: MissingBasketProduct[] = [];
  let productSubtotal = 0;
  let oldestObservedAt: Date | null = null;
  let hasExpiredSale = false;
  let hasStalePrice = false;

  for (const requested of requestedItems) {
    const observation = latestByProduct.get(requested.productId);
    const effectivePrice = observation
      ? selectEffectivePrice(observation, now)
      : null;

    if (!observation || !effectivePrice) {
      missingProducts.push({
        productId: requested.productId,
        productName: requested.productName,
        quantity: requested.quantity,
      });

      continue;
    }

    const lineTotal = roundMoney(effectivePrice.unitPrice * requested.quantity);
    const age = priceAgeHours(observation.observedAt, now);

    productSubtotal += effectivePrice.unitPrice * requested.quantity;

    if (!oldestObservedAt || observation.observedAt < oldestObservedAt) {
      oldestObservedAt = observation.observedAt;
    }

    if (effectivePrice.saleStatus === "EXPIRED") {
      hasExpiredSale = true;
    }

    if (age > STALE_PRICE_HOURS) {
      hasStalePrice = true;
    }

    items.push({
      productId: requested.productId,
      productName: requested.productName,
      quantity: requested.quantity,
      unitPrice: roundMoney(effectivePrice.unitPrice),
      lineTotal,
      priceType: effectivePrice.priceType,
      saleStatus: effectivePrice.saleStatus,
      regularPrice:
        effectivePrice.regularPrice === null
          ? null
          : roundMoney(effectivePrice.regularPrice),
      salePrice:
        effectivePrice.salePrice === null
          ? null
          : roundMoney(effectivePrice.salePrice),
      observedAt: observation.observedAt,
      priceAgeHours: age,
    });
  }

  return {
    storeId,
    items,
    missingProducts,
    availableItemCount: items.length,
    missingItemCount: missingProducts.length,
    isComplete: missingProducts.length === 0,
    productSubtotal: roundMoney(productSubtotal),
    oldestObservedAt,
    hasExpiredSale,
    hasStalePrice,
  };
}

/**
 * Only a complete store with a landed total can be recommended. A store with
 * an unknown travel cost is not treated as free travel.
 */
export function pickCheapestCompleteStore<
  T extends { isComplete: boolean; estimatedTotal: number | null },
>(stores: T[]): T | null {
  const eligible = stores
    .filter((store) => store.isComplete && store.estimatedTotal !== null)
    .sort((a, b) => a.estimatedTotal! - b.estimatedTotal!);

  return eligible[0] ?? null;
}

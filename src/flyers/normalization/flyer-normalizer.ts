import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from "../flipp/flipp.types.js";
import {
  normalizeSizeText,
  parsePackageSize,
  parsePriceWeight,
  unitPriceFromPackage,
  unitPriceFromWeight,
  type NormalizedQuantityUnit,
} from "./package-size.js";
import {
  parsePromotion,
  parseRegularPrice,
  type PromotionType,
} from "./promotion.js";

const FAMILY_PATTERNS: Array<[string, RegExp]> = [
  [
    "nut_butter",
    /\b(?:peanut|almond|cashew|hazelnut|nut)\s+butter\b(?!\s+(?:cups?|chocolate|candy|snack|eggs?))/i,
  ],
  ["butter", /\bbutter\b(?!\s+(?:pecan|tarts?|cups?|chicken|fish))/i],
  ["eggs", /\b(?:eggs?|egg whites?)\b/i],
  ["ice_cream", /\b(?:ice cream|frozen dessert|gelato)\b/i],
  [
    "cheese",
    /\b(?:cheese|halloumi|feta|bocconcini|parmesan|cheddar|mozzarella)\b(?!\s+(?:samosas?|pizza|pasta|ravioli|tortellini|sauce|dip|sticks?|crackers?|chips?|bread|buns?|bagels?|muffins?|cakes?|pies?|tarts?|sandwich|burger|wrap|soup|salad|fries))/i,
  ],
  [
    "milk",
    /\b(?:milk|milk 2 go|cream|half and half)\b(?!\s+(?:cheese|sauce|soda|pop))/i,
  ],
  ["yogurt", /\b(?:yogurt|yoghurt|kefir)\b/i],
  ["bread", /\b(?:bread|bagels?|buns?|tortillas?|croissants?|muffins?)\b/i],
  ["cereal", /\b(?:cereal|granola|oatmeal|oats)\b/i],
  ["coffee", /\b(?:coffee|espresso|k-cups?|coffee pods?)\b/i],
  ["soft_drinks", /\b(?:pop|cola|coca-cola|pepsi|sprite|ginger ale|soft drink)\b/i],
  ["juice", /\b(?:juice|orange juice|apple juice)\b/i],
  ["chips", /\b(?:chips|crisps|popcorn|pretzels)\b/i],
  [
    "chicken",
    /\b(?:chicken|turkey)\b(?!\s+(?:pizza|pasta|sauce|soup|sandwich|wrap|salad|noodles?|rice|samosas?|pot pie))/i,
  ],
  ["beef", /\b(?:beef|steak|ground chuck|hamburger)\b/i],
  ["pork", /\b(?:pork|bacon|ham|sausage|wieners?)\b/i],
  [
    "seafood",
    /\b(?:salmon|shrimp|oysters?|fish|haddock|cod|sole|seafood|crab)\b(?!\s+(?:crackers?|sticks?|sandwich|burger|taco|soup|chowder|sauce))/i,
  ],
  ["sauce", /\b(?:pasta sauce|tomato sauce|pizza sauce|ketchup|salsa|dip)\b/i],
  [
    "pasta",
    /\b(?:pasta|spaghetti|penne|lasagna|gnocchi|noodles?|ravioli|tortellini|macaroni)\b/i,
  ],
  ["rice", /\b(?:rice|basmati|jasmine)\b/i],
  ["flour", /\b(?:flour|baking mix)\b/i],
  ["sugar", /\b(?:sugar|honey|maple syrup|syrup)\b/i],
  ["oil", /\b(?:olive oil|canola oil|vegetable oil|cooking oil)\b/i],
  ["pizza", /\b(?:pizza|pizzas)\b/i],
  [
    "snacks",
    /\b(?:cookies|crackers|granola bars?|chocolate|brownies|candy|tarts?|cakes?|pies?|pastries?|samosas?|spring rolls?|peanut butter cups?|snack size)\b/i,
  ],
  ["produce", /\b(?:avocados?|mangoes?|oranges?|grapes?|apples?|bananas?|tomatoes?|potatoes?|onions?|broccoli|mushrooms?|peppers?|cucumbers?|lettuce|salad|limes?|lemons?|berries|strawberries|blueberries|peaches?|pears?|pineapple|watermelon|zucchini|eggplant)\b/i],
  ["household", /\b(?:detergent|tissue|paper towels?|toilet paper|cleaner|dish soap|laundry)\b/i],
  ["personal_care", /\b(?:shampoo|conditioner|body wash|bubble bath|toothpaste|deodorant|razors?)\b/i],
];

const BLOCKING_REVIEW_REASONS = new Set([
  "PRICE_MISSING",
  "PACKAGE_SIZE_MISSING",
  "PACKAGE_SIZE_RANGE",
  "MULTI_VARIANT",
  "MULTIBUY",
  "PRICE_BY_WEIGHT",
  "MEMBER_PRICE",
  "PRICE_RANGE",
  "BOGO",
  "SPEND_THRESHOLD",
  "PURCHASE_LIMIT",
  "QUANTITY_REQUIREMENT",
  "COUPON_REQUIRED",
  "FREE_ITEM",
  "PROMOTION_AMBIGUOUS",
]);

export interface NormalizeFlyerOfferInput {
  retailerName: string;
  flyer: FlippFlyer;
  item: FlippFlyerItem;
  detail: FlippItemDetail;
  observedAt?: Date;
  sourceUrl?: string;
}

export interface NormalizedFlyerOffer {
  sourceRecordId: string;
  retailerName: string;
  productName: string;
  brand: string | null;
  descriptionText: string | null;
  packageSizeText: string | null;
  quantityValue: number | null;
  quantityUnit: NormalizedQuantityUnit | null;
  quantityIsApproximate: boolean;
  family: string | null;
  advertisedPriceText: string | null;
  advertisedPriceAmount: number | null;
  regularPriceAmount: number | null;
  pricingBasis: "FIXED" | "PER_KG" | "PER_LB" | "UNKNOWN";
  isMemberPrice: boolean;
  isMultibuy: boolean;
  isMultiVariant: boolean;
  isPriceRange: boolean;
  unitPrice: number | null;
  unitPriceBasis: "100g" | "100ml" | "each" | null;
  currency: "CAD";
  promotionText: string | null;
  promotionType: PromotionType;
  promotionQuantity: number | null;
  promotionTotalPrice: number | null;
  promotionUnitPrice: number | null;
  memberProgram: string | null;
  memberPriceAmount: number | null;
  nonMemberPriceAmount: number | null;
  priceMinAmount: number | null;
  priceMaxAmount: number | null;
  conditionsText: string | null;
  promotionConditions: Record<string, unknown>;
  validFrom: Date | null;
  validUntil: Date | null;
  observedAt: Date;
  imageUrl: string | null;
  sourceUrl: string | null;
  matchKey: string | null;
  familyKey: string | null;
  status: "NORMALIZED" | "PENDING_REVIEW";
  reviewRequired: boolean;
  reviewReasons: string[];
  normalizedPayload: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
}

export function normalizeFlyerOffer(
  input: NormalizeFlyerOfferInput,
): NormalizedFlyerOffer {
  const { item, detail, flyer, retailerName } = input;
  const observedAt = input.observedAt ?? new Date();
  const descriptionText = normalizeSizeText(detail.description) || null;
  const saleStory = normalizeSizeText(detail.sale_story);
  const priceText = normalizeSizeText(detail.price_text);
  const disclaimerText = normalizeSizeText(detail.disclaimer_text);

  const itemPrice = parsePriceAmount(item.price);
  const regularPriceAmount =
    parseRegularPrice(disclaimerText) ??
    parseRegularPrice(priceText) ??
    originalPriceRangeMax(detail.original_price_range);
  const promotion = parsePromotion({
    productName: item.name,
    descriptionText,
    priceText,
    saleStory,
    disclaimerText,
    itemPrice,
    regularPriceAmount,
    currentPriceRange: detail.current_price_range ?? null,
    originalPriceRange: detail.original_price_range ?? null,
    inStoreOnly: detail.in_store_only ?? null,
  });
  const advertisedPriceAmount = itemPrice ?? promotion.priceMin;
  const conditionsText = buildConditionsText(promotion.conditions);
  const promotionConditions = buildPromotionConditions(promotion);
  const packageSize = parsePackageSize(descriptionText, item.name);
  const priceWeight = parsePriceWeight(descriptionText, priceText);
  const isMultiVariant = detectMultiVariant(item.name, descriptionText);
  const isMultibuy = promotion.type === "MULTIBUY";
  const isMemberPrice =
    promotion.requiresMembership || promotion.requiresLoyaltyCard;
  const family = classifyFamily(item.name, descriptionText);

  const pricingBasis = priceWeight
    ? priceWeight.unit === "kg"
      ? "PER_KG"
      : "PER_LB"
    : packageSize.quantityUnit
      ? "FIXED"
      : "UNKNOWN";

  const priceForUnit = promotion.unitPrice ?? advertisedPriceAmount;
  const unitPrice =
    promotion.priceMin === null && priceForUnit
      ? priceWeight
        ? unitPriceFromWeight(priceForUnit, priceWeight.unit)
        : unitPriceFromPackage(
            priceForUnit,
            packageSize.quantityValue,
            packageSize.quantityUnit,
          )
      : null;

  const reviewReasons: string[] = [];
  const addReviewReason = (reason: string) => {
    if (!reviewReasons.includes(reason)) {
      reviewReasons.push(reason);
    }
  };

  if (!advertisedPriceAmount && promotion.priceMin === null) {
    addReviewReason("PRICE_MISSING");
  }
  if (priceWeight) addReviewReason("PRICE_BY_WEIGHT");
  if (!packageSize.quantityUnit && !priceWeight) {
    addReviewReason("PACKAGE_SIZE_MISSING");
  }
  if (packageSize.isRange) addReviewReason("PACKAGE_SIZE_RANGE");
  if (isMultiVariant) addReviewReason("MULTI_VARIANT");
  if (isMultibuy) addReviewReason("MULTIBUY");
  if (isMemberPrice) addReviewReason("MEMBER_PRICE");
  if (!hasUsableGtin(detail.sku)) addReviewReason("NO_GTIN");
  for (const reason of promotion.reviewReasons) {
    addReviewReason(reason);
  }

  // A multibuy with a computable per-item price (e.g. "2 for $5" -> $2.50)
  // can be used directly as a labelled basket estimate, so it does not need
  // manual review unless some other blocking reason is also present.
  const multibuyUsable =
    isMultibuy &&
    promotion.quantity !== null &&
    promotion.quantity >= 2 &&
    promotion.totalPrice !== null &&
    promotion.totalPrice > 0 &&
    promotion.unitPrice !== null &&
    promotion.unitPrice > 0;

  // Purchase limits ("limit 4, over limit pay more") and points-style
  // quantity requirements ("200 pts when you buy 2") do not change the
  // per-item price, so a positive single-unit price is already usable.
  // Offers that also carry a multibuy quantity/total pair keep their own
  // rule above and stay out of this carve-out.
  const limitsUsable =
    (advertisedPriceAmount ?? 0) > 0 &&
    !(promotion.quantity !== null && promotion.totalPrice !== null);

  const blockingReviewReasons = reviewReasons.filter((reason) =>
    BLOCKING_REVIEW_REASONS.has(reason),
  );
  const reviewRequired =
    blockingReviewReasons.length > 0 &&
    !(
      (multibuyUsable &&
        blockingReviewReasons.every((reason) => reason === "MULTIBUY")) ||
      (limitsUsable &&
        blockingReviewReasons.every(
          (reason) =>
            reason === "PURCHASE_LIMIT" || reason === "QUANTITY_REQUIREMENT",
        ))
    );
  const status = reviewRequired ? "PENDING_REVIEW" : "NORMALIZED";
  const matchKey =
    !isMultiVariant && !packageSize.isRange && promotion.priceMin === null
      ? buildMatchKey(
          item.brand,
          item.name,
          packageSize.text,
          packageSize.quantityValue,
          packageSize.quantityUnit,
        )
      : null;
  const familyKey =
    family && unitPrice?.basis ? `${family}|${unitPrice.basis}` : family;

  const normalizedPayload: Record<string, unknown> = {
    sourceRecordId: String(item.id),
    retailerName,
    flyerExternalId: flyer.id,
    productName: item.name,
    brand: item.brand ?? null,
    descriptionText,
    packageSizeText: packageSize.text,
    quantityValue: packageSize.quantityValue,
    quantityUnit: packageSize.quantityUnit,
    quantityIsApproximate: packageSize.isApproximate,
    family,
    advertisedPriceAmount,
    regularPriceAmount,
    pricingBasis,
    isMemberPrice,
    isMultibuy,
    isMultiVariant,
    isPriceRange: packageSize.isRange,
    hasPriceRange: promotion.priceMin !== null,
    promotionType: promotion.type,
    promotionQuantity: promotion.quantity,
    promotionTotalPrice: promotion.totalPrice,
    promotionUnitPrice: promotion.unitPrice,
    memberProgram: promotion.memberProgram,
    memberPriceAmount: promotion.memberPriceAmount,
    nonMemberPriceAmount: promotion.nonMemberPriceAmount,
    priceMinAmount: promotion.priceMin,
    priceMaxAmount: promotion.priceMax,
    conditionsText,
    promotionConditions,
    unitPrice: unitPrice?.value ?? null,
    unitPriceBasis: unitPrice?.basis ?? null,
    validFrom: item.valid_from ?? flyer.valid_from,
    validUntil: item.valid_to ?? flyer.valid_to,
    reviewReasons,
    status,
  };

  return {
    sourceRecordId: String(item.id),
    retailerName,
    productName: item.name,
    brand: cleanNullable(item.brand),
    descriptionText,
    packageSizeText: packageSize.text,
    quantityValue: packageSize.quantityValue,
    quantityUnit: packageSize.quantityUnit,
    quantityIsApproximate: packageSize.isApproximate,
    family,
    advertisedPriceText: buildPriceText(
      item.price,
      priceText,
      promoText(saleStory, disclaimerText),
      promotion.priceMin,
      promotion.priceMax,
    ),
    advertisedPriceAmount,
    regularPriceAmount,
    pricingBasis,
    isMemberPrice,
    isMultibuy,
    isMultiVariant,
    isPriceRange: packageSize.isRange,
    unitPrice: unitPrice?.value ?? null,
    unitPriceBasis: unitPrice?.basis ?? null,
    currency: "CAD",
    promotionText:
      promotion.type === "NONE" && promotion.reviewReasons.length === 0
        ? promoText(saleStory, disclaimerText) || null
        : conditionsText,
    promotionType: promotion.type,
    promotionQuantity: promotion.quantity,
    promotionTotalPrice: promotion.totalPrice,
    promotionUnitPrice: promotion.unitPrice,
    memberProgram: promotion.memberProgram,
    memberPriceAmount: promotion.memberPriceAmount,
    nonMemberPriceAmount: promotion.nonMemberPriceAmount,
    priceMinAmount: promotion.priceMin,
    priceMaxAmount: promotion.priceMax,
    conditionsText,
    promotionConditions,
    validFrom: toDate(item.valid_from ?? flyer.valid_from),
    validUntil: toDate(item.valid_to ?? flyer.valid_to),
    observedAt,
    imageUrl: normalizeUrl(detail.image_url ?? item.cutout_image_url),
    sourceUrl:
      input.sourceUrl ??
      `https://flipp.com/en-ca/calgary-ab/flyer/${flyer.id}`,
    matchKey,
    familyKey,
    status,
    reviewRequired,
    reviewReasons,
    normalizedPayload,
    rawPayload: {
      item,
      detail,
    },
  };
}

export function classifyFamily(
  productName: string,
  description: string | null,
): string | null {
  const text = `${productName} ${description ?? ""}`;
  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(text)) {
      return family;
    }
  }

  return null;
}

export function detectMultiVariant(
  productName: string,
  description: string | null,
): boolean {
  const text = `${productName} ${description ?? ""}`;
  return (
    /\bor\b/i.test(text) ||
    /\b(?:selected|assorted)\s+varieties\b/i.test(text) ||
    /\b(?:your choice|choice of|mix and match)\b/i.test(text)
  );
}

export function buildMatchKey(
  brand: string | null | undefined,
  productName: string,
  packageSizeText: string | null,
  quantityValue: number | null,
  quantityUnit: NormalizedQuantityUnit | null,
): string | null {
  const normalizedBrand = normalizeKeyPart(brand ?? "");
  let normalizedName = normalizeSizeText(productName);

  if (normalizedBrand) {
    const brandPattern = new RegExp(
      `^${escapeRegExp((brand ?? "").trim())}\\s+`,
      "i",
    );
    normalizedName = normalizedName.replace(brandPattern, "");
  }

  if (packageSizeText) {
    normalizedName = normalizedName.replace(
      new RegExp(escapeRegExp(packageSizeText), "ig"),
      " ",
    );
  }

  normalizedName = normalizeKeyPart(normalizedName);
  if (!normalizedName) {
    return null;
  }

  const quantityPart =
    quantityValue !== null && quantityUnit
      ? `${quantityValue}${quantityUnit}`
      : "unknown-size";

  return `${normalizedBrand || "unbranded"}|${normalizedName}|${quantityPart}`;
}

function parsePriceAmount(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (!value) {
    return null;
  }

  const match = /^\s*\$?\s*(\d+(?:\.\d+)?)\s*$/.exec(String(value));
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function originalPriceRangeMax(
  range: [number, number] | null | undefined,
): number | null {
  if (!Array.isArray(range) || range.length < 2) {
    return null;
  }

  const first = Number(range[0]);
  const second = Number(range[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }

  const max = Math.max(first, second);
  return max > 0 ? max : null;
}

function buildConditionsText(conditions: string[]): string | null {
  return conditions.length > 0 ? conditions.join(" / ") : null;
}

function buildPromotionConditions(
  promotion: ReturnType<typeof parsePromotion>,
): Record<string, unknown> {
  return {
    type: promotion.type,
    quantity: promotion.quantity,
    quantityRequirement: promotion.quantity,
    totalPrice: promotion.totalPrice,
    unitPrice: promotion.unitPrice,
    memberProgram: promotion.memberProgram,
    memberPriceAmount: promotion.memberPriceAmount,
    nonMemberPriceAmount: promotion.nonMemberPriceAmount,
    priceMin: promotion.priceMin,
    priceMax: promotion.priceMax,
    requiresMembership: promotion.requiresMembership,
    requiresLoyaltyCard: promotion.requiresLoyaltyCard,
    requiresCoupon: promotion.requiresCoupon,
    inStoreOnly: promotion.inStoreOnly,
    purchaseLimit: promotion.purchaseLimit,
    minSpend: promotion.minSpend,
    bogo: promotion.bogo,
    freeItem: promotion.freeItem,
    conditions: promotion.conditions,
    notes: promotion.notes,
    reviewReasons: promotion.reviewReasons,
  };
}

function hasUsableGtin(sku: string | null | undefined): boolean {
  if (!sku) {
    return false;
  }

  const digits = sku.replace(/\D/g, "");
  return /^\d{8,14}$/.test(digits);
}

function buildPriceText(
  price: string | number | null | undefined,
  priceText: string,
  promotionText: string,
  priceMin: number | null,
  priceMax: number | null,
): string | null {
  const parts: string[] = [];
  const hasPrice =
    price !== null && price !== undefined && String(price).trim().length > 0;
  if (hasPrice) {
    parts.push(`$${String(price).trim()}`);
  } else if (priceMin !== null && priceMax !== null) {
    parts.push(`$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`);
  }
  if (priceText) {
    parts.push(priceText);
  }
  if (promotionText && !priceText) {
    parts.push(promotionText);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

function promoText(saleStory: string, disclaimerText: string): string {
  return [saleStory, disclaimerText].filter(Boolean).join(" / ");
}

function cleanNullable(value: string | null | undefined): string | null {
  const cleaned = normalizeSizeText(value);
  return cleaned || null;
}

function normalizeKeyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[™®©]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/^http:\/\//i, "https://");
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

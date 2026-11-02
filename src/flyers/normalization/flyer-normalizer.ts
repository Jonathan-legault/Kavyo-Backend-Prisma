import type { FlippFlyer, FlippFlyerItem, FlippItemDetail } from "../flipp/flipp.types.js";
import {
  normalizeSizeText,
  parsePackageSize,
  parsePriceWeight,
  unitPriceFromPackage,
  unitPriceFromWeight,
  type NormalizedQuantityUnit,
} from "./package-size.js";

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
  const combinedText = [
    item.name,
    descriptionText,
    saleStory,
    priceText,
    disclaimerText,
  ]
    .filter(Boolean)
    .join(" / ");

  const advertisedPriceAmount = parsePriceAmount(item.price);
  const regularPriceAmount = parseRegularPrice(disclaimerText);
  const packageSize = parsePackageSize(descriptionText, item.name);
  const priceWeight = parsePriceWeight(descriptionText, priceText);
  const isMultiVariant = detectMultiVariant(item.name, descriptionText);
  const isMultibuy = detectMultibuy(combinedText);
  const isMemberPrice = detectMemberPrice(priceText, disclaimerText);
  const family = classifyFamily(item.name, descriptionText);

  const pricingBasis = priceWeight
    ? priceWeight.unit === "kg"
      ? "PER_KG"
      : "PER_LB"
    : packageSize.quantityUnit
      ? "FIXED"
      : "UNKNOWN";

  const unitPrice = advertisedPriceAmount
    ? priceWeight
      ? unitPriceFromWeight(advertisedPriceAmount, priceWeight.unit)
      : unitPriceFromPackage(
          advertisedPriceAmount,
          packageSize.quantityValue,
          packageSize.quantityUnit,
        )
    : null;

  const reviewReasons: string[] = [];
  if (!advertisedPriceAmount) reviewReasons.push("PRICE_MISSING");
  if (priceWeight) reviewReasons.push("PRICE_BY_WEIGHT");
  if (!packageSize.quantityUnit && !priceWeight) {
    reviewReasons.push("PACKAGE_SIZE_MISSING");
  }
  if (packageSize.isRange) reviewReasons.push("PACKAGE_SIZE_RANGE");
  if (isMultiVariant) reviewReasons.push("MULTI_VARIANT");
  if (isMultibuy) reviewReasons.push("MULTIBUY");
  if (isMemberPrice) reviewReasons.push("MEMBER_PRICE");
  if (!hasUsableGtin(detail.sku)) reviewReasons.push("NO_GTIN");

  const reviewRequired = reviewReasons.some((reason) =>
    BLOCKING_REVIEW_REASONS.has(reason),
  );
  const status = reviewRequired ? "PENDING_REVIEW" : "NORMALIZED";
  const matchKey =
    !isMultiVariant && !packageSize.isRange
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
    advertisedPriceText: buildPriceText(item.price, priceText, promoText(saleStory, disclaimerText)),
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
    promotionText: promoText(saleStory, disclaimerText) || null,
    validFrom: toDate(item.valid_from ?? flyer.valid_from),
    validUntil: toDate(item.valid_to ?? flyer.valid_to),
    observedAt,
    imageUrl: normalizeUrl(item.cutout_image_url),
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

function parseRegularPrice(disclaimerText: string): number | null {
  if (!disclaimerText) {
    return null;
  }

  const withoutMatch =
    /\$\s*(\d+(?:\.\d+)?)\s*(?:without|reg\.?|regular)\b/i.exec(disclaimerText);
  if (withoutMatch) {
    return Number(withoutMatch[1]);
  }

  const regularMatch =
    /\b(?:reg\.?|regular)\s*(?:price)?\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(
      disclaimerText,
    );
  if (regularMatch) {
    return Number(regularMatch[1]);
  }

  return null;
}

function detectMultibuy(text: string): boolean {
  return (
    /\b\d+\s*(?:for|\/)\s*\$?\s*\d+(?:\.\d+)?\b/i.test(text) ||
    /\bmix and match\b/i.test(text)
  );
}

function detectMemberPrice(priceText: string, disclaimerText: string): boolean {
  const text = `${priceText} ${disclaimerText}`;
  return (
    /\bmember\s+(?:price|pricing)\b/i.test(text) ||
    /\bwithout\b.*\b(?:card|member)\b/i.test(text)
  );
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
): string | null {
  const parts: string[] = [];
  if (price !== null && price !== undefined && String(price).trim()) {
    parts.push(`$${String(price).trim()}`);
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

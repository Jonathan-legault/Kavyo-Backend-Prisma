import { normalizeSizeText } from "./package-size.js";

export type PromotionType =
  | "NONE"
  | "MULTIBUY"
  | "MEMBER_PRICE"
  | "PRICE_RANGE"
  | "BOGO"
  | "SPEND_THRESHOLD"
  | "PURCHASE_LIMIT"
  | "IN_STORE_ONLY"
  | "POINTS_OFFER"
  | "OTHER";

export interface ParsePromotionInput {
  productName: string;
  descriptionText?: string | null;
  priceText?: string | null;
  saleStory?: string | null;
  disclaimerText?: string | null;
  itemPrice?: number | null;
  regularPriceAmount?: number | null;
  currentPriceRange?: [number, number] | null;
  originalPriceRange?: [number, number] | null;
  inStoreOnly?: boolean | null;
}

export interface ParsedPromotion {
  type: PromotionType;
  quantity: number | null;
  totalPrice: number | null;
  unitPrice: number | null;
  memberProgram: string | null;
  memberPriceAmount: number | null;
  nonMemberPriceAmount: number | null;
  priceMin: number | null;
  priceMax: number | null;
  requiresMembership: boolean;
  requiresLoyaltyCard: boolean;
  requiresCoupon: boolean;
  inStoreOnly: boolean;
  purchaseLimit: number | null;
  minSpend: number | null;
  bogo: boolean;
  freeItem: boolean;
  conditions: string[];
  notes: string[];
  reviewReasons: string[];
  sourceText: string | null;
}

const MEMBER_PROGRAMS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bscene\s*\+?/i, name: "Scene+" },
  { pattern: /\bpc\s+optimum\b/i, name: "PC Optimum" },
  { pattern: /\bair\s+miles\b/i, name: "Air Miles" },
  { pattern: /\bmore\s+rewards\b/i, name: "More Rewards" },
  { pattern: /\boptimum\b/i, name: "PC Optimum" },
];

const AMBIGUOUS_PROMOTION_PATTERN =
  /\b(?:when\s+you\s+buy|with\s+purchase|bonus|free|limit(?:ed)?|while\s+supplies\s+last|coupon|spend|earn)\b/i;

export function parsePromotion(input: ParsePromotionInput): ParsedPromotion {
  const productName = normalizeSizeText(input.productName);
  const priceText = normalizeSizeText(input.priceText);
  const saleStory = normalizeSizeText(input.saleStory);
  const disclaimerText = normalizeSizeText(input.disclaimerText);

  const promotionText = [saleStory, priceText, disclaimerText]
    .filter(Boolean)
    .join(" / ");
  const sourceText = promotionText || null;
  const conditions = [saleStory, priceText, disclaimerText].filter(Boolean);

  const multibuy = parseMultibuy(
    promotionText,
    positiveNumber(input.itemPrice),
  );
  const quantityRequirement = parseQuantityRequirement(promotionText);
  const priceRange =
    normalizePriceRange(input.currentPriceRange) ??
    extractPriceRange(`${priceText} ${disclaimerText}`);
  const memberProgram = detectMemberProgram(promotionText);
  const requiresMembership = detectMemberPriceCondition(promotionText);
  const requiresLoyaltyCard =
    requiresMembership && /\bcard\b/i.test(promotionText);
  const requiresCoupon = /\bcoupon\b|\boffer\s+code\b|\bpromo\s+code\b/i.test(
    promotionText,
  );
  const bogo =
    /\bbogo\b|\bbuy\s+(?:one|\d+),?\s+get\s+(?:one|\d+)\s+free\b/i.test(
      promotionText,
    );
  const freeItem =
    /\b(?:get|receive)\b[^.]{0,40}\bfree\b/i.test(promotionText) ||
    /\bfree\s+(?:with|when)\b/i.test(promotionText);
  const purchaseLimit = parsePurchaseLimit(promotionText);
  const minSpend = parseMinSpend(promotionText);
  const pointsOffer = /\b(?:points?|pts)\b/i.test(promotionText);
  const inStoreOnly =
    Boolean(input.inStoreOnly) || /\bin[- ]store\s+only\b/i.test(promotionText);
  const memberPriceAmount = requiresMembership
    ? positiveNumber(input.itemPrice)
    : null;
  const nonMemberPriceAmount =
    positiveNumber(input.regularPriceAmount) ??
    parseRegularPrice(disclaimerText) ??
    normalizePriceRange(input.originalPriceRange)?.[1] ??
    null;

  const notes: string[] = [];
  const reviewReasons: string[] = [];

  let type: PromotionType = "NONE";
  if (bogo) {
    type = "BOGO";
    notes.push("Buy one, get one offer");
    reviewReasons.push("BOGO");
  } else if (priceRange) {
    type = "PRICE_RANGE";
    notes.push(
      `Advertised price range $${formatMoney(priceRange[0])}-$${formatMoney(priceRange[1])}`,
    );
    reviewReasons.push("PRICE_RANGE");
  } else if (multibuy) {
    type = "MULTIBUY";
    notes.push(
      multibuy.perUnitThreshold
        ? `Quantity requirement: ${multibuy.quantity}+ at $${formatMoney(
            multibuy.unitPrice,
          )} each`
        : `Quantity requirement: ${multibuy.quantity} for $${formatMoney(
            multibuy.totalPrice,
          )}`,
    );
    reviewReasons.push("MULTIBUY");
  } else if (requiresMembership) {
    type = "MEMBER_PRICE";
    notes.push(
      memberProgram
        ? `Member/loyalty price requires ${memberProgram}`
        : "Member/loyalty price required",
    );
    reviewReasons.push("MEMBER_PRICE");
  } else if (minSpend !== null) {
    type = "SPEND_THRESHOLD";
    notes.push(`Minimum spend: $${formatMoney(minSpend)}`);
    reviewReasons.push("SPEND_THRESHOLD");
  } else if (purchaseLimit !== null) {
    type = "PURCHASE_LIMIT";
    notes.push(`Purchase limit: ${purchaseLimit}`);
    reviewReasons.push("PURCHASE_LIMIT");
  } else if (pointsOffer) {
    type = "POINTS_OFFER";
    notes.push("Loyalty points offer");
    reviewReasons.push("POINTS_OFFER");
  } else if (inStoreOnly) {
    type = "IN_STORE_ONLY";
    notes.push("In-store only");
  } else if (quantityRequirement !== null) {
    type = "OTHER";
    reviewReasons.push("QUANTITY_REQUIREMENT");
  } else if (AMBIGUOUS_PROMOTION_PATTERN.test(promotionText)) {
    type = "OTHER";
    notes.push("Promotion conditions could not be fully resolved");
    reviewReasons.push("PROMOTION_AMBIGUOUS");
  }

  if (requiresMembership && type !== "MEMBER_PRICE") {
    reviewReasons.push("MEMBER_PRICE");
  }
  if (requiresCoupon) {
    notes.push("Coupon required");
    reviewReasons.push("COUPON_REQUIRED");
  }
  if (purchaseLimit !== null && type !== "PURCHASE_LIMIT") {
    notes.push(`Purchase limit: ${purchaseLimit}`);
    reviewReasons.push("PURCHASE_LIMIT");
  }
  if (minSpend !== null && type !== "SPEND_THRESHOLD") {
    notes.push(`Minimum spend: $${formatMoney(minSpend)}`);
    reviewReasons.push("SPEND_THRESHOLD");
  }
  if (freeItem) {
    notes.push("Free item offer");
    reviewReasons.push("FREE_ITEM");
  }
  if (inStoreOnly && type !== "IN_STORE_ONLY") {
    notes.push("In-store only");
  }
  if (pointsOffer && type !== "POINTS_OFFER") {
    notes.push("Loyalty points offer");
    reviewReasons.push("POINTS_OFFER");
  }
  if (quantityRequirement !== null && !multibuy) {
    notes.push(`Quantity requirement: ${quantityRequirement}`);
    reviewReasons.push("QUANTITY_REQUIREMENT");
  }
  if (productName && /\b(?:bonus|free)\b/i.test(productName)) {
    notes.push("Product name includes a promotional phrase");
  }

  return {
    type,
    quantity: multibuy?.quantity ?? quantityRequirement,
    totalPrice: multibuy?.totalPrice ?? null,
    unitPrice: multibuy?.unitPrice ?? null,
    memberProgram,
    memberPriceAmount,
    nonMemberPriceAmount,
    priceMin: priceRange?.[0] ?? null,
    priceMax: priceRange?.[1] ?? null,
    requiresMembership,
    requiresLoyaltyCard,
    requiresCoupon,
    inStoreOnly,
    purchaseLimit,
    minSpend,
    bogo,
    freeItem,
    conditions,
    notes,
    reviewReasons: [...new Set(reviewReasons)],
    sourceText,
  };
}

export function parseRegularPrice(
  value: string | null | undefined,
): number | null {
  const text = normalizeSizeText(value);
  if (!text) {
    return null;
  }

  const patterns = [
    /\$\s*(\d+(?:\.\d+)?)\s*(?:without|reg\.?|regular)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(?:without|reg\.?|regular)\b/i,
    /\b(?:reg\.?|regular)\s*(?:price)?\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /\bwas\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /\boriginal\s*(?:price)?\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /\bnon[- ]?member\s*(?:price)?\s*\$?\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const amount = Number(match[1]);
      if (Number.isFinite(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
}

interface ParsedMultibuy {
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  perUnitThreshold: boolean;
}

function parseMultibuy(
  text: string,
  itemPrice: number | null,
): ParsedMultibuy | null {
  if (!text) {
    return null;
  }

  const explicitPerUnit =
    /(?:^|[^\d])(\d+)\s*(?:for|\/)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:ea|each)\b/i.exec(
      text,
    );
  if (explicitPerUnit) {
    const quantity = Number(explicitPerUnit[1]);
    const unitPrice = Number(explicitPerUnit[2]);
    return buildMultibuy(
      quantity,
      roundPrice(unitPrice * quantity),
      true,
    );
  }

  const priceFirst =
    /\$\s*(\d+(?:\.\d+)?)\s*(?:for|\/)\s*(\d+)\b(?!\s*(?:kg|g|ml|l|lb|oz|pk|pack|ct|ea|each)\b)/i.exec(
      text,
    );
  if (priceFirst) {
    return buildMultibuy(Number(priceFirst[2]), Number(priceFirst[1]));
  }

  const quantityFirst =
    /(?:^|[^\d])(\d+)\s*(?:for|\/)\s*\$?\s*(\d+(?:\.\d+)?)\b(?!\s*(?:kg|g|ml|l|lb|oz|pk|pack|ct|ea|each)\b)/i.exec(
      text,
    );
  if (quantityFirst) {
    return buildMultibuy(Number(quantityFirst[1]), Number(quantityFirst[2]));
  }

  return parsePerItemThreshold(text, itemPrice);
}

function parsePerItemThreshold(
  text: string,
  itemPrice: number | null,
): ParsedMultibuy | null {
  if (!itemPrice) {
    return null;
  }

  const patterns = [
    /\b(?:ea|each)\b[^.]{0,30}\b(?:when|with)\s+(?:you\s+)?(?:buy|purchase)\s+(?:of\s+)?(\d+)(?:\s+or\s+more)?\b/i,
    /\b(?:when|with)\s+(?:you\s+)?(?:buy|purchase)\s+(?:of\s+)?(\d+)(?:\s+or\s+more)?\b[^.]{0,30}\b(?:ea|each)\b/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const quantity = Number(match[1]);
      if (Number.isInteger(quantity) && quantity >= 2) {
        return buildMultibuy(
          quantity,
          roundPrice(itemPrice * quantity),
          true,
        );
      }
    }
  }

  return null;
}

function buildMultibuy(
  quantity: number,
  totalPrice: number,
  perUnitThreshold = false,
): ParsedMultibuy | null {
  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(totalPrice) ||
    quantity < 2 ||
    totalPrice <= 0
  ) {
    return null;
  }

  return {
    quantity,
    totalPrice,
    unitPrice: roundPrice(totalPrice / quantity),
    perUnitThreshold,
  };
}

function parseQuantityRequirement(text: string): number | null {
  if (!text) {
    return null;
  }

  const patterns = [
    /\b(?:when|with)\s+(?:you\s+)?(?:buy|purchase)\s+(?:of\s+)?(\d+)(?:\s+or\s+more)?\b/i,
    /\b(?:must|need\s+to)\s+buy\s+(\d+)(?:\s+or\s+more)?\b/i,
    /\b(?:buy|purchase)\s+(\d+)\s+or\s+more\b/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value > 1) {
        return value;
      }
    }
  }

  return null;
}

function normalizePriceRange(
  range: [number, number] | null | undefined,
): [number, number] | null {
  if (!Array.isArray(range) || range.length < 2) {
    return null;
  }

  const first = positiveNumber(range[0]);
  const second = positiveNumber(range[1]);
  if (first === null || second === null || first === second) {
    return null;
  }

  return first < second ? [first, second] : [second, first];
}

function extractPriceRange(text: string): [number, number] | null {
  if (!text) {
    return null;
  }

  const dollarRange =
    /\$\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$?\s*(\d+(?:\.\d+)?)\b/i.exec(text);
  if (dollarRange) {
    return normalizePriceRange([
      Number(dollarRange[1]),
      Number(dollarRange[2]),
    ]);
  }

  const eachRange =
    /(?:^|[^\d])(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:each|ea)\b/i.exec(
      text,
    );
  if (eachRange) {
    return normalizePriceRange([
      Number(eachRange[1]),
      Number(eachRange[2]),
    ]);
  }

  return null;
}

function detectMemberProgram(text: string): string | null {
  for (const program of MEMBER_PROGRAMS) {
    if (program.pattern.test(text)) {
      return program.name;
    }
  }

  return null;
}

function detectMemberPriceCondition(text: string): boolean {
  return (
    /\bmember(?:s|ship)?\s+(?:price|pricing|save|only|exclusive)\b/i.test(
      text,
    ) ||
    /\b(?:scene\s*\+?|pc\s+optimum|optimum|air\s+miles|more\s+rewards)\s+(?:member\s+)?(?:price|pricing)\b/i.test(
      text,
    ) ||
    /\b(?:with|using)\s+(?:a\s+)?(?:scene\s*\+?|pc\s+optimum|air\s+miles|more\s+rewards|rewards|loyalty|membership)\s*(?:card)?\b/i.test(
      text,
    ) ||
    /\bwithout\s+.*\bcard\b/i.test(text) ||
    /\bcard\s+price\b/i.test(text)
  );
}

function parsePurchaseLimit(text: string): number | null {
  const patterns = [
    /\blimit\s+(?:of\s+)?(\d+)\b/i,
    /\bmax(?:imum)?\s+(?:of\s+)?(\d+)\s+(?:per|items?)\b/i,
    /\b(\d+)\s+per\s+(?:customer|household)\b/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }
  }

  return null;
}

function parseMinSpend(text: string): number | null {
  const match =
    /\bspend\s+\$?\s*(\d+(?:\.\d+)?)/i.exec(text) ??
    /\bwhen\s+you\s+spend\s+\$?\s*(\d+(?:\.\d+)?)/i.exec(text);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function positiveNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function roundPrice(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

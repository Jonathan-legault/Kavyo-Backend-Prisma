export type NormalizedQuantityUnit = "g" | "ml" | "each";

export interface ParsedPackageSize {
  text: string | null;
  quantityValue: number | null;
  quantityUnit: NormalizedQuantityUnit | null;
  isRange: boolean;
  isApproximate: boolean;
}

export type PriceWeightUnit = "kg" | "lb" | "100g";

export interface ParsedPriceWeight {
  unit: PriceWeightUnit;
  referencePrice: number | null;
}

interface BaseSize {
  value: number;
  unit: NormalizedQuantityUnit;
  raw: string;
}

interface SizeMatch extends BaseSize {
  index: number;
  end: number;
}

const SIZE_PATTERN = /(\d+(?:\.\d+)?)\s*(kg|g|mg|ml|l|oz|lb|lbs)\b/gi;
const MULTI_PACK_PATTERN =
  /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|mg|ml|l|oz|lb|lbs)\b/i;
const SAME_UNIT_RANGE_PATTERN =
  /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(kg|g|mg|ml|l|oz|lb|lbs)\b/i;
const COUNT_PATTERN = /\b(\d+)\s*[- ]?\s*(?:pack|pk|ct|count)\b/i;
const EACH_PATTERN = /\beach\b/i;
const PACKAGE_WORD_PATTERN = /\b(?:pack|package|bag)\b/i;

export function normalizeSizeText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\r?\n+/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePackageSize(
  description: string | null | undefined,
  productName: string | null | undefined,
): ParsedPackageSize {
  const descriptionText = normalizeSizeText(description);
  const nameText = normalizeSizeText(productName);
  const text = [descriptionText, nameText].filter(Boolean).join(" / ");

  if (!text) {
    return emptyPackageSize();
  }

  const multiPack = MULTI_PACK_PATTERN.exec(text);
  if (multiPack) {
    const count = Number(multiPack[1]);
    const size = toBaseSize(Number(multiPack[2]), multiPack[3]);
    if (size && Number.isFinite(count) && count > 0) {
      return {
        text: multiPack[0],
        quantityValue: roundQuantity(count * size.value),
        quantityUnit: size.unit,
        isRange: false,
        isApproximate: false,
      };
    }
  }

  const sameUnitRange = SAME_UNIT_RANGE_PATTERN.exec(text);
  if (sameUnitRange) {
    const first = toBaseSize(Number(sameUnitRange[1]), sameUnitRange[3]);
    const second = toBaseSize(Number(sameUnitRange[2]), sameUnitRange[3]);
    if (first && second) {
      return {
        text: sameUnitRange[0],
        quantityValue: roundQuantity((first.value + second.value) / 2),
        quantityUnit: first.unit,
        isRange: true,
        isApproximate: true,
      };
    }
  }

  const matches = findSizeMatches(text);
  if (matches.length > 0) {
    return fromSizeMatches(matches, text);
  }

  const count = COUNT_PATTERN.exec(text);
  if (count) {
    return {
      text: count[0],
      quantityValue: Number(count[1]),
      quantityUnit: "each",
      isRange: false,
      isApproximate: false,
    };
  }

  if (EACH_PATTERN.test(text)) {
    return {
      text: "each",
      quantityValue: 1,
      quantityUnit: "each",
      isRange: false,
      isApproximate: false,
    };
  }

  if (PACKAGE_WORD_PATTERN.test(text)) {
    return {
      text: "package",
      quantityValue: 1,
      quantityUnit: "each",
      isRange: false,
      isApproximate: false,
    };
  }

  return emptyPackageSize();
}

export function parsePriceWeight(
  description: string | null | undefined,
  priceText: string | null | undefined,
): ParsedPriceWeight | null {
  const combined = `${normalizeSizeText(description)} / ${normalizeSizeText(
    priceText,
  )}`.toLowerCase();

  const soldBy100g = /sold\s+by\s+100\s*g\b/i.exec(combined);
  if (soldBy100g) {
    return { unit: "100g", referencePrice: null };
  }

  const priceTextUnit = /\/\s*(kg|lb|lbs)\b/i.exec(
    normalizeSizeText(priceText).toLowerCase(),
  );
  const descriptionRate =
    /\$?\s*(\d+(?:\.\d+)?)\s*\/\s*(kg|lb|lbs)\b/i.exec(combined);

  const unit = priceTextUnit?.[1] ?? descriptionRate?.[2];
  if (!unit) {
    return null;
  }

  return {
    unit: unit === "lbs" ? "lb" : (unit as "kg" | "lb"),
    referencePrice: descriptionRate ? Number(descriptionRate[1]) : null,
  };
}

export function unitPriceFromPackage(
  price: number,
  quantityValue: number | null,
  quantityUnit: NormalizedQuantityUnit | null,
): { value: number; basis: "100g" | "100ml" | "each" } | null {
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  if (!quantityValue || quantityValue <= 0 || !quantityUnit) {
    return null;
  }

  if (quantityUnit === "g") {
    return {
      value: roundUnitPrice(price / (quantityValue / 100)),
      basis: "100g",
    };
  }

  if (quantityUnit === "ml") {
    return {
      value: roundUnitPrice(price / (quantityValue / 100)),
      basis: "100ml",
    };
  }

  return {
    value: roundUnitPrice(price / quantityValue),
    basis: "each",
  };
}

export function unitPriceFromWeight(
  price: number,
  weightUnit: PriceWeightUnit,
): { value: number; basis: "100g" | "each" } | null {
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  if (weightUnit === "100g") {
    return { value: roundUnitPrice(price), basis: "100g" };
  }

  const gramsPerUnit = weightUnit === "kg" ? 1_000 : 453.59237;
  return {
    value: roundUnitPrice(price / (gramsPerUnit / 100)),
    basis: "100g",
  };
}

function fromSizeMatches(matches: SizeMatch[], text: string): ParsedPackageSize {
  const metricMatches = matches.filter(
    (match) => match.unit === "g" || match.unit === "ml",
  );
  const candidates = metricMatches.length > 0 ? metricMatches : matches;
  const units = new Set(candidates.map((match) => match.unit));

  if (units.size === 1) {
    const sortedValues = candidates
      .map((match) => match.value)
      .sort((a, b) => a - b);
    const first = candidates[0];
    const last = candidates[candidates.length - 1];
    const between = text.slice(first.end, last.index);
    const hasRangeConnector = /(?:-|\bto\b|\bor\b|\/)/i.test(between);
    const valuesDiffer =
      Math.max(...sortedValues) / Math.min(...sortedValues) > 1.01;

    if (hasRangeConnector && valuesDiffer) {
      return {
        text: text.slice(first.index, last.end),
        quantityValue: roundQuantity(
          sortedValues.reduce((sum, value) => sum + value, 0) /
            sortedValues.length,
        ),
        quantityUnit: first.unit,
        isRange: true,
        isApproximate: true,
      };
    }

    if (!valuesDiffer) {
      const metric = candidates.find(
        (match) => match.raw.toLowerCase().endsWith("g") ||
          match.raw.toLowerCase().endsWith("ml"),
      );
      return {
        text: (metric ?? first).raw,
        quantityValue: roundQuantity((metric ?? first).value),
        quantityUnit: (metric ?? first).unit,
        isRange: false,
        isApproximate: false,
      };
    }
  }

  const first = candidates[0];
  return {
    text: first.raw,
    quantityValue: roundQuantity(first.value),
    quantityUnit: first.unit,
    isRange: candidates.length > 1,
    isApproximate: candidates.length > 1,
  };
}

function findSizeMatches(text: string): SizeMatch[] {
  const matches: SizeMatch[] = [];
  SIZE_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(SIZE_PATTERN)) {
    const matchText = match[0];
    const index = match.index ?? 0;
    const prefix = text.slice(Math.max(0, index - 12), index).toLowerCase();

    // A rate such as "9.79/kg" or "sold by 100 g" is not a package size.
    if (/\/\s*$/.test(prefix) || /\bper\s+$/.test(prefix) || /\bsold\s+by\s+$/.test(prefix)) {
      continue;
    }

    const size = toBaseSize(Number(match[1]), match[2]);
    if (!size) {
      continue;
    }

    matches.push({
      ...size,
      raw: matchText,
      index,
      end: index + matchText.length,
    });
  }

  return matches;
}

function toBaseSize(
  value: number,
  unit: string,
): { value: number; unit: NormalizedQuantityUnit } | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  switch (unit.toLowerCase()) {
    case "kg":
      return { value: value * 1_000, unit: "g" };
    case "g":
      return { value, unit: "g" };
    case "mg":
      return { value: value / 1_000, unit: "g" };
    case "oz":
      return { value: value * 28.349523125, unit: "g" };
    case "lb":
    case "lbs":
      return { value: value * 453.59237, unit: "g" };
    case "l":
      return { value: value * 1_000, unit: "ml" };
    case "ml":
      return { value, unit: "ml" };
    default:
      return null;
  }
}

function roundQuantity(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function roundUnitPrice(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function emptyPackageSize(): ParsedPackageSize {
  return {
    text: null,
    quantityValue: null,
    quantityUnit: null,
    isRange: false,
    isApproximate: false,
  };
}

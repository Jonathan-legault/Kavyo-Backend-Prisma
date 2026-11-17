/**
 * Batch-approve current, auto-validated flyer offers so their advertised
 * estimates can feed basket comparison.
 *
 * Safety rules:
 *  - Only offers that are date-valid NOW and were never reviewed are
 *    considered. By default that means offers that already passed normalizer
 *    review (status NORMALIZED, review_required=false).
 *  - With --include-multibuy, "2 for $5"-style multibuy offers are also
 *    approved when their only review reasons are MULTIBUY plus informational
 *    ones (NO_GTIN, POINTS_OFFER) and a per-item price was computed.
 *    Condition-heavy multibuys (member, size-range, multi-variant, ...) stay
 *    blocked.
 *  - With --include-limits, offers whose only blocking reasons are
 *    PURCHASE_LIMIT ("limit 4, over limit pay more") or QUANTITY_REQUIREMENT
 *    (points-style "when you buy 2" bonuses) are approved when a positive
 *    single-unit price exists and no multibuy quantity/total pair is present.
 *  - Existing products win over new products: offers are linked by
 *    catalogKey, then by exact normalized name + package size. Name-only
 *    matches with a different package size are skipped for manual review so
 *    different SKUs are never merged.
 *  - Offers without a stable match key are skipped (no invented identity).
 *  - Approvals go through AdminFlyerOffersService.reviewOffer so the audit
 *    trail (reviewer, decision, notes) is identical to the admin API.
 *
 * Usage from the backend root:
 *   npx tsx scripts/approve-current-flyer-offers.ts --dry-run
 *   npx tsx scripts/approve-current-flyer-offers.ts --apply
 *   npx tsx scripts/approve-current-flyer-offers.ts --apply --include-multibuy
 *   npx tsx scripts/approve-current-flyer-offers.ts --apply --include-limits
 */
import "dotenv/config";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { AdminFlyerOffersService } from "../src/admin/admin-flyer-offers.service.js";
import type { Prisma } from "../src/generated/prisma/client.js";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const includeMultibuy = args.has("--include-multibuy");
const includeLimits = args.has("--include-limits");
const NOTES =
  "Batch-approved current flyer offer (auto-validated by normalizer).";

/**
 * Review reasons that are acceptable for an auto-approved multibuy:
 * MULTIBUY itself (usable per-item price) plus informational reasons that do
 * not change the cash price. Anything else keeps the offer in manual review.
 */
const MULTIBUY_REVIEW_REASON_ALLOWLIST = new Set([
  "MULTIBUY",
  "NO_GTIN",
  "POINTS_OFFER",
]);

/**
 * Review reasons that are acceptable for an auto-approved limited offer:
 * purchase limits and points-style quantity requirements do not change the
 * per-item price. Identity and price-semantics reasons (multi-variant,
 * size ranges, ...) are not on this list and stay in manual review.
 */
const LIMITS_REVIEW_REASON_ALLOWLIST = new Set([
  "PURCHASE_LIMIT",
  "QUANTITY_REQUIREMENT",
  "NO_GTIN",
  "POINTS_OFFER",
]);

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSize(
  quantityValue: Prisma.Decimal | number | string | null,
  quantityUnit: string | null | undefined,
  quantityText: string | null | undefined,
): string {
  if (quantityValue != null && quantityUnit) {
    return `${Number(quantityValue)} ${quantityUnit}`;
  }
  return normalizeText(quantityText ?? "");
}

interface OfferRow {
  id: string;
  retailerName: string;
  productName: string;
  matchKey: string | null;
  quantityValue: Prisma.Decimal | number | string | null;
  quantityUnit: string | null;
  packageSizeText: string | null;
  reviewRequired: boolean;
  reviewReasons: string[];
  promotionType: string | null;
  promotionQuantity: Prisma.Decimal | number | string | null;
  promotionTotalPrice: Prisma.Decimal | number | string | null;
  promotionUnitPrice: Prisma.Decimal | number | string | null;
  advertisedPriceAmount: Prisma.Decimal | number | string | null;
}

function toNumber(
  value: Prisma.Decimal | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMultibuyQuantityPair(offer: OfferRow): boolean {
  return (
    offer.promotionQuantity !== null &&
    offer.promotionQuantity !== undefined &&
    offer.promotionTotalPrice !== null &&
    offer.promotionTotalPrice !== undefined
  );
}

function isUsableMultibuyOffer(offer: OfferRow): boolean {
  return (
    offer.reviewRequired &&
    offer.promotionType === "MULTIBUY" &&
    (toNumber(offer.promotionQuantity) ?? 0) >= 2 &&
    (toNumber(offer.promotionTotalPrice) ?? 0) > 0 &&
    (toNumber(offer.promotionUnitPrice) ?? 0) > 0 &&
    offer.reviewReasons.length > 0 &&
    offer.reviewReasons.every((reason) =>
      MULTIBUY_REVIEW_REASON_ALLOWLIST.has(reason),
    )
  );
}

function isUsableLimitedOffer(offer: OfferRow): boolean {
  return (
    offer.reviewRequired &&
    (toNumber(offer.advertisedPriceAmount) ?? 0) > 0 &&
    !hasMultibuyQuantityPair(offer) &&
    offer.reviewReasons.length > 0 &&
    offer.reviewReasons.every((reason) =>
      LIMITS_REVIEW_REASON_ALLOWLIST.has(reason),
    )
  );
}

interface ProductRow {
  id: string;
  productName: string;
  catalogKey: string | null;
  quantityValue: Prisma.Decimal | number | string | null;
  quantityUnit: string | null;
  quantityText: string | null;
}

interface IndexEntry {
  exact: ProductRow[];
  nameOnly: ProductRow[];
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const reviewer = await prisma.user.findUnique({
    where: { email: "admin@kavyo.dev" },
    select: { id: true },
  });
  if (!reviewer) {
    throw new Error("Reviewer admin@kavyo.dev not found. Run scripts/create-admin-user.mjs first.");
  }

  const autoApprovalBranches: Prisma.StagedOfferWhereInput[] = [];
  if (includeMultibuy) {
    autoApprovalBranches.push({
      reviewRequired: true,
      promotionType: "MULTIBUY",
      promotionQuantity: { gte: 2 },
      promotionTotalPrice: { gt: 0 },
      promotionUnitPrice: { gt: 0 },
    });
  }
  if (includeLimits) {
    // Broad superset; the exact allowlist check happens in isUsableLimitedOffer.
    autoApprovalBranches.push({
      reviewRequired: true,
      advertisedPriceAmount: { gt: 0 },
    });
  }

  const offers = (await prisma.stagedOffer.findMany({
    where: {
      validUntil: { gte: new Date() },
      reviewDecision: null,
      matchKey: { not: null },
      advertisedPriceAmount: { gt: 0 },
      ...(autoApprovalBranches.length > 0
        ? { OR: [{ reviewRequired: false }, ...autoApprovalBranches] }
        : { reviewRequired: false }),
    },
    select: {
      id: true,
      retailerName: true,
      productName: true,
      matchKey: true,
      quantityValue: true,
      quantityUnit: true,
      packageSizeText: true,
      reviewRequired: true,
      reviewReasons: true,
      promotionType: true,
      promotionQuantity: true,
      promotionTotalPrice: true,
      promotionUnitPrice: true,
      advertisedPriceAmount: true,
    },
    orderBy: [{ retailerName: "asc" }, { productName: "asc" }],
  })) as unknown as OfferRow[];

  const candidateOffers = offers.filter(
    (offer) =>
      !offer.reviewRequired ||
      isUsableMultibuyOffer(offer) ||
      isUsableLimitedOffer(offer),
  );

  const products = (await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      productName: true,
      catalogKey: true,
      quantityValue: true,
      quantityUnit: true,
      quantityText: true,
    },
  })) as unknown as ProductRow[];

  // catalogKey -> product (for FLIPP|matchKey reuse)
  const byCatalogKey = new Map<string, ProductRow>();
  // normalized name -> { exact: [product with same size], nameOnly: [...] }
  const byName = new Map<string, IndexEntry>();
  for (const product of products) {
    if (product.catalogKey) byCatalogKey.set(product.catalogKey, product);
    const name = normalizeText(product.productName);
    const entry = byName.get(name) ?? { exact: [], nameOnly: [] };
    const productSize = normalizeSize(
      product.quantityValue,
      product.quantityUnit,
      product.quantityText,
    );
    const holder: ProductRow = { ...product };
    // pack the size into the row for later comparison
    (holder as ProductRow & { _size?: string })._size = productSize;
    entry.exact.push(holder);
    entry.nameOnly.push(holder);
    byName.set(name, entry);
  }

  const adminService = new AdminFlyerOffersService(prisma);

  let linkedCatalogKey = 0;
  let linkedExact = 0;
  let createdNew = 0;
  let skippedSizeMismatch = 0;
  let approvedMultibuy = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const offer of candidateOffers) {
    const catalogKey = `FLIPP|${offer.matchKey}`;
    const name = normalizeText(offer.productName);
    const size = normalizeSize(offer.quantityValue, offer.quantityUnit, offer.packageSizeText);
    const entry = byName.get(name);
    const exactCandidate = (entry?.exact ?? []).find(
      (p) => (p as ProductRow & { _size?: string })._size === size,
    );
    const nameOnlyCandidate = !exactCandidate && (entry?.nameOnly ?? []).length > 0;

    if (!byCatalogKey.has(catalogKey) && !exactCandidate && nameOnlyCandidate) {
      // Same name but a different package size is a different SKU in
      // practice (e.g. flour 2.5 kg vs 5 kg). Leave it for manual review
      // instead of guessing.
      skippedSizeMismatch++;
      console.log(
        `[SKIP size mismatch] ${offer.retailerName}: ${offer.productName} [${size}] (existing: ${(entry?.nameOnly ?? []).map((p) => `${p.productName} [${(p as ProductRow & { _size?: string })._size}]`).join("; ")})`,
      );
      continue;
    }

    try {
      let disposition: string;
      let product: { id: string; productName: string; catalogKey: string | null };
      if (byCatalogKey.has(catalogKey)) {
        product = byCatalogKey.get(catalogKey)!;
        disposition = "existing (catalogKey)";
        if (apply) {
          await adminService.reviewOffer(
            offer.id,
            { decision: "APPROVE", notes: NOTES },
            reviewer.id,
          );
        }
        linkedCatalogKey++;
      } else if (exactCandidate) {
        product = exactCandidate;
        disposition = "existing (name+size match)";
        if (apply) {
          await adminService.reviewOffer(
            offer.id,
            { decision: "APPROVE", productId: exactCandidate.id, notes: NOTES },
            reviewer.id,
          );
          // Backfill the stable key on legacy products (seeded without
          // catalogKey) so next week's offers dedupe by identity.
          if (!exactCandidate.catalogKey) {
            await prisma.product.update({
              where: { id: exactCandidate.id },
              data: { catalogKey },
            });
            exactCandidate.catalogKey = catalogKey;
            byCatalogKey.set(catalogKey, exactCandidate);
          }
        }
        linkedExact++;
      } else {
        product = {
          id: "(would create)",
          productName: offer.productName,
          catalogKey,
        };
        disposition = "new product";
        if (apply) {
          const decision = await adminService.reviewOffer(
            offer.id,
            { decision: "APPROVE", createProduct: true, notes: NOTES },
            reviewer.id,
          );
          product = decision.product;
        }
        createdNew++;
        // Register the freshly created product so later offers in this batch
        // with the same identity reuse it instead of creating duplicates.
        const created = {
          id: product.id,
          productName: product.productName,
          catalogKey: product.catalogKey,
          quantityValue: offer.quantityValue,
          quantityUnit: offer.quantityUnit,
          quantityText: offer.packageSizeText,
        } as ProductRow & { _size?: string };
        (created as ProductRow & { _size?: string })._size = size;
        byCatalogKey.set(catalogKey, created);
        const createdEntry = byName.get(name) ?? { exact: [], nameOnly: [] };
        createdEntry.exact.push(created);
        createdEntry.nameOnly.push(created);
        byName.set(name, createdEntry);
      }
      console.log(
        `[${apply ? "APPROVED" : "WOULD APPROVE"} ${disposition}${offer.reviewRequired ? " (multibuy)" : ""}] ${offer.retailerName}: ${offer.productName} [${size}] -> ${product.productName}`,
      );
      if (offer.reviewRequired) approvedMultibuy++;
    } catch (error) {
      failed++;
      failures.push(`${offer.id} ${offer.productName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n=== summary ===");
  console.log(`offers considered: ${candidateOffers.length}`);
  console.log(`linked via existing catalogKey: ${linkedCatalogKey}`);
  console.log(`linked via exact name+size match: ${linkedExact}`);
  console.log(`new products created: ${createdNew}`);
  console.log(
    `auto-approved beyond the normalizer (multibuy / limits): ${approvedMultibuy}`,
  );
  console.log(`skipped for size mismatch (manual review): ${skippedSizeMismatch}`);
  console.log(`failures: ${failed}`);
  for (const failure of failures) console.log(`  FAILED ${failure}`);

  if (!apply) {
    console.log("\nDRY RUN — no writes performed. Re-run with --apply to approve.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

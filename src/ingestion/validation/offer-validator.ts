
export interface OfferValidationInput {
    productName?: string | null;
    brand?: string | null;
    retailerName?: string | null;
    storeIdentifier?: string | null;

    advertisedPriceAmount?: number | null;
    quantityValue?: number | null;
    quantityUnit?: string | null;
    quantityText?: string | null;

    unitPrice?: number | null;
    unitPriceBasis?: string | null;
    advertisedPriceUnit?: string | null;
    pricingBasis?: string | null;
    quantityIsApproximate?: boolean;
    isPriceRange?: boolean;

    // Set true only when this offer requires a particular store.
    storeIdentificationRequired?: boolean;

    promotionText?: string | null;
    loyaltyCondition?: string | null;
    minimumPurchaseQuantity?: number | null;
    priceRestriction?: string | null;
    isMemberPrice?: boolean;
    isMultibuy?: boolean;
}

export interface OfferValidationResult {
    accepted: boolean;
    reviewRequired: boolean;
    reasons: string[];
    offerComment: string | null;
}

const present = (value: string | null | undefined): boolean =>
    typeof value === "string" && value.trim().length > 0;

const positive = (value: number | null | undefined): boolean =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0;

export function validateOffer(
    offer: OfferValidationInput,
): OfferValidationResult {
    const reasons: string[] = [];

    // 1. Product identity: brand is optional for generic goods.
    if (!present(offer.productName)) {
        reasons.push("PRODUCT_NAME_MISSING");
    }

    // 2. A usable advertised price is required.
    if (!positive(offer.advertisedPriceAmount)) {
        reasons.push("PRICE_MISSING");
    }

    // 3. Quantity must have an interpretable basis.
    const hasQuantity =
        (positive(offer.quantityValue) &&
            present(offer.quantityUnit)) ||
        present(offer.quantityText) ||
        present(offer.advertisedPriceUnit) ||
        offer.pricingBasis === "PER_KG" ||
        offer.pricingBasis === "PER_LB";

    if (!hasQuantity) {
        reasons.push("QUANTITY_UNIT_MISSING");
    }

    // 4. Unit price must exist or be calculable.
    const hasUnitPrice =
        positive(offer.unitPrice) ||
        (positive(offer.advertisedPriceAmount) &&
            positive(offer.quantityValue) &&
            present(offer.quantityUnit));

    const hasPriceBasis =
        positive(offer.advertisedPriceAmount) &&
        (
            offer.pricingBasis === "PER_KG" ||
            offer.pricingBasis === "PER_LB" ||
            ["each", "ea"].includes(
                offer.advertisedPriceUnit?.toLowerCase() ?? "",
            )
        );

    if (offer.isPriceRange) {
        reasons.push('PACKAGE_SIZE_RANGE');
    } else if (offer.quantityIsApproximate) {
        reasons.push('QUANTITY_REQUIRES_REVIEW');
    }

    if (!hasUnitPrice && !hasPriceBasis) {
        reasons.push("UNIT_PRICE_UNAVAILABLE");
    }

    // 5. Retailer identity.
    if (!present(offer.retailerName)) {
        reasons.push("RETAILER_MISSING");
    }

    // 6. Store identification, when applicable.
    if (
        offer.storeIdentificationRequired &&
        !present(offer.storeIdentifier)
    ) {
        reasons.push("STORE_IDENTIFICATION_MISSING");
    }

    // Preserve promotional conditions as information.
    const comments: string[] = [];

    if (present(offer.promotionText)) {
        comments.push(offer.promotionText!.trim());
    }

    if (present(offer.loyaltyCondition)) {
        comments.push(offer.loyaltyCondition!.trim());
    }

    if (offer.isMemberPrice || offer.priceRestriction === "MEMBER_ONLY") {
        comments.push("Membership conditions apply");
    }

    if (positive(offer.minimumPurchaseQuantity)) {
        comments.push(
            `Minimum purchase: ${offer.minimumPurchaseQuantity}`,
        );
    }

    if (offer.isMultibuy) {
        comments.push("Multibuy promotion; verify purchase conditions");
    }

    if (
        present(offer.priceRestriction) &&
        offer.priceRestriction !== "MEMBER_ONLY"
    ) {
        comments.push(`Price restriction: ${offer.priceRestriction}`);
    }

    const uniqueComments = [...new Set(comments)];

    return {
        accepted: reasons.length === 0,
        reviewRequired: reasons.length > 0,
        reasons,
        offerComment: uniqueComments.length
            ? uniqueComments.join(" | ")
            : null,
    };
}

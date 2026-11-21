
import type { AiAdvertisement } from './ollama-interpreter.js';

export type CandidateStatus =
    | 'READY_FOR_IDENTITY_RESOLUTION'
    | 'REVIEW';

export interface ReconciledProduct {
    sourceName: string | null;
    brand: string | null;
    packageSize: string | null;
    status: CandidateStatus;
    issues: string[];
}

export interface ReconciledAdvertisement {
    products: ReconciledProduct[];
    relationship: AiAdvertisement['relationship'];
    priceText: string | null;
    packageSizeRange: string | null;
    conditions: string[];
    issues: string[];
    requiresReview: boolean;
}

const PACKAGE_SIZE_PATTERN =
    /^(?:\d+\s*[x×]\s*)?\d+(?:[.,]\d+)?\s*(?:kg|g|mg|lb|oz|l|ml|cl)$/i;

const SIZE_RANGE_PATTERN =
    /\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:kg|g|mg|lb|oz|l|ml|cl)\b/i;

function normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function appearsInSource(source: string, value: string): boolean {
    return normalizeText(source).includes(normalizeText(value));
}

/**
 * Checks package-size syntax and direct source evidence.
 *
 * This does not prove canonical product identity.
 * In particular, a range endpoint is not an exact package size.
 */
function validateExactPackageSize(
    source: string,
    value: string | null,
): { value: string | null; issue?: string } {
    if (value === null) {
        return { value: null };
    }

    if (!PACKAGE_SIZE_PATTERN.test(value.trim())) {
        return {
            value: null,
            issue: `Invalid package-size format: "${value}"`,
        };
    }

    const normalizedSource = normalizeText(source);
    const normalizedValue = normalizeText(value);
    let index = normalizedSource.indexOf(normalizedValue);

    while (index !== -1) {
        // Exclude values that appear only as the upper endpoint
        // of a range such as "300-450 g".
        const before = normalizedSource.slice(0, index).trimEnd();
        const isRangeEndpoint = /[-–]$/.test(before);

        // Exclude numbers that appear inside longer numeric values.
        const precedingCharacter =
            index > 0 ? normalizedSource[index - 1] : '';
        const startsInsideNumber = /[\d.,]/.test(precedingCharacter);

        if (!isRangeEndpoint && !startsInsideNumber) {
            return { value };
        }

        index = normalizedSource.indexOf(
            normalizedValue,
            index + 1,
        );
    }

    return {
        value: null,
        issue: `Package size "${value}" lacks independent source evidence.`,
    };
}

/**
 * Reconciles AI suggestions against original advertisement text.
 *
 * Read-only: no database calls, no canonical product creation.
 */
export function reconcileAdvertisement(
    sourceText: string,
    interpretation: AiAdvertisement,
): ReconciledAdvertisement {
    const issues: string[] = [];

    const products: ReconciledProduct[] =
        interpretation.products.map((product, index) => {
            const productIssues: string[] = [];
            const prefix = `products[${index}]`;

            let sourceName: string | null = product.sourceName;

            if (
                !sourceName.trim() ||
                !appearsInSource(sourceText, sourceName)
            ) {
                productIssues.push(
                    `${prefix}: product name is not supported by source text.`,
                );
                sourceName = null;
            }

            let brand = product.brand;

            if (
                brand !== null &&
                (
                    sourceName === null ||
                    !appearsInSource(sourceName, brand)
                )
            ) {
                productIssues.push(
                    `${prefix}: brand "${brand}" is not supported by the product name.`,
                );
                brand = null;
            }

            const packageResult = validateExactPackageSize(
                sourceText,
                product.packageSize,
            );

            if (packageResult.issue) {
                productIssues.push(
                    `${prefix}: ${packageResult.issue}`,
                );
            }

            if (packageResult.value === null) {
                productIssues.push(
                    `${prefix}: exact package size remains unresolved.`,
                );
            }

            return {
                sourceName,
                brand,
                packageSize: packageResult.value,
                status:
                    sourceName !== null &&
                        brand !== null &&
                        packageResult.value !== null &&
                        productIssues.length === 0
                        ? 'READY_FOR_IDENTITY_RESOLUTION'
                        : 'REVIEW',
                issues: productIssues,
            };
        });

    let priceText = interpretation.priceText;

    if (
        priceText !== null &&
        !appearsInSource(sourceText, priceText)
    ) {
        issues.push('Advertised price is not supported by source text.');
        priceText = null;
    }

    let packageSizeRange = interpretation.packageSizeRange;

    if (
        packageSizeRange !== null &&
        (
            !appearsInSource(sourceText, packageSizeRange) ||
            !SIZE_RANGE_PATTERN.test(packageSizeRange)
        )
    ) {
        issues.push('Package-size range is not supported by source text.');
        packageSizeRange = null;
    }

    const conditions = interpretation.conditions.filter(
        (condition) => {
            // These words express product relationships, not
            // promotional eligibility or purchase restrictions.
            if (/^(or|and)$/i.test(condition.trim())) {
                return false;
            }

            if (!appearsInSource(sourceText, condition)) {
                issues.push(
                    `Unverified promotional condition: "${condition}"`,
                );
                return false;
            }

            return true;
        },
    );

    const requiresReview =
        issues.length > 0 ||
        products.length === 0 ||
        products.some((product) => product.status === 'REVIEW');

    return {
        products,
        relationship: interpretation.relationship,
        priceText,
        packageSizeRange,
        conditions,
        issues,
        requiresReview,
    };
}

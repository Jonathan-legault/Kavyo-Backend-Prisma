
export interface IdentityEvidenceInput {
    advertisementName: string;
    advertisementBrand: string | null;
    advertisementDescription: string | null;
    candidateName: string;
    relatedVariantCount: number;
}

export interface IdentityEvidenceResult {
    brand: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;
    quantityText: string | null;
    brandEvidence: 'EXPLICIT_SOURCE' | 'UNASSIGNED';
    packageEvidence:
    | 'EXACT_NAME'
    | 'EXACT_PAIRED_DESCRIPTION'
    | 'NOT_ATTRIBUTED';
    eligibleForMatching: boolean;
    reasons: string[];
}

const normalize = (value: string): string =>
    value
        .normalize('NFKC')
        .toLocaleLowerCase('en-CA')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');

interface PackageMatch {
    value: number;
    unit: string;
    text: string;
    nameWithoutPackage: string;
}

function packageFromName(name: string): PackageMatch | null {
    // Example: "Great Value 16-pack candy canes".
    const count = /\b(\d+)\s*[- ]\s*pack\b/i.exec(name);

    if (count) {
        const value = Number(count[1]);

        if (!Number.isSafeInteger(value) || value <= 0) {
            return null;
        }

        return {
            value,
            unit: 'ct',
            text: `${value} ct`,
            nameWithoutPackage: name,
        };
    }

    // Example: "PC BLUE MENU MARGARINE, 907 g".
    // Single package only; no ranges or multipacks.
    const trailing =
        /,\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*$/i.exec(name);

    if (!trailing) {
        return null;
    }

    const value = Number(trailing[1].replace(',', '.'));

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    const unit = trailing[2].toLowerCase();

    return {
        value,
        unit,
        text: `${value} ${unit}`,
        nameWithoutPackage: name.slice(0, trailing.index).trim(),
    };
}

/**
 * Recover two independently stated package quantities.
 *
 * Supported pattern:
 * Name:        Rogers Granola
 * Description: (750g) or Oats (1kg), Selected Varieties
 *
 * This function attributes quantities only.
 * It does not establish brand association or matching readiness.
 */
function packageFromPairedDescription(
    advertisementName: string,
    description: string | null,
    candidateName: string,
): PackageMatch | null {
    if (!description) {
        return null;
    }

    const pattern =
        /^\s*\(\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*\)\s+or\s+(.+?)\s+\(\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*\)(?:\s*,\s*selected varieties)?\s*$/i;

    const match = pattern.exec(description);

    if (!match) {
        return null;
    }

    const firstProduct = normalize(advertisementName);
    const secondProduct = normalize(match[3]);
    const requestedProduct = normalize(candidateName);

    // Refuse attribution when both alternatives normalize
    // to the same identity.
    if (
        !firstProduct ||
        !secondProduct ||
        firstProduct === secondProduct
    ) {
        return null;
    }

    let value: number;
    let unit: string;

    if (requestedProduct === firstProduct) {
        value = Number(match[1].replace(',', '.'));
        unit = match[2].toLowerCase();
    } else if (requestedProduct === secondProduct) {
        value = Number(match[4].replace(',', '.'));
        unit = match[5].toLowerCase();
    } else {
        return null;
    }

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    return {
        value,
        unit,
        text: `${value} ${unit}`,
        nameWithoutPackage: candidateName,
    };
}

export function attributeIdentityEvidence(
    input: IdentityEvidenceInput,
): IdentityEvidenceResult {
    const reasons: string[] = [];

    const packageMatch = packageFromName(
        input.advertisementName,
    );

    const pairedPackage = packageFromPairedDescription(
        input.advertisementName,
        input.advertisementDescription,
        input.candidateName,
    );

    const comparableName =
        packageMatch?.nameWithoutPackage ??
        input.advertisementName;

    const sameProductName =
        normalize(input.candidateName) ===
        normalize(comparableName);

    const hasAlternatives =
        /\bor\b/i.test(input.advertisementName) ||
        /\bor\b/i.test(input.advertisementDescription ?? '');

    const hasVarieties =
        /\bselected varieties\b/i.test(
            input.advertisementDescription ?? '',
        );

    const grouped =
        hasAlternatives ||
        hasVarieties ||
        input.relatedVariantCount > 0;

    if (!sameProductName) {
        reasons.push('CANDIDATE_NOT_FULL_ADVERTISED_PRODUCT');
    }

    if (grouped) {
        reasons.push('GROUPED_OR_VARIETY_ADVERTISEMENT');
    }

    if (!packageMatch && !pairedPackage) {
        reasons.push('EXACT_CANDIDATE_PACKAGE_NOT_FOUND');
    }

    const brandText =
        input.advertisementBrand?.trim() || null;

    if (!brandText) {
        reasons.push('EXPLICIT_ADVERTISEMENT_BRAND_MISSING');
    }

    // Brand assignment remains conservative.
    // A grouped advertisement's shared brand field does
    // not establish a brand for each alternative.
    const attributable =
        sameProductName && !grouped;

    const brand =
        attributable ? brandText : null;

    // For grouped advertisements, an explicitly paired
    // description can establish a package quantity,
    // but cannot make the product match-ready by itself.
    const assignedPackage =
        attributable ? packageMatch : pairedPackage;

    const packageEvidence:
        IdentityEvidenceResult['packageEvidence'] =
        assignedPackage
            ? attributable
                ? 'EXACT_NAME'
                : 'EXACT_PAIRED_DESCRIPTION'
            : 'NOT_ATTRIBUTED';

    return {
        brand,
        quantityValue: assignedPackage?.value ?? null,
        quantityUnit: assignedPackage?.unit ?? null,
        quantityText: assignedPackage?.text ?? null,
        brandEvidence: brand
            ? 'EXPLICIT_SOURCE'
            : 'UNASSIGNED',
        packageEvidence,
        eligibleForMatching:
            attributable &&
            !!brand &&
            !!assignedPackage,
        reasons,
    };
}

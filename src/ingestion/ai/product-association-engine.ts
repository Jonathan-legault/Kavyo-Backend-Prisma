
import type { AdvertisementInput } from './advertisement-input.js';
import type {
    ValidatedCandidate,
} from './source-aware-interpreter.js';

export interface BrandAssociation {
    candidateName: string;
    sourcePhrase: string;
    brand: string;
    basis: 'POSITIONAL_ALIGNMENT';
    evidence: {
        brandText: string;
        advertisementName: string;
        brandPosition: number;
        productPosition: number;
    };
    status: 'HYPOTHESIS_REVIEW';
}

export interface AssociationResult {
    brandsMentioned: string[];
    productCandidates: string[];
    proposedAssociations: BrandAssociation[];
    unresolvedBrands: string[];
    unresolvedProducts: string[];
    warnings: string[];
    eligibleForAutomaticPromotion: false;
}

/**
 * Extract distinct brand alternatives from the Flipp brand field.
 *
 * Examples:
 * "SWISS CHALET | MARCANGELO"
 * "Brand1 or Brand2"
 *
 * Does not resolve aliases or verify product-brand relationships.
 */
export function extractBrandAlternatives(
    brandText: string | null,
): string[] {
    if (!brandText?.trim()) return [];

    const alternatives = brandText
        .split(/\s*\|\s*|\s+or\s+/i)
        .map((brand) => brand.trim())
        .filter(Boolean);

    const seen = new Set<string>();

    return alternatives.filter((brand) => {
        const key = normalized(brand);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

function normalized(value: string): string {
    return value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Checks whether candidate source phrases occur in their
 * proposed order within the advertisement name.
 *
 * Order is supporting evidence, not proof of brand identity.
 */
function areProductsInSourceOrder(
    advertisementName: string,
    candidates: ValidatedCandidate[],
): boolean {
    const source = normalized(advertisementName);
    let previousEnd = 0;

    for (const candidate of candidates) {
        const phrase = normalized(candidate.sourcePhrase);

        if (!phrase) return false;

        const position = source.indexOf(phrase, previousEnd);

        if (position < 0) return false;

        previousEnd = position + phrase.length;
    }

    return true;
}

/**
 * Produces review-only brand association hypotheses.
 *
 * Current rule:
 * - Use source-supported product phrases from the main name.
 * - Preserve description-derived candidates separately.
 * - Require equal counts of brands and main-name candidates.
 * - Require product phrases to occur in source order.
 * - Do not infer package sizes or create canonical products.
 *
 * This is a deliberately narrow positional heuristic.
 */
export function associateProductBrands(
    input: Pick<AdvertisementInput, 'name' | 'brandText'>,
    candidates: ValidatedCandidate[],
): AssociationResult {
    const brandsMentioned = extractBrandAlternatives(
        input.brandText,
    );

    const usableCandidates = candidates.filter(
        (candidate) => candidate.status !== 'REJECTED',
    );

    // Only product phrases from the advertisement name
    // are eligible for this positional association rule.
    const nameCandidates = usableCandidates.filter(
        (candidate) => candidate.sourceField === 'name',
    );

    // These may be additional products, varieties or attributes.
    // Their roles have not yet been established.
    const descriptionCandidates = usableCandidates.filter(
        (candidate) => candidate.sourceField === 'description',
    );

    const productCandidates = usableCandidates.map(
        (candidate) => candidate.candidateName,
    );

    const warnings: string[] = [];
    const proposedAssociations: BrandAssociation[] = [];

    function unresolved(): AssociationResult {
        return {
            brandsMentioned,
            productCandidates,
            proposedAssociations: [],
            unresolvedBrands: [...brandsMentioned],
            unresolvedProducts: [...productCandidates],
            warnings,
            eligibleForAutomaticPromotion: false,
        };
    }

    // A rejected AI candidate means the extraction contains
    // invalid evidence. Do not attempt positional pairing.
    if (
        candidates.some(
            (candidate) => candidate.status === 'REJECTED',
        )
    ) {
        warnings.push(
            'Rejected AI candidates exist; positional association blocked.',
        );
        return unresolved();
    }

    if (brandsMentioned.length < 2) {
        warnings.push(
            'Fewer than two distinct brands; no positional association.',
        );
        return unresolved();
    }

    if (nameCandidates.length < 2) {
        warnings.push(
            'Fewer than two usable product groups in advertisement name.',
        );
        return unresolved();
    }

    if (brandsMentioned.length !== nameCandidates.length) {
        warnings.push(
            'Brand and main-name product counts differ; positional association blocked.',
        );
        return unresolved();
    }

    const uniqueNames = new Set(
        nameCandidates.map(
            (candidate) => normalized(candidate.candidateName),
        ),
    );

    if (uniqueNames.size !== nameCandidates.length) {
        warnings.push(
            'Duplicate main-name product candidates; positional association blocked.',
        );
        return unresolved();
    }

    if (!areProductsInSourceOrder(input.name, nameCandidates)) {
        warnings.push(
            'Main-name product order could not be verified.',
        );
        return unresolved();
    }

    // If a brand already appears within a candidate name,
    // positional matching could override direct evidence.
    // Leave those records for a future explicit-association rule.
    const containsBrand = nameCandidates.some((candidate) =>
        brandsMentioned.some((brand) =>
            normalized(candidate.candidateName).includes(
                normalized(brand),
            ),
        ),
    );

    if (containsBrand) {
        warnings.push(
            'Brand wording appears in a product name; use direct evidence instead.',
        );
        return unresolved();
    }

    // Propose one-to-one associations based on ordering.
    // These are hypotheses, NOT verified relationships.
    for (let i = 0; i < nameCandidates.length; i++) {
        const candidate = nameCandidates[i];
        const brand = brandsMentioned[i];

        proposedAssociations.push({
            candidateName: candidate.candidateName,
            sourcePhrase: candidate.sourcePhrase,
            brand,
            basis: 'POSITIONAL_ALIGNMENT',
            evidence: {
                brandText: input.brandText ?? '',
                advertisementName: input.name,
                brandPosition: i,
                productPosition: i,
            },
            status: 'HYPOTHESIS_REVIEW',
        });
    }

    if (descriptionCandidates.length > 0) {
        warnings.push(
            'Description-derived candidates remain unclassified and unassociated.',
        );
    }

    warnings.push(
        'Brand assignments are positional hypotheses, not verified identities.',
    );

    return {
        brandsMentioned,
        productCandidates,
        proposedAssociations,

        // Brands now have proposed associations, but the proposals
        // still require independent verification.
        unresolvedBrands: [],

        // Do not discard additional products or varieties.
        unresolvedProducts: descriptionCandidates.map(
            (candidate) => candidate.candidateName,
        ),

        warnings,
        eligibleForAutomaticPromotion: false,
    };
}

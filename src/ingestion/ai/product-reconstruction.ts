
/**
 * Deterministic, read-only reconstruction of grouped Flipp ads.
 *
 * Outputs are review-only hypotheses. This module does not
 * access Prisma, create Products, or publish offers.
 */

export interface ReconstructionInput {
    sourceItemId: string;
    name: string;
    brand: string | null;
    description: string | null;
}

export interface ReconstructionCandidate {
    candidateId: string;
    sourceItemId: string;
    productName: string;
    brand: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;

    evidence: Array<{
        field: 'name' | 'brand' | 'description';
        text: string;
    }>;

    reconstructionMethod:
    | 'BRAND_PRODUCT_CROSS_COMBINATION'
    | 'PAIRED_PRODUCT_QUANTITY';

    reviewReasons: string[];
    status: 'RECONSTRUCTION_REVIEW';
    automaticPromotionEligible: false;
}

function norm(value: string): string {
    return value.normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('en-CA');
}

function sourceContains(
    source: string | null,
    phrase: string,
): boolean {
    return !!source && norm(source).includes(norm(phrase));
}

function addCandidate(
    results: ReconstructionCandidate[],
    input: ReconstructionInput,
    data: Omit<
        ReconstructionCandidate,
        | 'candidateId'
        | 'sourceItemId'
        | 'status'
        | 'automaticPromotionEligible'
    >,
): void {
    results.push({
        ...data,
        candidateId: `${input.sourceItemId}:reconstructed:${results.length}`,
        sourceItemId: input.sourceItemId,
        status: 'RECONSTRUCTION_REVIEW',
        automaticPromotionEligible: false,
    });
}

function reconstructBrandProductAlternatives(
    input: ReconstructionInput,
): ReconstructionCandidate[] {
    const results: ReconstructionCandidate[] = [];

    // Supports a narrow, explicit source pattern:
    // Brand A or Brand B shampoo or conditioner
    //
    // Do not generalize to arbitrary "or" expressions.
    const match = input.name.match(
        /^(.+?)\s+or\s+(.+?)\s+(shampoo|body wash)\s+or\s+(conditioner|bar soap)\s*$/i,
    );

    if (!match) return results;

    const brands = [match[1].trim(), match[2].trim()];
    const products = [match[3].trim(), match[4].trim()];

    if (
        !brands.every(Boolean) ||
        !products.every(Boolean) ||
        norm(brands[0]) === norm(brands[1]) ||
        norm(products[0]) === norm(products[1])
    ) {
        return results;
    }

    // All four source fragments must actually occur
    // within the advertisement name.
    if (
        ![...brands, ...products].every(
            phrase => sourceContains(input.name, phrase),
        )
    ) {
        return results;
    }

    for (const brand of brands) {
        for (const product of products) {
            addCandidate(results, input, {
                productName: `${brand} ${product}`,

                // The source presents alternative brands and
                // products; it does not verify each pairing.
                brand: null,
                quantityValue: null,
                quantityUnit: null,

                reconstructionMethod:
                    'BRAND_PRODUCT_CROSS_COMBINATION',

                evidence: [
                    { field: 'name', text: brand },
                    { field: 'name', text: product },
                ],

                reviewReasons: [
                    'BRAND_PRODUCT_PAIRING_UNVERIFIED',
                    'COMBINED_NAME_NOT_CONTIGUOUS_SOURCE',
                    'PACKAGE_NOT_ATTRIBUTED',
                ],
            });
        }
    }

    return results;
}

function reconstructPairedQuantities(
    input: ReconstructionInput,
): ReconstructionCandidate[] {
    const results: ReconstructionCandidate[] = [];

    if (!input.description) return results;

    // Supports:
    // Name: Rogers Granola
    // Desc: (750g) or Oats (1kg), Selected Varieties
    const match = input.description.match(
        /^\s*\(\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*\)\s+or\s+(.+?)\s+\(\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s*\)(?:\s*,\s*selected varieties)?\s*$/i,
    );

    if (!match) return results;

    const firstValue = Number(match[1].replace(',', '.'));
    const secondValue = Number(match[4].replace(',', '.'));

    const secondName = match[3].trim();

    if (
        !Number.isFinite(firstValue) ||
        !Number.isFinite(secondValue) ||
        firstValue <= 0 ||
        secondValue <= 0 ||
        !secondName ||
        norm(input.name) === norm(secondName)
    ) {
        return results;
    }

    const alternatives = [
        {
            name: input.name,
            value: firstValue,
            unit: match[2].toLowerCase(),
            sourceNameField: 'name' as const,
            quantityText: match[0].match(
                /\(\s*\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\s*\)/i,
            )?.[0] ?? '',
        },
        {
            name: secondName,
            value: secondValue,
            unit: match[5].toLowerCase(),
            sourceNameField: 'description' as const,
            quantityText: match[0].match(
                /or\s+.+?\s+(\(\s*\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\s*\))/i,
            )?.[1] ?? '',
        },
    ];

    for (const alternative of alternatives) {
        if (
            !sourceContains(
                alternative.sourceNameField === 'name'
                    ? input.name
                    : input.description,
                alternative.name,
            ) ||
            !sourceContains(
                input.description,
                alternative.quantityText,
            )
        ) {
            return [];
        }

        addCandidate(results, input, {
            productName: alternative.name,
            brand: null,
            quantityValue: alternative.value,
            quantityUnit: alternative.unit,

            reconstructionMethod: 'PAIRED_PRODUCT_QUANTITY',

            evidence: [
                {
                    field: alternative.sourceNameField,
                    text: alternative.name,
                },
                {
                    field: 'description',
                    text: alternative.quantityText,
                },
            ],

            reviewReasons: [
                'GROUPED_ADVERTISEMENT',
                'BRAND_ASSOCIATION_REQUIRES_REVIEW',
            ],
        });
    }

    return results;
}

export function reconstructProducts(
    input: ReconstructionInput,
): ReconstructionCandidate[] {
    if (!input.sourceItemId.trim() || !input.name.trim()) {
        return [];
    }

    const paired = reconstructPairedQuantities(input);

    if (paired.length > 0) return paired;

    return reconstructBrandProductAlternatives(input);
}

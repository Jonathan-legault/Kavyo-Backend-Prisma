
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    extractSourceAwareCandidates,
} from '../src/ingestion/ai/source-aware-interpreter.js';

import {
    associateProductBrands,
} from '../src/ingestion/ai/product-association-engine.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';

async function main(): Promise<void> {
    const itemId = process.argv[2] ?? '1051020056';

    if (!/^\d+$/.test(itemId)) {
        throw new Error('Item ID must contain only digits.');
    }

    const file = resolve(
        'data',
        'research',
        'flipp',
        CAPTURE,
        'items',
        `${itemId}.json`,
    );

    const record = JSON.parse(
        readFileSync(file, 'utf8'),
    ) as FlippCaptureRecord;

    const input = fromFlippRecord(record);

    const extraction = await extractSourceAwareCandidates(input);

    const associations = associateProductBrands(
        input,
        extraction.candidates,
    );

    console.log('\n=== ADVERTISEMENT ===');
    console.log(JSON.stringify({
        id: input.sourceItemId,
        retailer: input.retailer,
        name: input.name,
        brandText: input.brandText,
        description: input.description,
        advertisedPrice: input.currentPrice,
    }, null, 2));

    console.log('\n=== EXTRACTED PRODUCT CANDIDATES ===');
    console.log(JSON.stringify(
        extraction.candidates.map((candidate) => ({
            name: candidate.candidateName,
            sourcePhrase: candidate.sourcePhrase,
            sourceField: candidate.sourceField,
            status: candidate.status,
            issues: candidate.issues,
        })),
        null,
        2,
    ));

    console.log('\n=== PROPOSED BRAND ASSOCIATIONS ===');
    console.log(JSON.stringify(
        associations.proposedAssociations,
        null,
        2,
    ));

    console.log('\n=== UNRESOLVED INFORMATION ===');
    console.log(JSON.stringify({
        brands: associations.unresolvedBrands,
        products: associations.unresolvedProducts,
        warnings: [
            ...extraction.warnings,
            ...associations.warnings,
        ],
    }, null, 2));

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify({
        extractedCandidates: extraction.candidates.length,
        proposedAssociations:
            associations.proposedAssociations.length,
        automaticPromotionEligible:
            associations.eligibleForAutomaticPromotion,
        model: extraction.model,
        elapsedMs: extraction.elapsedMs,
    }, null, 2));
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

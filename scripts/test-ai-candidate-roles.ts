
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
    classifyCandidateRoles,
} from '../src/ingestion/ai/candidate-role-classifier.js';

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

    const classification = await classifyCandidateRoles(
        input,
        extraction.candidates,
    );

    console.log('\n=== SOURCE ===');
    console.log(JSON.stringify({
        id: input.sourceItemId,
        name: input.name,
        description: input.description,
        brandText: input.brandText,
    }, null, 2));

    console.log('\n=== CLASSIFIED CANDIDATES ===');
    console.log(JSON.stringify(
        classification.candidates.map((candidate) => ({
            ...candidate,
            proposedParentName:
                candidate.proposedParentIndex === null
                    ? null
                    : classification.candidates[
                        candidate.proposedParentIndex
                    ]?.candidateName ?? null,
        })),
        null,
        2,
    ));

    console.log('\n=== WARNINGS ===');
    console.log(JSON.stringify([
        ...extraction.warnings,
        ...classification.warnings,
    ], null, 2));

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify({
        totalCandidates: classification.candidates.length,
        productFamilies: classification.candidates.filter(
            (c) => c.role === 'PRODUCT_FAMILY' &&
                c.classificationStatus !== 'REJECTED',
        ).length,
        variants: classification.candidates.filter(
            (c) => c.role === 'VARIANT' &&
                c.classificationStatus !== 'REJECTED',
        ).length,
        attributes: classification.candidates.filter(
            (c) => c.role === 'ATTRIBUTE' &&
                c.classificationStatus !== 'REJECTED',
        ).length,
        unknown: classification.candidates.filter(
            (c) => c.role === 'UNKNOWN' &&
                c.classificationStatus !== 'REJECTED',
        ).length,
        rejected: classification.candidates.filter(
            (c) => c.classificationStatus === 'REJECTED',
        ).length,
        model: classification.model,
        extractionMs: extraction.elapsedMs,
        classificationMs: classification.elapsedMs,
        automaticPromotionEligible: false,
    }, null, 2));
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

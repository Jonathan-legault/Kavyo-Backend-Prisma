
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    extractSourceAwareCandidates,
} from '../src/ingestion/ai/source-aware-interpreter.js';

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

    console.log('\n=== SOURCE DATA ===');
    console.log(JSON.stringify({
        id: input.sourceItemId,
        retailer: input.retailer,
        name: input.name,
        description: input.description,
        brandText: input.brandText,
        currentPrice: input.currentPrice,
    }, null, 2));

    const result = await extractSourceAwareCandidates(input);

    console.log('\n=== SOURCE-AWARE CANDIDATES ===');
    console.log(JSON.stringify(result.candidates, null, 2));

    console.log('\n=== VALIDATION WARNINGS ===');
    console.log(JSON.stringify(result.warnings, null, 2));

    console.log('\n=== UNCERTAINTIES ===');
    console.log(JSON.stringify(result.uncertainties, null, 2));

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify({
        sourceItemId: input.sourceItemId,
        candidateCount: result.candidates.length,
        supportedPhrases: result.candidates.filter(
            (c) => c.status === 'SUPPORTED_PHRASE',
        ).length,
        reconstructionReview: result.candidates.filter(
            (c) => c.status === 'RECONSTRUCTION_REVIEW',
        ).length,
        rejected: result.candidates.filter(
            (c) => c.status === 'REJECTED',
        ).length,
        model: result.model,
        elapsedMs: result.elapsedMs,
    }, null, 2));
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

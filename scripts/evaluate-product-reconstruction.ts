
import {
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';

import { join, resolve } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    reconstructProducts,
} from '../src/ingestion/ai/product-reconstruction.js';

const ROOT = resolve(
    'data',
    'research',
    'flipp',
    '2026-11-11T13-30-04-198Z',
);

const EVALUATION = join(ROOT, 'analysis', 'ai-heldout-v1');

const V3 = join(
    EVALUATION,
    'runs-scope-v3',
    'qwen3_8b',
);

const OUTPUT = join(
    EVALUATION,
    'reconstruction-v1',
);

interface Sample {
    items: Array<{ id: string; name: string }>;
}

interface V3Record {
    id: string;
    status: string;
}

function readJson<T>(file: string): T {
    return JSON.parse(
        readFileSync(file, 'utf8'),
    ) as T;
}

function csv(value: unknown): string {
    const text = String(value ?? '');
    const safe = /^\s*[=+@-]/.test(text)
        ? `'${text}`
        : text;

    return `"${safe.replace(/"/g, '""')}"`;
}

function main(): void {
    const sample = readJson<Sample>(
        join(EVALUATION, 'sample.json'),
    );

    if (
        !Array.isArray(sample.items) ||
        sample.items.length !== 30 ||
        new Set(sample.items.map(i => i.id)).size !== 30
    ) {
        throw new Error('Invalid 30-item evaluation manifest');
    }

    const results = [];
    const records = [];

    for (const item of sample.items) {
        const v3 = readJson<V3Record>(
            join(V3, `${item.id}.json`),
        );

        if (v3.id !== item.id) {
            throw new Error(`V3 identity mismatch: ${item.id}`);
        }

        if (
            v3.status === 'FILTERED_PROMOTIONAL' ||
            v3.status === 'FILTERED_OUT_OF_SCOPE'
        ) {
            records.push({
                id: item.id,
                status: 'FILTERED',
                reconstructed: 0,
            });
            continue;
        }

        if (
            v3.status !== 'PROCESSED' &&
            v3.status !== 'SCOPE_REVIEW'
        ) {
            throw new Error(
                `Unexpected V3 status for ${item.id}: ${v3.status}`,
            );
        }

        const record = readJson<FlippCaptureRecord>(
            join(ROOT, 'items', `${item.id}.json`),
        );

        const source = fromFlippRecord(record);

        if (
            source.sourceItemId !== item.id ||
            source.name !== item.name
        ) {
            throw new Error(
                `Source mismatch: ${item.id}`,
            );
        }

        const reconstructed = reconstructProducts({
            sourceItemId: source.sourceItemId,
            name: source.name,
            brand: source.brandText,
            description: source.description,
        });

        results.push(...reconstructed);

        records.push({
            id: item.id,
            status: v3.status,
            reconstructed: reconstructed.length,
        });
    }

    const summary = {
        version: 1,
        inputAdvertisements: sample.items.length,
        accountedFor: records.length,
        filteredAdvertisements: records.filter(
            r => r.status === 'FILTERED',
        ).length,
        advertisementsWithReconstructions:
            records.filter(r => r.reconstructed > 0).length,
        reconstructedHypotheses: results.length,
        verifiedCanonicalProducts: 0,
        matchingAttempted: false,
        automaticPromotionEligible: 0,
        databaseWrites: false,
    };

    mkdirSync(OUTPUT, { recursive: true });

    writeFileSync(
        join(OUTPUT, 'hypotheses.json'),
        JSON.stringify(results, null, 2) + '\n',
    );

    writeFileSync(
        join(OUTPUT, 'summary.json'),
        JSON.stringify(summary, null, 2) + '\n',
    );

    const headers = [
        'candidateId',
        'sourceItemId',
        'productName',
        'brand',
        'quantityValue',
        'quantityUnit',
        'reconstructionMethod',
        'status',
        'reviewReasons',
    ] as const;

    const lines = [
        headers.map(csv).join(','),
        ...results.map(result => {
            const row = {
                ...result,
                reviewReasons: result.reviewReasons.join('|'),
            };

            return headers.map(
                key => csv(row[key]),
            ).join(',');
        }),
    ];

    writeFileSync(
        join(OUTPUT, 'hypotheses.csv'),
        lines.join('\n') + '\n',
    );

    console.log('\n=== PRODUCT RECONSTRUCTION V1 ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nOutput: ${OUTPUT}`);
}

main();

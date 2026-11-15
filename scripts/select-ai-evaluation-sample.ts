
import {
    mkdirSync,
    readFileSync,
    readdirSync,
    writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';
const ROOT = resolve('data', 'research', 'flipp', CAPTURE);
const OUT = join(ROOT, 'analysis', 'ai-heldout-v1');

const EXCLUDED = new Set([
    '1051020056', // Swiss Chalet / Marcangelo
    '1051020096', // Maple Leaf / Lilydale
    '1050932883', // Armstrong cheese
    '1050932988', // Nabob / Starbucks
    '1051020196', // Pulled chicken / pork
]);

type Stratum =
    | 'NAME_ALTERNATIVES'
    | 'DESCRIPTION_ALTERNATIVES'
    | 'OTHER';

interface SampleRow {
    id: string;
    retailer: string;
    name: string;
    description: string | null;
    brandText: string | null;
    currentPrice: string | null;
    stratum: Stratum;
}

function getStratum(
    name: string,
    description: string | null,
): Stratum {
    if (/\bor\b/i.test(name)) {
        return 'NAME_ALTERNATIVES';
    }

    if (description && /\bor\b/i.test(description)) {
        return 'DESCRIPTION_ALTERNATIVES';
    }

    return 'OTHER';
}

function stableRank(id: string): string {
    return createHash('sha256')
        .update(`kavyo-heldout-v1:${id}`)
        .digest('hex');
}

function csvCell(value: string | null): string {
    const text = value ?? '';
    return `"${text.replace(/"/g, '""')}"`;
}

function main(): void {
    mkdirSync(OUT, { recursive: true });

    const itemsDir = join(ROOT, 'items');
    const pools: Record<Stratum, SampleRow[]> = {
        NAME_ALTERNATIVES: [],
        DESCRIPTION_ALTERNATIVES: [],
        OTHER: [],
    };

    for (const filename of readdirSync(itemsDir)) {
        if (!/^\d+\.json$/.test(filename)) continue;

        const id = filename.slice(0, -5);
        if (EXCLUDED.has(id)) continue;

        try {
            const record = JSON.parse(
                readFileSync(join(itemsDir, filename), 'utf8'),
            ) as FlippCaptureRecord;

            const item = fromFlippRecord(record);

            if (item.sourceItemId !== id) continue;

            const stratum = getStratum(
                item.name,
                item.description,
            );

            pools[stratum].push({
                id,
                retailer: item.retailer,
                name: item.name,
                description: item.description,
                brandText: item.brandText,
                currentPrice: item.currentPrice,
                stratum,
            });
        } catch (error) {
            console.warn(`Skipping unreadable item ${filename}:`, error);
        }
    }

    const selected: SampleRow[] = [];

    for (const stratum of [
        'NAME_ALTERNATIVES',
        'DESCRIPTION_ALTERNATIVES',
        'OTHER',
    ] as const) {
        const pool = pools[stratum];

        pool.sort((a, b) =>
            stableRank(a.id).localeCompare(stableRank(b.id)),
        );

        if (pool.length < 10) {
            throw new Error(
                `Not enough records for ${stratum}: ${pool.length}`,
            );
        }

        selected.push(...pool.slice(0, 10));
    }

    const sampleFile = join(OUT, 'sample.json');
    const reviewFile = join(OUT, 'human-review.csv');

    writeFileSync(
        sampleFile,
        JSON.stringify({
            version: 1,
            capture: CAPTURE,
            selectionRule: 'SHA256 deterministic ranking',
            excludedDevelopmentIds: [...EXCLUDED],
            items: selected,
        }, null, 2),
        'utf8',
    );

    const header = [
        'id',
        'stratum',
        'retailer',
        'name',
        'description',
        'brandText',
        'currentPrice',
        'expectedProductFamilies',
        'expectedVariants',
        'reviewNotes',
    ];

    const lines = [
        header.map(csvCell).join(','),
        ...selected.map((row) =>
            [
                row.id,
                row.stratum,
                row.retailer,
                row.name,
                row.description,
                row.brandText,
                row.currentPrice,
                '',
                '',
                '',
            ].map(csvCell).join(','),
        ),
    ];

    writeFileSync(
        reviewFile,
        lines.join('\n') + '\n',
        'utf8',
    );

    console.log('\n=== FROZEN EVALUATION SAMPLE ===');

    for (const stratum of Object.keys(pools) as Stratum[]) {
        console.log(
            `${stratum}: ${selected.filter(
                (row) => row.stratum === stratum,
            ).length}`,
        );
    }

    console.log(`Total: ${selected.length}`);
    console.log(`Sample: ${sampleFile}`);
    console.log(`Review: ${reviewFile}`);

    console.log('\nSelected IDs:');
    for (const item of selected) {
        console.log(`${item.id} | ${item.stratum} | ${item.name}`);
    }
}

main();

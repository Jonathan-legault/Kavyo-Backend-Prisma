
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    extractProductGroups,
} from '../src/ingestion/ai/product-group-interpreter.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';

async function main(): Promise<void> {
    const itemId = process.argv[2] ?? '1051020056';

    if (!/^\d+$/.test(itemId)) {
        throw new Error('Item ID must contain only digits.');
    }

    const path = resolve(
        'data',
        'research',
        'flipp',
        CAPTURE,
        'items',
        `${itemId}.json`,
    );

    const record = JSON.parse(
        readFileSync(path, 'utf8'),
    ) as FlippCaptureRecord;

    const source = fromFlippRecord(record);

    // These values come from Flipp, not AI.
    // Brand assignment is intentionally unresolved.
    const sourceFacts = {
        sourceItemId: source.sourceItemId,
        retailer: source.retailer,
        name: source.name,
        brandsMentioned: source.brandText
            ?.split('|')
            .map((brand) => brand.trim())
            .filter(Boolean) ?? [],
        description: source.description,
        advertisedPriceText: source.currentPrice,
        currency: null,
    };

    console.log('\n=== SOURCE FACTS ===');
    console.log(JSON.stringify(sourceFacts, null, 2));

    const result = await extractProductGroups(source);

    console.log('\n=== AI GROUP EXTRACTION ===');
    console.log(JSON.stringify({
        groups: result.groups,
        model: result.model,
    }, null, 2));

    console.log('\n=== VALIDATION ===');
    console.log(JSON.stringify({
        validGroups: result.validGroups,
        rejectedGroups: result.rejectedGroups,
        warnings: result.warnings,
    }, null, 2));

    console.log('\n=== PERFORMANCE ===');
    console.log(`Elapsed: ${result.elapsedMs} ms`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

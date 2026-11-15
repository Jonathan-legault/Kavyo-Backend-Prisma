
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    interpretAdvertisement,
} from '../src/ingestion/ai/ollama-interpreter.js';

const capture =
    '2026-11-11T13-30-04-198Z';

async function main(): Promise<void> {
    const itemId = process.argv[2] ?? '1051020056';

    if (!/^\d+$/.test(itemId)) {
        throw new Error('Item ID must contain only digits.');
    }

    const path = resolve(
        'data',
        'research',
        'flipp',
        capture,
        'items',
        `${itemId}.json`,
    );

    const record = JSON.parse(
        readFileSync(path, 'utf8'),
    ) as FlippCaptureRecord;

    const input = fromFlippRecord(record);

    console.log('\n=== ORIGINAL STRUCTURED INPUT ===');
    console.log(JSON.stringify(input, null, 2));

    const result = await interpretAdvertisement(input);

    console.log('\n=== AI INTERPRETATION ===');
    console.log(
        JSON.stringify(result.interpretation, null, 2),
    );

    console.log('\n=== EVIDENCE WARNINGS ===');
    console.log(JSON.stringify(result.warnings, null, 2));

    console.log('\n=== PERFORMANCE ===');
    console.log(`Model: ${result.model}`);
    console.log(`Time: ${result.elapsedMs} ms`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

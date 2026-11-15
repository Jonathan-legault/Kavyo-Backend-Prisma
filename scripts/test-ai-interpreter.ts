
import { interpretAdvertisement } from '../src/ingestion/ai/ollama-interpreter.js';
import { reconcileAdvertisement } from '../src/ingestion/ai/advertisement-reconciler.js';

async function main(): Promise<void> {
    const advertisement =
        'TILDA PURE BASMATI RICE OR 817 ELEPHANT BRAND BASMATI RICE';

    console.log('\n=== ORIGINAL ADVERTISEMENT ===');
    console.log(advertisement);

    // Step 1: Ask the local language model to interpret the ad.
    const result = await interpretAdvertisement(advertisement);

    console.log('\n=== AI INTERPRETATION ===');
    console.log(JSON.stringify(result.interpretation, null, 2));

    // Step 2: Independently reconcile the AI output
    // against the original source advertisement.
    const reconciled = reconcileAdvertisement(
        advertisement,
        result.interpretation,
    );

    console.log('\n=== RECONCILED RESULT ===');
    console.log(JSON.stringify(reconciled, null, 2));

    console.log('\n=== INTERPRETER WARNINGS ===');
    console.log(JSON.stringify(result.warnings, null, 2));

    console.log('\n=== PERFORMANCE ===');
    console.log(`Model: ${result.model}`);
    console.log(`Processing time: ${result.elapsedMs} ms`);
}

main().catch((error: unknown) => {
    console.error('AI interpretation failed:', error);
    process.exitCode = 1;
});

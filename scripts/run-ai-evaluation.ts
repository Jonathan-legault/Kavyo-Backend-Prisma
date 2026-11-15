
import {
    existsSync,
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
    extractSourceAwareCandidates,
} from '../src/ingestion/ai/source-aware-interpreter.js';

import {
    classifyCandidateRoles,
} from '../src/ingestion/ai/candidate-role-classifier.js';

import {
    checkAdvertisementEligibility,
} from '../src/ingestion/validation/advertisement-eligibility.js';

import {
    classifyGroceryScope,
    type ScopeResult,
} from '../src/ingestion/scope/grocery-scope.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';

const ROOT = resolve('data', 'research', 'flipp', CAPTURE);
const EVALUATION = join(ROOT, 'analysis', 'ai-heldout-v1');

type EvaluationStatus =
    | 'PROCESSED'
    | 'SCOPE_REVIEW'
    | 'FILTERED_PROMOTIONAL'
    | 'FILTERED_OUT_OF_SCOPE'
    | 'FAILED';

interface SampleItem {
    id: string;
    retailer: string;
    name: string;
    stratum: string;
}

interface Sample {
    version: number;
    capture: string;
    items: SampleItem[];
}

interface ExtractionData {
    candidates: unknown[];
    warnings: string[];
    elapsedMs: number;
    model: string;
}

interface ClassificationData {
    candidates: Array<{
        role: string;
        classificationStatus: string;
    }>;
    warnings: string[];
    elapsedMs: number;
    model: string;
}

interface SavedAiResult {
    id: string;
    model: string;
    source: {
        retailer: string;
        name: string;
        brandText: string | null;
        description: string | null;
        currentPrice: string | null;
    };
    extraction: ExtractionData | null;
    classification: ClassificationData | null;
}

interface Result {
    id: string;
    stratum: string;
    model: string;
    status: Exclude<EvaluationStatus, 'FAILED'>;
    reason: string | null;
    scope: ScopeResult | null;
    source: SavedAiResult['source'];
    extraction: ExtractionData | null;
    classification: ClassificationData | null;
    reusedFrom: string | null;
    automaticPromotionEligible: false;
}

interface Row {
    id: string;
    retailer: string;
    name: string;
    stratum: string;
    status: EvaluationStatus;
    scopeStatus: string;
    scopeCategory: string;
    reason: string;
    scopeRule: string;
    scopeEvidence: string;
    model: string;
    extracted: number;
    families: number;
    variants: number;
    attributes: number;
    unknown: number;
    rejected: number;
    warnings: number;
    elapsedMs: number;
    reusedFrom: string;
    error: string;
}

function readJson<T>(file: string): T {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function writeJson(file: string, value: unknown): void {
    writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function csvCell(value: unknown): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function sourceFrom(
    input: ReturnType<typeof fromFlippRecord>,
): SavedAiResult['source'] {
    return {
        retailer: input.retailer,
        name: input.name,
        brandText: input.brandText,
        description: input.description,
        currentPrice: input.currentPrice,
    };
}

function sameSource(
    left: SavedAiResult['source'],
    right: SavedAiResult['source'],
): boolean {
    return (
        left.retailer === right.retailer &&
        left.name === right.name &&
        left.brandText === right.brandText &&
        left.description === right.description &&
        left.currentPrice === right.currentPrice
    );
}

function isAiResultValid(
    data: SavedAiResult,
    id: string,
    model: string,
    source: SavedAiResult['source'],
): boolean {
    return (
        data.id === id &&
        data.model === model &&
        !!data.source &&
        sameSource(data.source, source) &&
        !!data.extraction &&
        !!data.classification &&
        data.extraction.model === model &&
        data.classification.model === model &&
        Array.isArray(data.extraction.candidates) &&
        Array.isArray(data.classification.candidates) &&
        Array.isArray(data.extraction.warnings) &&
        Array.isArray(data.classification.warnings)
    );
}

function emptyRow(
    item: SampleItem,
    model: string,
): Row {
    return {
        id: item.id,
        retailer: item.retailer,
        name: item.name,
        stratum: item.stratum,
        status: 'FAILED',
        scopeStatus: '',
        scopeCategory: '',
        reason: '',
        scopeRule: '',
        scopeEvidence: '',
        model,
        extracted: 0,
        families: 0,
        variants: 0,
        attributes: 0,
        unknown: 0,
        rejected: 0,
        warnings: 0,
        elapsedMs: 0,
        reusedFrom: '',
        error: '',
    };
}

function summarize(
    item: SampleItem,
    model: string,
    result: Result,
): Row {
    const row = emptyRow(item, model);
    row.status = result.status;
    row.reason = result.reason ?? '';
    row.scopeStatus = result.scope?.status ?? '';
    row.scopeCategory = result.scope?.category ?? '';
    row.scopeRule = result.scope?.matchedRule ?? '';
    row.scopeEvidence = result.scope?.matchEvidence ?? '';
    row.reusedFrom = result.reusedFrom ?? '';

    if (!result.extraction || !result.classification) {
        return row;
    }

    const classes = result.classification.candidates;
    const accepted = classes.filter(
        (c) => c.classificationStatus !== 'REJECTED',
    );

    const count = (role: string): number =>
        accepted.filter((c) => c.role === role).length;

    row.extracted = result.extraction.candidates.length;
    row.families = count('PRODUCT_FAMILY');
    row.variants = count('VARIANT');
    row.attributes = count('ATTRIBUTE');
    row.unknown = count('UNKNOWN');
    row.rejected = classes.length - accepted.length;
    row.warnings =
        result.extraction.warnings.length +
        result.classification.warnings.length;
    row.elapsedMs =
        result.extraction.elapsedMs +
        result.classification.elapsedMs;

    return row;
}

async function main(): Promise<void> {
    const model = process.env.OLLAMA_MODEL ?? 'qwen3:8b';

    if (!/^[a-zA-Z0-9_.:-]+$/.test(model)) {
        throw new Error('Invalid model identifier.');
    }

    const sample = readJson<Sample>(
        join(EVALUATION, 'sample.json'),
    );

    if (
        sample.version !== 1 ||
        sample.capture !== CAPTURE ||
        !Array.isArray(sample.items) ||
        sample.items.length !== 30 ||
        new Set(sample.items.map((x) => x.id)).size !== 30
    ) {
        throw new Error('Evaluation manifest mismatch.');
    }

    const folder = model.replace(/:/g, '_');

    const baselineDir = join(EVALUATION, 'runs', folder);
    const v2Dir = join(EVALUATION, 'runs-eligibility-v2', folder);
    const v3Dir = join(EVALUATION, 'runs-scope-v3', folder);

    mkdirSync(v3Dir, { recursive: true });

    const rows: Row[] = [];
    let reused = 0;
    let freshInference = 0;
    let failed = 0;

    for (const item of sample.items) {
        const outputFile = join(v3Dir, `${item.id}.json`);

        try {
            const record = readJson<FlippCaptureRecord>(
                join(ROOT, 'items', `${item.id}.json`),
            );

            const input = fromFlippRecord(record);

            if (
                input.sourceItemId !== item.id ||
                input.name !== item.name
            ) {
                throw new Error('Source/manifest mismatch.');
            }

            const source = sourceFrom(input);

            // Gate 1: reject explicit non-product advertisements.
            const eligibility = checkAdvertisementEligibility(input);

            // Gate 2: reuse Kavyo's existing product-scope rules.
            const scope = classifyGroceryScope({
                name: input.name,
                description: input.description,
                brand: input.brandText,
            });

            const status: Result['status'] =
                eligibility.status === 'REJECT'
                    ? 'FILTERED_PROMOTIONAL'
                    : scope.status === 'OUT_OF_SCOPE'
                        ? 'FILTERED_OUT_OF_SCOPE'
                        : scope.status === 'REVIEW'
                            ? 'SCOPE_REVIEW'
                            : 'PROCESSED';

            const reason =
                eligibility.status === 'REJECT'
                    ? eligibility.reason
                    : scope.reason;

            let extraction: ExtractionData | null = null;
            let classification: ClassificationData | null = null;
            let reusedFrom: string | null = null;

            const shouldInterpret =
                status === 'PROCESSED' ||
                status === 'SCOPE_REVIEW';

            if (shouldInterpret) {
                // Check v3 first, then v2, then original baseline.
                // Existing original benchmark results remain untouched.
                const candidates = [
                    { dir: v3Dir, label: 'v3' },
                    { dir: v2Dir, label: 'v2' },
                    { dir: baselineDir, label: 'v1' },
                ];

                for (const cached of candidates) {
                    const file = join(cached.dir, `${item.id}.json`);

                    if (!existsSync(file)) continue;

                    const previous = readJson<SavedAiResult>(file);

                    // A filtered v2 result has no AI data and
                    // therefore cannot be reused for interpretation.
                    if (!isAiResultValid(previous, item.id, model, source)) {
                        continue;
                    }

                    extraction = previous.extraction;
                    classification = previous.classification;
                    reusedFrom = cached.label;
                    reused++;
                    break;
                }

                if (!extraction || !classification) {
                    console.log(`[AI] ${item.id}: ${input.name}`);

                    const extracted = await extractSourceAwareCandidates(
                        input,
                    );

                    const classified = await classifyCandidateRoles(
                        input,
                        extracted.candidates,
                    );

                    if (
                        extracted.model !== model ||
                        classified.model !== model
                    ) {
                        throw new Error('Ollama model mismatch.');
                    }

                    extraction = extracted;
                    classification = classified;
                    freshInference++;
                }
            }

            const result: Result = {
                id: item.id,
                stratum: item.stratum,
                model,
                status,
                reason,
                scope,
                source,
                extraction,
                classification,
                reusedFrom,
                automaticPromotionEligible: false,
            };

            // v3 is isolated from previous benchmark outputs.
            writeJson(outputFile, result);

            rows.push(summarize(item, model, result));

            console.log(
                `[${status}] ${item.id} ${scope.category}` +
                (reusedFrom ? ` (reused ${reusedFrom})` : ''),
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error);

            const row = emptyRow(item, model);
            row.error = message;
            rows.push(row);
            failed++;

            console.error(`[FAILED] ${item.id}: ${message}`);
        }
    }

    // Preserve exactly one result per sample record.
    if (
        rows.length !== 30 ||
        new Set(rows.map((row) => row.id)).size !== 30
    ) {
        throw new Error('Evaluation accounting invariant failed.');
    }

    const headers: Array<keyof Row> = [
        'id',
        'retailer',
        'name',
        'stratum',
        'status',
        'scopeStatus',
        'scopeCategory',
        'reason',
        'scopeRule',
        'scopeEvidence',
        'model',
        'extracted',
        'families',
        'variants',
        'attributes',
        'unknown',
        'rejected',
        'warnings',
        'elapsedMs',
        'reusedFrom',
        'error',
    ];

    const csv = [
        headers.map(csvCell).join(','),
        ...rows.map((row) =>
            headers.map((key) => csvCell(row[key])).join(','),
        ),
    ].join('\n') + '\n';

    writeFileSync(join(v3Dir, 'summary.csv'), csv, 'utf8');

    const counts = {
        processed: rows.filter(
            (r) => r.status === 'PROCESSED',
        ).length,
        scopeReview: rows.filter(
            (r) => r.status === 'SCOPE_REVIEW',
        ).length,
        filteredPromotional: rows.filter(
            (r) => r.status === 'FILTERED_PROMOTIONAL',
        ).length,
        filteredOutOfScope: rows.filter(
            (r) => r.status === 'FILTERED_OUT_OF_SCOPE',
        ).length,
        failed,
    };

    const sum = (key: keyof Row): number =>
        rows.reduce((total, row) => {
            const value = row[key];
            return total +
                (typeof value === 'number' ? value : 0);
        }, 0);

    const summary = {
        evaluationVersion: 3,
        model,
        sampleSize: 30,
        ...counts,
        accountedFor: rows.length,
        reused,
        freshInference,
        totalExtracted: sum('extracted'),
        totalFamilies: sum('families'),
        totalVariants: sum('variants'),
        totalRejected: sum('rejected'),
        totalWarnings: sum('warnings'),
    };

    writeJson(join(v3Dir, 'summary.json'), summary);

    console.log('\n=== EVALUATION SUMMARY V3 ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nResults: ${v3Dir}`);

    if (
        counts.processed +
        counts.scopeReview +
        counts.filteredPromotional +
        counts.filteredOutOfScope +
        counts.failed !== 30
    ) {
        throw new Error('Status totals do not equal 30.');
    }

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

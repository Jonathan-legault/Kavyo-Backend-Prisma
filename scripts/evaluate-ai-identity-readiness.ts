
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import {
    classifyGroceryScope,
} from '../src/ingestion/scope/grocery-scope.js';

import {
    assessProductReadiness,
    type ProductIdentityCandidate,
} from '../src/ingestion/product/product-readiness.js';

import {
    matchProduct,
    type ExistingProductIdentity,
} from '../src/ingestion/product/product-matcher.js';

import {
    fromFlippRecord,
    type FlippCaptureRecord,
} from '../src/ingestion/ai/advertisement-input.js';

import {
    attributeIdentityEvidence,
} from '../src/ingestion/ai/identity-evidence.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';

const SOURCE_ITEMS = resolve(
    'data',
    'research',
    'flipp',
    CAPTURE,
    'items',
);

const BASE = resolve(
    'data',
    'research',
    'flipp',
    CAPTURE,
    'analysis',
    'ai-heldout-v1',
);

const INPUT = join(
    BASE,
    'identity-handoff-v1',
    'qwen3_8b',
    'candidates.json',
);

const OUTPUT = join(
    BASE,
    'identity-readiness-v1',
    'qwen3_8b',
);

interface HandoffCandidate {
    candidateId: string;
    sourceItemId: string;
    retailer: string;
    candidateName: string;
    sourcePhrase: string;
    sourceField: 'name' | 'description';
    inheritedWords: string[];
    extractionStatus: string;
    scopeStatus: 'IN_SCOPE' | 'REVIEW';
    scopeCategory: string;
    sourceBrandText: string | null;
    brandHypothesis: string | null;
    relatedVariants: unknown[];
    identityStatus: string;
    automaticPromotionEligible: false;
}

type Decision =
    | 'MATCH_EXISTING'
    | 'CREATE_CANDIDATE'
    | 'REVIEW'
    | 'REJECT'
    | 'OUT_OF_SCOPE';

interface DecisionRow {
    candidateId: string;
    sourceItemId: string;
    retailer: string;
    candidateName: string;
    sourcePhrase: string;
    sourceField: string;
    nameEvidence: string;
    advertisementScope: string;
    candidateScope: string;
    candidateScopeReason: string;
    brandEvidence: string;
    packageEvidence: string;
    readinessStatus: string;
    matcherInvoked: boolean;
    decision: Decision;
    productId: string;
    matchMethod: string;
    blockingReasons: string;
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function writeJson(path: string, value: unknown): void {
    writeFileSync(
        path,
        JSON.stringify(value, null, 2) + '\n',
        'utf8',
    );
}

function csvCell(value: unknown): string {
    const text = String(value ?? '');

    // Prevent spreadsheet formula execution on CSV import.
    const safe = /^[\s]*[=+@-]/.test(text)
        ? "'" + text
        : text;

    return `"${safe.replace(/"/g, '""')}"`;
}

function normalized(value: string): string {
    return value
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('en-CA');
}

function option(name: string): string | undefined {
    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
        if (args[i] === `--${name}`) {
            if (!args[i + 1]) {
                throw new Error(`Missing value for --${name}`);
            }
            return args[i + 1];
        }

        if (args[i].startsWith(`--${name}=`)) {
            return args[i].slice(name.length + 3);
        }
    }

    return undefined;
}

function evaluate(
    candidate: HandoffCandidate,
    catalog: readonly ExistingProductIdentity[] | null,
): DecisionRow {
    if (
        !candidate.candidateId ||
        !candidate.sourceItemId ||
        !candidate.candidateName ||
        !candidate.sourcePhrase ||
        candidate.automaticPromotionEligible !== false
    ) {
        throw new Error(
            `Invalid handoff candidate: ${candidate.candidateId}`,
        );
    }

    // Candidate-level scope can differ from advertisement scope.
    const scope = classifyGroceryScope({
        name: candidate.candidateName,
    });

    const directName =
        candidate.extractionStatus === 'SUPPORTED_PHRASE' &&
        normalized(candidate.candidateName) ===
        normalized(candidate.sourcePhrase) &&
        candidate.inheritedWords.length === 0;

    const nameEvidence = directName
        ? 'DIRECT_SOURCE_PHRASE'
        : 'RECONSTRUCTION_REVIEW';

    const reasons: string[] = [];

    if (!directName) {
        reasons.push('NAME_RECONSTRUCTION_REVIEW');
    }

    if (candidate.scopeStatus === 'REVIEW') {
        reasons.push('ADVERTISEMENT_SCOPE_REVIEW');
    }

    if (scope.status === 'REVIEW') {
        reasons.push(`CANDIDATE_SCOPE_${scope.reason}`);
    }

    if (scope.status === 'OUT_OF_SCOPE') {
        reasons.push(`CANDIDATE_OUT_OF_SCOPE_${scope.reason}`);
    }


    // Reload the original Flipp advertisement.
    const sourceRecord = readJson<FlippCaptureRecord>(
        join(SOURCE_ITEMS, `${candidate.sourceItemId}.json`),
    );

    const source = fromFlippRecord(sourceRecord);

    // Verify that the original source matches the handoff.
    if (
        source.sourceItemId !== candidate.sourceItemId ||
        source.brandText !== candidate.sourceBrandText
    ) {
        throw new Error(
            `Original source mismatch: ${candidate.candidateId}`,
        );
    }

    // Recover explicitly attributable brand and package evidence.
    // Do not assign shared quantities to unrelated alternatives.
    const evidence = attributeIdentityEvidence({
        advertisementName: source.name,
        advertisementBrand: source.brandText,
        advertisementDescription: source.description,
        candidateName: candidate.candidateName,
        relatedVariantCount: candidate.relatedVariants.length,
    });

    reasons.push(...evidence.reasons);

    // AI-inferred brand associations remain review-only.
    if (candidate.brandHypothesis) {
        reasons.push('BRAND_HYPOTHESIS_UNVERIFIED');
    }

    // Only source-attributed identity fields are supplied.
    // Flipp SKUs are not treated as verified GTINs.
    const productIdentity: ProductIdentityCandidate = {
        productName: candidate.candidateName,
        brand: evidence.brand,
        barcode: null,
        quantityValue: evidence.quantityValue,
        quantityUnit: evidence.quantityUnit,
        quantityText: evidence.quantityText,
        quantityIsApproximate: false,
        isMultiVariant: candidate.relatedVariants.length > 0,
        isPriceRange: false,
    };


    const readiness = assessProductReadiness(productIdentity);

    reasons.push(...readiness.reasons);

    if (
        catalog === null &&
        evidence.eligibleForMatching &&
        directName &&
        candidate.scopeStatus === 'IN_SCOPE' &&
        scope.status === 'IN_SCOPE' &&
        readiness.status === 'READY_FOR_MATCH'
    ) {
        reasons.push('CATALOG_NOT_LOADED');
    }

    const row: DecisionRow = {
        candidateId: candidate.candidateId,
        sourceItemId: candidate.sourceItemId,
        retailer: candidate.retailer,
        candidateName: candidate.candidateName,
        sourcePhrase: candidate.sourcePhrase,
        sourceField: candidate.sourceField,
        nameEvidence,
        advertisementScope: candidate.scopeStatus,
        candidateScope: scope.status,
        candidateScopeReason: scope.reason,
        brandEvidence: evidence.brandEvidence,
        packageEvidence: evidence.packageEvidence,
        readinessStatus: readiness.status,
        matcherInvoked: false,
        decision: 'REVIEW',
        productId: '',
        matchMethod: '',
        blockingReasons: '',
    };

    if (scope.status === 'OUT_OF_SCOPE') {
        row.decision = 'OUT_OF_SCOPE';
    } else if (readiness.status === 'REJECT') {
        row.decision = 'REJECT';
    } else if (
        reasons.length === 0 &&
        readiness.status === 'READY_FOR_MATCH' &&
        catalog !== null
    ) {
        // Reuse Kavyo's existing matcher only after all
        // identity and provenance checks pass.
        const match = matchProduct(productIdentity, catalog);

        row.matcherInvoked = true;
        row.decision = match.status;
        row.productId = match.productId ?? '';
        row.matchMethod = match.matchMethod ?? '';

        reasons.push(...match.reasons);
    }

    row.blockingReasons = [...new Set(reasons)].join('|');

    return row;
}

function main(): void {
    if (!existsSync(INPUT)) {
        throw new Error(
            `AI handoff missing. Run export-ai-identity-handoff.ts first: ${INPUT}`,
        );
    }

    const candidates = readJson<HandoffCandidate[]>(INPUT);

    if (!Array.isArray(candidates)) {
        throw new Error('Expected candidate array.');
    }

    const catalogPath = option('catalog-json');
    const catalog = catalogPath
        ? readJson<ExistingProductIdentity[]>(resolve(catalogPath))
        : null;

    if (catalog !== null && !Array.isArray(catalog)) {
        throw new Error('Expected catalog identity array.');
    }

    if (
        new Set(candidates.map((c) => c.candidateId)).size !==
        candidates.length
    ) {
        throw new Error('Duplicate candidate identifiers.');
    }

    const rows = candidates.map(
        (candidate) => evaluate(candidate, catalog),
    );

    const decisions: Record<Decision, number> = {
        MATCH_EXISTING: 0,
        CREATE_CANDIDATE: 0,
        REVIEW: 0,
        REJECT: 0,
        OUT_OF_SCOPE: 0,
    };

    const blockers: Record<string, number> = {};

    for (const row of rows) {
        decisions[row.decision]++;

        for (const reason of row.blockingReasons.split('|')) {
            if (reason) {
                blockers[reason] = (blockers[reason] ?? 0) + 1;
            }
        }
    }

    const summary = {
        version: 1,
        inputCandidates: candidates.length,
        accountedFor: rows.length,
        catalogLoaded: catalog !== null,
        catalogSize: catalog?.length ?? null,
        matcherInvocations: rows.filter(
            (r) => r.matcherInvoked,
        ).length,
        decisions,
        blockingReasons: blockers,
        canonicalProductsCreated: 0,
        databaseWrites: false,
    };

    mkdirSync(OUTPUT, { recursive: true });

    writeJson(join(OUTPUT, 'decisions.json'), rows);
    writeJson(join(OUTPUT, 'summary.json'), summary);

    const headers: Array<keyof DecisionRow> = [
        'candidateId',
        'sourceItemId',
        'retailer',
        'candidateName',
        'sourcePhrase',
        'sourceField',
        'nameEvidence',
        'advertisementScope',
        'candidateScope',
        'candidateScopeReason',
        'brandEvidence',
        'packageEvidence',
        'readinessStatus',
        'matcherInvoked',
        'decision',
        'productId',
        'matchMethod',
        'blockingReasons',
    ];

    const csv = [
        headers.map(csvCell).join(','),
        ...rows.map(
            (row) =>
                headers.map((key) => csvCell(row[key])).join(','),
        ),
    ].join('\n') + '\n';

    writeFileSync(
        join(OUTPUT, 'decisions.csv'),
        csv,
        'utf8',
    );

    console.log('\n=== AI IDENTITY READINESS V1 ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nOutput: ${OUTPUT}`);
}

main();

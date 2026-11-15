
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

import type {
    ValidatedCandidate,
} from '../src/ingestion/ai/source-aware-interpreter.js';

import type {
    ClassifiedCandidate,
} from '../src/ingestion/ai/candidate-role-classifier.js';

import {
    associateProductBrands,
} from '../src/ingestion/ai/product-association-engine.js';

import type {
    ScopeResult,
} from '../src/ingestion/scope/grocery-scope.js';

const CAPTURE = '2026-11-11T13-30-04-198Z';
const MODEL = 'qwen3:8b';

const ROOT = resolve(
    'data', 'research', 'flipp', CAPTURE,
);

const EVALUATION = join(
    ROOT, 'analysis', 'ai-heldout-v1',
);

const V3 = join(
    EVALUATION, 'runs-scope-v3', 'qwen3_8b',
);

const OUT = join(
    EVALUATION, 'identity-handoff-v1', 'qwen3_8b',
);

type RecordStatus =
    | 'PROCESSED'
    | 'SCOPE_REVIEW'
    | 'FILTERED_PROMOTIONAL'
    | 'FILTERED_OUT_OF_SCOPE';

interface Sample {
    version: number;
    capture: string;
    items: Array<{ id: string; name: string }>;
}

interface SavedV3 {
    id: string;
    model: string;
    status: RecordStatus;
    scope: ScopeResult | null;
    source: {
        retailer: string;
        name: string;
        brandText: string | null;
        description: string | null;
        currentPrice: string | null;
    };
    extraction: {
        candidates: ValidatedCandidate[];
        warnings: string[];
    } | null;
    classification: {
        candidates: ClassifiedCandidate[];
        warnings: string[];
    } | null;
}

interface VariantEvidence {
    name: string;
    sourcePhrase: string;
    sourceField: string;
    relationshipStatus: 'HYPOTHESIS_REVIEW';
}

interface IdentityCandidate {
    candidateId: string;
    sourceItemId: string;
    retailer: string;
    advertisementName: string;
    advertisementPriceText: string | null;
    advertisedCurrency: null;
    sourceBrandText: string | null;

    candidateName: string;
    sourcePhrase: string;
    sourceField: 'name' | 'description';
    inheritedWords: string[];
    extractionStatus: ValidatedCandidate['status'];

    scopeStatus: 'IN_SCOPE' | 'REVIEW';
    scopeCategory: string;

    brandHypothesis: string | null;
    brandAssociationBasis: string | null;
    brandAssociationStatus: 'HYPOTHESIS_REVIEW' | null;

    relatedVariants: VariantEvidence[];

    identityStatus:
    | 'MATCH_PENDING'
    | 'SCOPE_REVIEW';
    requiresReview: true;
    canonicalProductId: null;
    automaticPromotionEligible: false;
}

interface SkippedRecord {
    sourceItemId: string;
    status: RecordStatus;
    reason: string;
}

function readJson<T>(file: string): T {
    return JSON.parse(
        readFileSync(file, 'utf8'),
    ) as T;
}

function writeJson(file: string, value: unknown): void {
    writeFileSync(
        file,
        JSON.stringify(value, null, 2),
        'utf8',
    );
}

function csvCell(value: unknown): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function validateSavedResult(
    saved: SavedV3,
    item: { id: string; name: string },
): void {
    if (
        saved.id !== item.id ||
        saved.model !== MODEL ||
        saved.source?.name !== item.name ||
        ![
            'PROCESSED',
            'SCOPE_REVIEW',
            'FILTERED_PROMOTIONAL',
            'FILTERED_OUT_OF_SCOPE',
        ].includes(saved.status)
    ) {
        throw new Error(`Invalid V3 result for ${item.id}`);
    }

    if (
        saved.status === 'PROCESSED' ||
        saved.status === 'SCOPE_REVIEW'
    ) {
        if (
            !saved.scope ||
            !saved.extraction ||
            !saved.classification ||
            !Array.isArray(saved.extraction.candidates) ||
            !Array.isArray(saved.classification.candidates) ||
            saved.extraction.candidates.length !==
            saved.classification.candidates.length
        ) {
            throw new Error(
                `Incomplete AI interpretation for ${item.id}`,
            );
        }
    }
}

function csvReport(candidates: IdentityCandidate[]): string {
    const headers = [
        'candidateId',
        'sourceItemId',
        'retailer',
        'candidateName',
        'sourcePhrase',
        'sourceField',
        'extractionStatus',
        'scopeStatus',
        'scopeCategory',
        'brandHypothesis',
        'brandAssociationStatus',
        'identityStatus',
        'advertisementPriceText',
        'relatedVariants',
        'requiresReview',
    ] as const;

    const lines = [
        headers.map(csvCell).join(','),
        ...candidates.map((candidate) => {
            const row = {
                ...candidate,
                relatedVariants: candidate.relatedVariants
                    .map((variant) => variant.name)
                    .join(' | '),
            };

            return headers
                .map((key) => csvCell(row[key]))
                .join(',');
        }),
    ];

    return lines.join('\n') + '\n';
}

function main(): void {
    const sample = readJson<Sample>(
        join(EVALUATION, 'sample.json'),
    );

    if (
        sample.version !== 1 ||
        sample.capture !== CAPTURE ||
        sample.items.length !== 30 ||
        new Set(sample.items.map((i) => i.id)).size !== 30
    ) {
        throw new Error('Unexpected evaluation manifest.');
    }

    const candidates: IdentityCandidate[] = [];
    const skipped: SkippedRecord[] = [];

    let processedRecords = 0;
    let scopeReviewRecords = 0;
    let classifiedFamilies = 0;
    let associatedHypotheses = 0;

    for (const item of sample.items) {
        const saved = readJson<SavedV3>(
            join(V3, `${item.id}.json`),
        );

        validateSavedResult(saved, item);

        // Independently verify the original source record.
        const sourceRecord = readJson<FlippCaptureRecord>(
            join(ROOT, 'items', `${item.id}.json`),
        );

        const source = fromFlippRecord(sourceRecord);

        if (
            source.sourceItemId !== saved.id ||
            source.name !== saved.source.name ||
            source.retailer !== saved.source.retailer ||
            source.description !== saved.source.description ||
            source.brandText !== saved.source.brandText ||
            source.currentPrice !== saved.source.currentPrice
        ) {
            throw new Error(
                `Original source and V3 result disagree: ${item.id}`,
            );
        }

        // Never hand off filtered advertisements.
        if (
            saved.status === 'FILTERED_PROMOTIONAL' ||
            saved.status === 'FILTERED_OUT_OF_SCOPE'
        ) {
            skipped.push({
                sourceItemId: item.id,
                status: saved.status,
                reason: saved.scope?.reason ?? 'PRE_AI_FILTER',
            });

            continue;
        }

        if (!saved.extraction || !saved.classification || !saved.scope) {
            throw new Error(`Missing analysis for ${item.id}`);
        }

        if (
            saved.status === 'PROCESSED' &&
            saved.scope.status !== 'IN_SCOPE'
        ) {
            throw new Error(`Scope mismatch: ${item.id}`);
        }

        if (
            saved.status === 'SCOPE_REVIEW' &&
            saved.scope.status !== 'REVIEW'
        ) {
            throw new Error(`Review mismatch: ${item.id}`);
        }

        if (saved.status === 'PROCESSED') {
            processedRecords++;
        } else {
            scopeReviewRecords++;
        }

        const extracted = saved.extraction.candidates;
        const classified = saved.classification.candidates;

        // Check alignment before joining the two AI stages.
        for (let index = 0; index < extracted.length; index++) {
            if (
                classified[index].index !== index ||
                classified[index].candidateName !==
                extracted[index].candidateName ||
                classified[index].sourceField !==
                extracted[index].sourceField ||
                classified[index].extractionStatus !==
                extracted[index].status
            ) {
                throw new Error(
                    `Candidate/classification mismatch: ${item.id}:${index}`,
                );
            }
        }

        const familyIndices = classified
            .filter((role, index) =>
                role.index === index &&
                role.role === 'PRODUCT_FAMILY' &&
                role.classificationStatus !== 'REJECTED' &&
                extracted[index].status !== 'REJECTED'
            )
            .map((role) => role.index);

        classifiedFamilies += familyIndices.length;

        // Only recognized product families may participate
        // in positional brand-association hypotheses.
        const familyCandidates = familyIndices.map(
            (index) => extracted[index],
        );

        const association = associateProductBrands(
            source,
            familyCandidates,
        );

        const brandByName = new Map(
            association.proposedAssociations.map(
                (proposal) => [
                    proposal.candidateName.toLowerCase(),
                    proposal,
                ] as const,
            ),
        );

        for (const index of familyIndices) {
            const candidate = extracted[index];
            const classification = classified[index];

            const brandProposal = brandByName.get(
                candidate.candidateName.toLowerCase(),
            );

            const relatedVariants: VariantEvidence[] = [];

            for (let i = 0; i < classified.length; i++) {
                const variantRole = classified[i];
                const variant = extracted[i];

                if (
                    variantRole.role !== 'VARIANT' ||
                    variantRole.classificationStatus === 'REJECTED' ||
                    variant.status === 'REJECTED' ||
                    variantRole.proposedParentIndex !== index
                ) {
                    continue;
                }

                relatedVariants.push({
                    name: variant.candidateName,
                    sourcePhrase: variant.sourcePhrase,
                    sourceField: variant.sourceField,
                    relationshipStatus: 'HYPOTHESIS_REVIEW',
                });
            }

            if (brandProposal) associatedHypotheses++;

            candidates.push({
                candidateId: `${item.id}:${index}`,
                sourceItemId: item.id,
                retailer: source.retailer,

                advertisementName: source.name,
                advertisementPriceText: source.currentPrice,
                advertisedCurrency: null,
                sourceBrandText: source.brandText,

                candidateName: candidate.candidateName,
                sourcePhrase: candidate.sourcePhrase,
                sourceField: candidate.sourceField,
                inheritedWords: candidate.inheritedWords,
                extractionStatus: candidate.status,

                scopeStatus: saved.scope.status as
                    'IN_SCOPE' | 'REVIEW',
                scopeCategory: saved.scope.category,

                brandHypothesis: brandProposal?.brand ?? null,
                brandAssociationBasis:
                    brandProposal?.basis ?? null,
                brandAssociationStatus:
                    brandProposal?.status ?? null,

                relatedVariants,

                identityStatus:
                    saved.status === 'SCOPE_REVIEW'
                        ? 'SCOPE_REVIEW'
                        : 'MATCH_PENDING',

                requiresReview: true,
                canonicalProductId: null,
                automaticPromotionEligible: false,
            });
        }
    }

    mkdirSync(OUT, { recursive: true });

    const summary = {
        version: 1,
        model: MODEL,
        sampleSize: sample.items.length,
        processedRecords,
        scopeReviewRecords,
        filteredRecords: skipped.length,
        classifiedFamilies,
        handoffCandidates: candidates.length,
        brandHypotheses: associatedHypotheses,
        matchingAttempted: false,
        canonicalProductsCreated: 0,
        databaseWrites: false,
    };

    if (
        processedRecords +
        scopeReviewRecords +
        skipped.length !== 30
    ) {
        throw new Error('Handoff accounting failed.');
    }

    if (candidates.length !== classifiedFamilies) {
        throw new Error('Candidate count mismatch.');
    }

    writeJson(
        join(OUT, 'candidates.json'),
        candidates,
    );

    writeFileSync(
        join(OUT, 'candidates.csv'),
        csvReport(candidates),
        'utf8',
    );

    writeJson(
        join(OUT, 'skipped-records.json'),
        skipped,
    );

    writeJson(
        join(OUT, 'summary.json'),
        summary,
    );

    console.log('\n=== AI IDENTITY HANDOFF V1 ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nOutput: ${OUT}`);
}

main();

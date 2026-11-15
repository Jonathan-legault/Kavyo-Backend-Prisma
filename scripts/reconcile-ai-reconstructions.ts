
/**
 * Read-only reconciliation of AI product-family candidates
 * with deterministic reconstruction hypotheses.
 *
 * No Prisma, catalog mutations, or automatic promotion.
 */

import {
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(
    'data',
    'research',
    'flipp',
    '2026-11-11T13-30-04-198Z',
    'analysis',
    'ai-heldout-v1',
);

const HANDOFF = join(
    ROOT,
    'identity-handoff-v1',
    'qwen3_8b',
    'candidates.json',
);

const RECONSTRUCTIONS = join(
    ROOT,
    'reconstruction-v1',
    'hypotheses.json',
);

const OUTPUT = join(ROOT, 'reconciliation-v1');

interface AiCandidate {
    candidateId: string;
    sourceItemId: string;
    candidateName: string;
    extractionStatus: string;
    automaticPromotionEligible: false;
}

interface Hypothesis {
    candidateId: string;
    sourceItemId: string;
    productName: string;
    brand: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;
    reconstructionMethod:
    | 'BRAND_PRODUCT_CROSS_COMBINATION'
    | 'PAIRED_PRODUCT_QUANTITY';
    status: 'RECONSTRUCTION_REVIEW';
    automaticPromotionEligible: false;
    reviewReasons: string[];
    evidence: Array<{
        field: string;
        text: string;
    }>;
}

type Relationship =
    | 'EXACT_CANDIDATE_ENRICHMENT'
    | 'FRAGMENT_COMBINATION_REVIEW'
    | 'UNRESOLVED_REVIEW';

interface ReconciliationRow {
    hypothesisId: string;
    sourceItemId: string;
    productName: string;
    reconstructionMethod: string;
    relationship: Relationship;
    exactCandidateId: string | null;
    relatedCandidateIds: string[];
    relatedCandidateNames: string[];
    quantityValue: number | null;
    quantityUnit: string | null;
    reviewReasons: string[];
    status: 'RECONCILIATION_REVIEW';
    automaticPromotionEligible: false;
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
    return value
        .normalize('NFKC')
        .toLocaleLowerCase('en-CA')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function containsWords(
    completeName: string,
    fragment: string,
): boolean {
    const complete = normalize(completeName);
    const part = normalize(fragment);

    return !!part && (
        complete === part ||
        complete.startsWith(`${part} `) ||
        complete.endsWith(` ${part}`) ||
        complete.includes(` ${part} `)
    );
}

function csvCell(value: unknown): string {
    const text = String(value ?? '');
    const safe = /^\s*[=+@-]/.test(text)
        ? `'${text}`
        : text;

    return `"${safe.replace(/"/g, '""')}"`;
}

function main(): void {
    const candidates = readJson<AiCandidate[]>(HANDOFF);
    const hypotheses = readJson<Hypothesis[]>(
        RECONSTRUCTIONS,
    );

    if (
        !Array.isArray(candidates) ||
        !Array.isArray(hypotheses)
    ) {
        throw new Error('Invalid reconciliation inputs');
    }

    if (
        new Set(candidates.map(x => x.candidateId)).size !==
        candidates.length
    ) {
        throw new Error('Duplicate AI candidate IDs');
    }

    if (
        new Set(hypotheses.map(x => x.candidateId)).size !==
        hypotheses.length
    ) {
        throw new Error('Duplicate hypothesis IDs');
    }

    const rows: ReconciliationRow[] = [];

    for (const hypothesis of hypotheses) {
        if (
            hypothesis.status !== 'RECONSTRUCTION_REVIEW' ||
            hypothesis.automaticPromotionEligible !== false
        ) {
            throw new Error(
                `Unsafe reconstruction: ${hypothesis.candidateId}`,
            );
        }

        const sameAdvertisement = candidates.filter(
            candidate =>
                candidate.sourceItemId === hypothesis.sourceItemId &&
                candidate.extractionStatus !== 'REJECTED' &&
                candidate.automaticPromotionEligible === false,
        );

        const exact = sameAdvertisement.filter(
            candidate =>
                normalize(candidate.candidateName) ===
                normalize(hypothesis.productName),
        );

        const fragments = sameAdvertisement.filter(
            candidate =>
                containsWords(
                    hypothesis.productName,
                    candidate.candidateName,
                ),
        );

        let relationship: Relationship;
        let related: AiCandidate[];

        if (exact.length === 1) {
            relationship = 'EXACT_CANDIDATE_ENRICHMENT';
            related = exact;
        } else if (
            hypothesis.reconstructionMethod ===
            'BRAND_PRODUCT_CROSS_COMBINATION' &&
            fragments.length >= 2
        ) {
            relationship = 'FRAGMENT_COMBINATION_REVIEW';
            related = fragments;
        } else {
            relationship = 'UNRESOLVED_REVIEW';
            related = [];
        }

        const reasons = [...hypothesis.reviewReasons];

        if (exact.length > 1) {
            reasons.push('DUPLICATE_EXACT_AI_CANDIDATES');
        }

        if (relationship === 'FRAGMENT_COMBINATION_REVIEW') {
            reasons.push('FRAGMENTS_DO_NOT_VERIFY_COMBINATION');
        }

        if (relationship === 'UNRESOLVED_REVIEW') {
            reasons.push('NO_UNAMBIGUOUS_AI_CANDIDATE_LINK');
        }

        rows.push({
            hypothesisId: hypothesis.candidateId,
            sourceItemId: hypothesis.sourceItemId,
            productName: hypothesis.productName,
            reconstructionMethod:
                hypothesis.reconstructionMethod,
            relationship,
            exactCandidateId:
                relationship === 'EXACT_CANDIDATE_ENRICHMENT'
                    ? exact[0].candidateId
                    : null,
            relatedCandidateIds:
                related.map(candidate => candidate.candidateId),
            relatedCandidateNames:
                related.map(candidate => candidate.candidateName),
            quantityValue: hypothesis.quantityValue,
            quantityUnit: hypothesis.quantityUnit,
            reviewReasons: [...new Set(reasons)],
            status: 'RECONCILIATION_REVIEW',
            automaticPromotionEligible: false,
        });
    }

    const count = (relationship: Relationship): number =>
        rows.filter(row =>
            row.relationship === relationship,
        ).length;

    const summary = {
        version: 1,
        originalAiCandidates: candidates.length,
        reconstructionHypotheses: hypotheses.length,
        reconciled: rows.length,
        exactCandidateEnrichments:
            count('EXACT_CANDIDATE_ENRICHMENT'),
        fragmentCombinationReviews:
            count('FRAGMENT_COMBINATION_REVIEW'),
        unresolvedReviews:
            count('UNRESOLVED_REVIEW'),
        verifiedAdditionalProducts: 0,
        automaticPromotionEligible: 0,
        databaseWrites: false,
    };

    mkdirSync(OUTPUT, { recursive: true });

    writeFileSync(
        join(OUTPUT, 'reconciliation.json'),
        JSON.stringify(rows, null, 2) + '\n',
    );

    writeFileSync(
        join(OUTPUT, 'summary.json'),
        JSON.stringify(summary, null, 2) + '\n',
    );

    const headers = [
        'hypothesisId',
        'sourceItemId',
        'productName',
        'reconstructionMethod',
        'relationship',
        'exactCandidateId',
        'relatedCandidateIds',
        'relatedCandidateNames',
        'quantityValue',
        'quantityUnit',
        'reviewReasons',
    ] as const;

    const csv = [
        headers.map(csvCell).join(','),
        ...rows.map(row => {
            const display = {
                ...row,
                relatedCandidateIds:
                    row.relatedCandidateIds.join('|'),
                relatedCandidateNames:
                    row.relatedCandidateNames.join('|'),
                reviewReasons:
                    row.reviewReasons.join('|'),
            };

            return headers.map(
                key => csvCell(display[key]),
            ).join(',');
        }),
    ].join('\n') + '\n';

    writeFileSync(
        join(OUTPUT, 'reconciliation.csv'),
        csv,
    );

    console.log('\n=== RECONSTRUCTION RECONCILIATION V1 ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nOutput: ${OUTPUT}`);
}

main();

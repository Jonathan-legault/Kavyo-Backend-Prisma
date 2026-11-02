
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaService } from '../src/prisma/prisma.service.js';

import {
    processSafewayBatches,
    type DocuPipeFlyer,
} from '../src/ingestion/processors/docupipe-batch.processor.js';

import { prepareStagedOffers } from '../src/ingestion/staging/staged-offer.mapper.js';
import { StagingService } from '../src/ingestion/staging/staging.service.js';

const DOCUMENT_ID = 'safeway-oct22-2026';
const EXPECTED_COUNT = 425;

function loadFlyer(filename: string): DocuPipeFlyer {
    return JSON.parse(
        readFileSync(resolve('data', 'raw', filename), 'utf8'),
    ) as DocuPipeFlyer;
}

async function main() {
    const first = loadFlyer(
        'Safeway_oct_22_weeklyflyer.json',
    );

    const second = loadFlyer(
        'Safeway_oct_22_weeklyflyer-p1-4.json',
    );

    const { offers, report } = processSafewayBatches(
        first,
        second,
        DOCUMENT_ID,
        new Date().toISOString(),
    );

    const prepared = prepareStagedOffers(offers);

    if (prepared.length !== EXPECTED_COUNT) {
        throw new Error(
            `Expected ${EXPECTED_COUNT} offers, found ${prepared.length}`,
        );
    }

    if (
        prepared.some(
            (offer) =>
                !offer.rawPayload ||
                !offer.normalizedPayload.promotionGroupId,
        )
    ) {
        throw new Error(
            'Missing original advertisement or promotion group',
        );
    }

    console.log('\n=== REFRESH PREVIEW ===');
    console.table(report);
    console.log('Prepared records:', prepared.length);

    if (!process.argv.includes('--write')) {
        console.log('DRY RUN: No database changes.');
        return;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is missing');
    }

    const url = new URL(connectionString);

    if (
        !['localhost', '127.0.0.1'].includes(url.hostname) ||
        url.port !== '5432' ||
        url.pathname !== '/kavyo_dev'
    ) {
        throw new Error('Local kavyo_dev database required');
    }

    const prisma = new PrismaService();
    await prisma.$connect();

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                const source = await tx.sourceSystem.findUnique({
                    where: { name: 'DOCUPIPE' },
                });

                if (!source) {
                    throw new Error('DOCUPIPE source not found');
                }

                const batches = await tx.ingestBatch.findMany({
                    where: {
                        sourceSystemId: source.id,
                        sourceReference: DOCUMENT_ID,
                    },
                });

                if (batches.length !== 1) {
                    throw new Error(
                        `Expected one batch, found ${batches.length}`,
                    );
                }

                const batch = batches[0];

                if (batch.status !== 'STAGED') {
                    throw new Error(
                        `Unexpected batch status: ${batch.status}`,
                    );
                }

                const existing = await tx.stagedOffer.findMany({
                    where: { ingestBatchId: batch.id },
                    select: {
                        recordKey: true,
                        status: true,
                        reviewRequired: true,
                    },
                });

                if (existing.length !== EXPECTED_COUNT) {
                    throw new Error(
                        `Expected ${EXPECTED_COUNT} stored records, found ${existing.length}`,
                    );
                }

                if (
                    existing.some(
                        (record) =>
                            record.status !== 'PENDING_REVIEW' ||
                            !record.reviewRequired,
                    )
                ) {
                    throw new Error(
                        'Some records have been reviewed. Refresh cancelled.',
                    );
                }

                const oldKeys = new Set(
                    existing.map((record) => record.recordKey),
                );

                const newKeys = new Set(
                    prepared.map((record) => record.recordKey),
                );

                if (
                    oldKeys.size !== EXPECTED_COUNT ||
                    newKeys.size !== EXPECTED_COUNT ||
                    [...newKeys].some((key) => !oldKeys.has(key))
                ) {
                    throw new Error(
                        'Source record identities changed. Refresh cancelled.',
                    );
                }

                const linkedPrices = await tx.priceObservation.count({
                    where: { ingestBatchId: batch.id },
                });

                if (linkedPrices !== 0) {
                    throw new Error(
                        'Batch has linked price observations. Refresh cancelled.',
                    );
                }

                // Delete only this batch's staging records.
                const deleted = await tx.stagedOffer.deleteMany({
                    where: { ingestBatchId: batch.id },
                });

                const service = new StagingService(
                    tx as unknown as PrismaService,
                );

                const staged = await service.stageOffers(
                    batch.id,
                    offers,
                );

                if (staged.inserted !== EXPECTED_COUNT) {
                    throw new Error(
                        `Incomplete refresh: ${staged.inserted} inserted`,
                    );
                }

                const stored = await tx.stagedOffer.findMany({
                    where: { ingestBatchId: batch.id },
                    select: {
                        rawPayload: true,
                        normalizedPayload: true,
                    },
                });

                if (
                    stored.length !== EXPECTED_COUNT ||
                    stored.some(
                        (record) =>
                            record.rawPayload === null ||
                            typeof record.normalizedPayload !== 'object' ||
                            record.normalizedPayload === null ||
                            Array.isArray(record.normalizedPayload) ||
                            !('promotionGroupId' in record.normalizedPayload),
                    )
                ) {
                    throw new Error(
                        'Stored evidence verification failed',
                    );
                }

                await tx.ingestBatch.update({
                    where: { id: batch.id },
                    data: {
                        status: 'STAGED',
                        completedAt: new Date(),
                        recordsRead: offers.length,
                        recordsInserted: staged.inserted,
                        recordsUpdated: 0,
                        recordsRejected: 0,
                    },
                });

                return {
                    batchId: batch.id,
                    deleted: deleted.count,
                    inserted: staged.inserted,
                    totalStored: stored.length,
                    withOriginalEvidence: stored.filter(
                        (record) => record.rawPayload !== null,
                    ).length,
                };
            },
            { timeout: 30000 },
        );

        console.log('\n=== REFRESH SUCCESSFUL ===');
        console.table(result);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

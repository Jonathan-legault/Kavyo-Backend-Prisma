
import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service.js';
import { StagingService } from './staging.service.js';

import type { NormalizedOffer } from '../contracts/normalized-offer.js';

// Run only when explicitly enabled.
// Regular unit-test runs will skip this database test.
const databaseTest =
  process.env.RUN_STAGING_DB_TEST === '1' ? it : it.skip;

describe('StagingService PostgreSQL integration', () => {
  databaseTest('stores, retrieves, and deduplicates an offer', async () => {
    // Safety: restrict this test to our local development DB.
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
      throw new Error(
        'Integration test requires localhost:5432/kavyo_dev',
      );
    }

    const prisma = new PrismaService();
    await prisma.$connect();

    const rollbackMarker = 'ROLLBACK_STAGING_TEST';
    let testBatchId: string | undefined;

    try {
      // A successful transaction normally commits.
      // We deliberately throw at the end to roll it back.
      await expect(
        prisma.$transaction(
          async (tx) => {
            const sourceName = `STAGING_TEST_${randomUUID()}`;

            const sourceSystem = await tx.sourceSystem.create({
              data: {
                name: sourceName,
                sourceType: 'TEST',
              },
            });

            const batch = await tx.ingestBatch.create({
              data: {
                sourceSystemId: sourceSystem.id,
                status: 'TESTING',
                sourceReference: 'STAGING_INTEGRATION_TEST',
              },
            });

            testBatchId = batch.id;

            const productCountBefore =
              await tx.product.count();

            const priceCountBefore =
              await tx.priceObservation.count();

            const offer: NormalizedOffer = {
              sourceSystem: sourceName,
              sourceRecordId: 'test-product-001',

              retailerName: 'Safeway',
              productName: 'Test Peanut Butter',
              brand: 'KRAFT',

              advertisedPriceText: '$4.97 ea',
              advertisedPriceAmount: 4.97,
              advertisedPriceUnit: 'each',

              salePrice: 4.97,
              currency: 'CAD',

              observedAt: '2026-10-24T20:00:00.000Z',
              validFrom: '2026-10-22',
              validUntil: '2026-10-28',

              loyaltyProgram: 'Scene+',
              loyaltyPoints: 150,
              loyaltyCondition: 'When you buy 3',

              extractionMethod: 'DOCUMENT',
              reviewRequired: true,
              reviewReasons: ['BARCODE_MISSING'],
            };

            // Use the transaction's Prisma client.
            const service = new StagingService(
              tx as unknown as PrismaService,
            );

            // First insertion
            const first = await service.stageOffers(
              batch.id,
              [offer],
            );

            expect(first.inserted).toBe(1);
            expect(first.skippedExisting).toBe(0);

            // Repeat the same insertion
            const second = await service.stageOffers(
              batch.id,
              [offer],
            );

            expect(second.inserted).toBe(0);
            expect(second.skippedExisting).toBe(1);

            // Retrieve the actual PostgreSQL record
            const staged = await tx.stagedOffer.findMany({
              where: {
                ingestBatchId: batch.id,
              },
            });

            expect(staged).toHaveLength(1);
            expect(staged[0].productName)
              .toBe('Test Peanut Butter');

            expect(staged[0].status)
              .toBe('PENDING_REVIEW');

            expect(staged[0].recordKey)
              .toMatch(/^[a-f0-9]{64}$/);

            expect(staged[0].normalizedPayload)
              .toMatchObject({
                loyaltyProgram: 'Scene+',
                loyaltyPoints: 150,
                salePrice: 4.97,
              });

            // The official catalogue must remain untouched.
            expect(await tx.product.count())
              .toBe(productCountBefore);

            expect(await tx.priceObservation.count())
              .toBe(priceCountBefore);

            // Force rollback of all test records.
            throw new Error(rollbackMarker);
          },
          {
            timeout: 20000,
          },
        ),
      ).rejects.toThrow(rollbackMarker);

      // Confirm the temporary batch was rolled back.
      expect(testBatchId).toBeDefined();

      const remainingBatch = await prisma.ingestBatch.findUnique({
        where: {
          id: testBatchId!,
        },
      });

      expect(remainingBatch).toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  }, 30000);
});

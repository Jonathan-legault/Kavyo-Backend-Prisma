
import { describe, expect, it, vi } from 'vitest';

import { StagingService } from './staging.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

import type { NormalizedOffer } from '../contracts/normalized-offer.js';

const testOffer: NormalizedOffer = {
  sourceSystem: 'DOCUPIPE',
  sourceRecordId: 'safeway:p1:g1:i1',

  retailerName: 'Safeway',
  productName: 'KRAFT Peanut Butter',
  brand: 'KRAFT',

  advertisedPriceText: '$4.97 ea',
  advertisedPriceAmount: 4.97,
  advertisedPriceUnit: 'each',

  salePrice: 4.97,
  currency: 'CAD',

  observedAt: '2026-10-24T20:00:00.000Z',
  validFrom: '2026-10-22',
  validUntil: '2026-10-28',

  extractionMethod: 'DOCUMENT',
  reviewRequired: true,
  reviewReasons: ['BARCODE_MISSING'],
};

function createMockPrisma() {
  return {
    ingestBatch: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'batch-001',
        sourceSystem: {
          name: 'DOCUPIPE',
        },
      }),
    },

    stagedOffer: {
      createMany: vi.fn().mockResolvedValue({
        count: 1,
      }),
    },
  };
}

describe('StagingService', () => {
  it('inserts normalized offers into staging', async () => {
    const prisma = createMockPrisma();

    const service = new StagingService(
      prisma as unknown as PrismaService,
    );

    const result = await service.stageOffers(
      'batch-001',
      [testOffer],
    );

    expect(result.received).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.skippedExisting).toBe(0);

    expect(prisma.stagedOffer.createMany)
      .toHaveBeenCalledOnce();

    expect(prisma.stagedOffer.createMany)
      .toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            ingestBatchId: 'batch-001',
            productName: 'KRAFT Peanut Butter',
            advertisedPriceAmount: 4.97,
            status: 'PENDING_REVIEW',
          }),
        ],
        skipDuplicates: true,
      });
  });

  it('reports records skipped by the database', async () => {
    const prisma = createMockPrisma();

    prisma.stagedOffer.createMany.mockResolvedValue({
      count: 0,
    });

    const service = new StagingService(
      prisma as unknown as PrismaService,
    );

    const result = await service.stageOffers(
      'batch-001',
      [testOffer],
    );

    expect(result.received).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.skippedExisting).toBe(1);
  });

  it('rejects offers from a different source', async () => {
    const prisma = createMockPrisma();

    const service = new StagingService(
      prisma as unknown as PrismaService,
    );

    const invalidOffer: NormalizedOffer = {
      ...testOffer,
      sourceSystem: 'FLYERS_API',
    };

    await expect(
      service.stageOffers('batch-001', [invalidOffer]),
    ).rejects.toThrow('Source mismatch');

    expect(prisma.stagedOffer.createMany)
      .not.toHaveBeenCalled();
  });

  it('rejects a missing ingestion batch', async () => {
    const prisma = createMockPrisma();

    prisma.ingestBatch.findUnique.mockResolvedValue(null);

    const service = new StagingService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.stageOffers('missing-batch', [testOffer]),
    ).rejects.toThrow('Ingestion batch not found');

    expect(prisma.stagedOffer.createMany)
      .not.toHaveBeenCalled();
  });
});

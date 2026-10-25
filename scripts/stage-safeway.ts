
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

function loadFlyer(filename: string): DocuPipeFlyer {
  const path = resolve('data', 'raw', filename);

  return JSON.parse(
    readFileSync(path, 'utf8'),
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

  // Validate record identities before any database writes.
  const prepared = prepareStagedOffers(offers);

  console.log('\n=== SAFEWAY STAGING PREVIEW ===');
  console.table(report);

  console.log('Prepared records:', prepared.length);
  console.log('Unique record keys:', new Set(
    prepared.map((item) => item.recordKey),
  ).size);

  if (offers.length !== 425) {
    throw new Error(
      `Expected 425 candidates, received ${offers.length}`,
    );
  }

  // Default behaviour: preview only.
  if (!process.argv.includes('--write')) {
    console.log('\nDRY RUN: No database writes.');
    return;
  }

  // Protect against accidentally targeting another database.
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
      'Import requires localhost:5432/kavyo_dev',
    );
  }

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const summary = await prisma.$transaction(
      async (tx) => {
        // Register the document extraction source.
        const source = await tx.sourceSystem.upsert({
          where: {
            name: 'DOCUPIPE',
          },
          update: {},
          create: {
            name: 'DOCUPIPE',
            sourceType: 'DOCUMENT_EXTRACTION',
          },
        });

        // Reuse the same batch on repeated imports.
        const existing = await tx.ingestBatch.findMany({
          where: {
            sourceSystemId: source.id,
            sourceReference: DOCUMENT_ID,
          },
          select: {
            id: true,
          },
        });

        if (existing.length > 1) {
          throw new Error(
            'Multiple batches found for this document',
          );
        }

        const batch = existing[0] ??
          await tx.ingestBatch.create({
            data: {
              sourceSystemId: source.id,
              sourceReference: DOCUMENT_ID,
              status: 'STAGING',
            },
          });

        const service = new StagingService(
          tx as unknown as PrismaService,
        );

        const result = await service.stageOffers(
          batch.id,
          offers,
        );

        const totalStored = await tx.stagedOffer.count({
          where: {
            ingestBatchId: batch.id,
          },
        });

        await tx.ingestBatch.update({
          where: {
            id: batch.id,
          },
          data: {
            status: 'STAGED',
            completedAt: new Date(),
            recordsRead: offers.length,
            recordsInserted: totalStored,
            recordsRejected: 0,
          },
        });

        return {
          ...result,
          totalStored,
        };
      },
      {
        timeout: 30000,
      },
    );

    console.log('\n=== STAGING RESULT ===');
    console.table(summary);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

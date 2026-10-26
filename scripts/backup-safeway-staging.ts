
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaService } from '../src/prisma/prisma.service.js';

async function main() {
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
    throw new Error('Local development database required');
  }

  const prisma = new PrismaService();

  try {
    await prisma.$connect();

    const batches = await prisma.ingestBatch.findMany({
      where: {
        sourceReference: 'safeway-oct22-2026',
      },
      include: {
        sourceSystem: true,
        stagedOffers: true,
      },
    });

    const matching = batches.filter(
      (batch) => batch.sourceSystem.name === 'DOCUPIPE',
    );

    if (matching.length !== 1) {
      throw new Error(
        `Expected one Safeway batch, found ${matching.length}`,
      );
    }

    const batch = matching[0];

    if (batch.stagedOffers.length !== 425) {
      throw new Error(
        `Expected 425 staged offers, found ${batch.stagedOffers.length}`,
      );
    }

    const backupDirectory = resolve(
      '..',
      'kavyo-local-backups',
    );

    mkdirSync(backupDirectory, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-');

    const filename = resolve(
      backupDirectory,
      `safeway-staging-${timestamp}.json`,
    );

    writeFileSync(
      filename,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          batch,
        },
        null,
        2,
      ),
      { flag: 'wx' },
    );

    console.log('Backup created:', filename);
    console.log('Batch ID:', batch.id);
    console.log('Records backed up:', batch.stagedOffers.length);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

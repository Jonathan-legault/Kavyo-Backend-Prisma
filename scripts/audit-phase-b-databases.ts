
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const baseUrl = process.env.DATABASE_URL;

if (!baseUrl) {
    throw new Error('DATABASE_URL is missing');
}

const databases = ['kavyo_dev', 'kavyo_phase_b_test'] as const;

const trackedTables = [
    'products',
    'staged_offers',
    'advertised_offers',
    'product_evidence',
    'price_observations',
    'ingest_batches',
    'flyers',
] as const;

async function inspectDatabase(name: string): Promise<void> {
    const url = new URL(baseUrl);
    url.pathname = `/${name}`;

    const prisma = new PrismaClient({
        adapter: new PrismaPg({
            connectionString: url.toString(),
        }),
    });

    try {
        const identity = await prisma.$queryRaw<
            Array<{ database_name: string; schema_name: string }>
        >`
            SELECT
                current_database() AS database_name,
                current_schema() AS schema_name
        `;

        const tables = await prisma.$queryRaw<
            Array<{ table_name: string }>
        >`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `;

        const existing = new Set(tables.map(t => t.table_name));

        const counts: Array<{
            table: string;
            exists: boolean;
            rows: string | null;
        }> = [];

        for (const table of trackedTables) {
            if (!existing.has(table)) {
                counts.push({
                    table,
                    exists: false,
                    rows: null,
                });
                continue;
            }

            // Table names are from a fixed internal allowlist.
            const result = await prisma.$queryRawUnsafe<
                Array<{ count: bigint }>
            >(
                `SELECT COUNT(*) AS count FROM public."${table}"`,
            );

            counts.push({
                table,
                exists: true,
                rows: result[0].count.toString(),
            });
        }

        console.log(`\n=== ${name} ===`);
        console.table(identity);
        console.log(`Tables: ${tables.length}`);
        console.table(counts);
    } finally {
        await prisma.$disconnect();
    }
}

async function main(): Promise<void> {
    for (const name of databases) {
        await inspectDatabase(name);
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

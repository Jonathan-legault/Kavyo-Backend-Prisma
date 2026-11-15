
/**
 * READ ONLY.
 * Exports only the Product identity fields required by
 * Kavyo's existing product matcher.
 *
 * No inserts, updates, migrations, or staging changes.
 */
import 'dotenv/config';

import {
    mkdirSync,
    writeFileSync,
} from 'node:fs';

import { dirname, resolve } from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import {
    PrismaClient,
} from '../src/generated/prisma/client.js';

import {
    assertPhaseBDatabase,
} from '../src/ingestion/guards/phase-b-database.guard.js';

const OUTPUT = resolve(
    'data',
    'research',
    'flipp',
    'product-identity-catalog.json',
);

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is missing.');
    }

    const prisma = new PrismaClient({
        adapter: new PrismaPg({
            connectionString: databaseUrl,
        }),
    });

    try {
        // Verify the actual PostgreSQL database before exporting.
        // Prevents accidentally reading from kavyo_dev.
        await assertPhaseBDatabase(prisma);

        const products = await prisma.product.findMany({
            select: {
                id: true,
                productName: true,
                brand: true,
                barcode: true,
                quantityValue: true,
                quantityUnit: true,
                quantityText: true,
            },
            orderBy: {
                id: 'asc',
            },
        });

        const identities = products.map((product) => ({
            id: product.id,
            productName: product.productName,
            brand: product.brand,
            barcode: product.barcode,
            quantityValue:
                product.quantityValue?.toString() ?? null,
            quantityUnit: product.quantityUnit,
            quantityText: product.quantityText,
        }));

        mkdirSync(dirname(OUTPUT), {
            recursive: true,
        });

        writeFileSync(
            OUTPUT,
            JSON.stringify(identities, null, 2) + '\n',
            'utf8',
        );

        console.log(
            JSON.stringify({
                status: 'EXPORTED',
                products: identities.length,
                output: OUTPUT,
                databaseWrites: false,
            }, null, 2),
        );
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

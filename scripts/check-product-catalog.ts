
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: databaseUrl,
    }),
});

async function main(): Promise<void> {
    try {
        // Identify the database currently connected.
        const database = await prisma.$queryRaw<
            Array<{
                database_name: string;
                schema_name: string;
                server_address: string | null;
            }>
        >`
            SELECT
                current_database() AS database_name,
                current_schema() AS schema_name,
                inet_server_addr()::text AS server_address
        `;

        console.log('\n=== DATABASE CONNECTION ===');
        console.table(database);

        // Count current canonical product records.
        const productCount = await prisma.product.count();

        console.log('\n=== PRODUCT CATALOG ===');
        console.log('Product count:', productCount);

        // Inspect a small sample without modifying records.
        const examples = await prisma.product.findMany({
            take: 10,
            orderBy: {
                id: 'asc',
            },
            select: {
                id: true,
                productName: true,
                brand: true,
                barcode: true,
            },
        });

        console.table(examples);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

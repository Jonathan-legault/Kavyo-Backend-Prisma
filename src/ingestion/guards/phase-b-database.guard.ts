
import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Ensures that Phase B database operations use the
 * dedicated isolated development database.
 *
 * Checks the actual PostgreSQL connection, not merely
 * the DATABASE_URL string.
 */
export async function assertPhaseBDatabase(
    prisma: PrismaClient,
): Promise<void> {
    const result = await prisma.$queryRaw<
        Array<{ database_name: string }>
    >`
        SELECT current_database() AS database_name
    `;

    const actual = result[0]?.database_name;

    if (actual !== 'kavyo_phase_b_test') {
        throw new Error(
            `PHASE_B_DATABASE_GUARD: Expected ` +
            `"kavyo_phase_b_test", connected to ` +
            `"${actual ?? 'UNKNOWN'}". Operation blocked.`,
        );
    }
}

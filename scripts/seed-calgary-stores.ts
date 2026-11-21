/**
 * Kavyo local-development Calgary grocery-store import.
 * Usage from Kavyo-Backend-Prisma root:
 *   npx tsx scripts/seed-calgary-stores.ts           # inspect only; no DB writes
 *   npx tsx scripts/seed-calgary-stores.ts --apply   # insert missing stores
 *   npx tsx scripts/seed-calgary-stores.ts --geocoded               # preview geo result
 *   npx tsx scripts/seed-calgary-stores.ts --geocoded --apply       # insert new stores with coords
 *   npx tsx scripts/seed-calgary-stores.ts --geocoded --apply --update-missing
 *   npx tsx scripts/seed-calgary-stores.ts --apply --include-third-party
 *
 * Copy calgary-grocery-stores.json to data/reference/ before running.
 * Existing Prisma Store lacks retailerStoreId and verification provenance columns:
 * these remain in the JSON file pending a coordinated schema migration.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../src/prisma/prisma.service.js';

type VerificationLevel = 'OFFICIAL' | 'CORROBORATED' | 'THIRD_PARTY';
type StoreSeed = {
  retailer: string;
  storeName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
  retailerStoreId: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinateSourceUrl?: string | null;
  coordinateMatchStatus?: string;
  verificationLevel: VerificationLevel;
  sourceUrl: string;
};
type SeedDocument = { stores: StoreSeed[] };

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const includeThirdParty = args.has('--include-third-party');
const updateMissing = args.has('--update-missing');
const geocoded = args.has('--geocoded');
const filePath = resolve(process.cwd(), 'data/reference', geocoded ? 'calgary-grocery-stores.geocoded.json' : 'calgary-grocery-stores.json');
const seed = JSON.parse(readFileSync(filePath, 'utf8')) as SeedDocument;
const stores = seed.stores.filter(
  (store) => includeThirdParty || store.verificationLevel !== 'THIRD_PARTY',
);

function normalizedAddress(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function usableCoordinates(store: StoreSeed): { latitude: number; longitude: number } | null {
  const lat = store.latitude;
  const lng = store.longitude;
  const status = store.coordinateMatchStatus ?? '';
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 50.80 || lat > 51.26 || lng < -114.37 || lng > -113.75) return null;
  if (
    !store.coordinateSourceUrl ||
    ![
      'PREVERIFIED_LOCATION',
      'EXACT_MUNICIPAL_STREET_ADDRESS',
      'EXACT_CALGARY_PARCEL_ADDRESS',
      'EXACT_NRCAN_STREET_ADDRESS',
      'MANUAL_VERIFIED',
    ].includes(status)
  ) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}
function requireLocalDevDatabase(): void {
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error('DATABASE_URL is missing');
  const url = new URL(connection);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '5432' ||
    url.pathname !== '/kavyo_dev'
  ) {
    throw new Error('Refusing to seed: expected localhost:5432/kavyo_dev');
  }
}
async function main(): Promise<void> {
  const counts = new Map<string, number>();
  for (const store of stores) counts.set(store.retailer, (counts.get(store.retailer) ?? 0) + 1);
  console.log(`Seed file: ${filePath}`);
  console.log(`Eligible: ${stores.length} of ${seed.stores.length}`);
  for (const [retailer, count] of counts) console.log(`  ${retailer}: ${count}`);
  console.log(`Address-verified coordinates: ${stores.filter(store => usableCoordinates(store)).length}/${stores.length}`);

  if (updateMissing && !apply) console.log('NOTE: --update-missing has no effect without --apply.');
  if (!apply) {
    console.log('DRY RUN. No database connection or changes. Use --apply to insert.');
    return;
  }
  requireLocalDevDatabase();
  const prisma = new PrismaService();
  let inserted = 0;
  let existed = 0;
  let needsReview = 0;
  let updated = 0;
  try {
    await prisma.$connect();
    for (const retailerName of counts.keys()) {
      const retailer = await prisma.retailer.upsert({
        where: { name: retailerName },
        create: { name: retailerName },
        update: {}, // never overwrite retailer data during a seed
      });
      let existing = await prisma.store.findMany({ where: { retailerId: retailer.id } });
      for (const store of stores.filter((item) => item.retailer === retailerName)) {
        const sameAddress = existing.find(
          (item) => normalizedAddress(item.address ?? '') === normalizedAddress(store.address),
        );
        if (sameAddress) {
          existed++;
          if (updateMissing) {
            const changes: { postalCode?: string; latitude?: number; longitude?: number } = {};
            if (!sameAddress.postalCode && store.postalCode) changes.postalCode = store.postalCode;
            const coords = usableCoordinates(store);
            if (coords && sameAddress.latitude == null && sameAddress.longitude == null) {
              changes.latitude = coords.latitude;
              changes.longitude = coords.longitude;
            }
            if (Object.keys(changes).length) {
              await prisma.store.update({ where: { id: sameAddress.id }, data: changes });
              updated++;
            }
          }
          continue;
        }
        // Be conservative with existing data: differing addresses in same postal
        // code may reflect a suite-format issue. Skip for manual reconciliation.
        const ambiguous = store.postalCode && existing.find(
          (item) => item.postalCode?.replace(/\s/g, '').toUpperCase() === store.postalCode?.replace(/\s/g, '').toUpperCase(),
        );
        if (ambiguous) {
          needsReview++;
          console.warn(`REVIEW existing postal match: ${retailerName} | ${store.address} | ${ambiguous.address}`);
          continue;
        }
        const created = await prisma.store.create({
          data: {
            retailerId: retailer.id,
            name: store.storeName,
            address: store.address,
            city: store.city,
            province: store.province,
            postalCode: store.postalCode,
            ...usableCoordinates(store),
            isActive: true,
          },
        });
        existing.push(created);
        inserted++;
      }
    }
    console.log(`Done: ${inserted} inserted, ${existed} already present, ${updated} missing-field records updated, ${needsReview} need manual reconciliation.`);
    console.log('Retailer store numbers, source URLs and verification metadata remain in the JSON source file.');
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import 'dotenv/config';
import fs from 'node:fs';
import zlib from 'node:zlib';
import pg from 'pg';

const seedPath = 'data/research/living-db/kavyo-product-contract-seed.json.gz';
const seed = JSON.parse(zlib.gunzipSync(fs.readFileSync(seedPath)));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  const db = await client.query('SELECT current_database() AS name');

  if (db.rows[0].name !== 'kavyo_dev') {
    throw new Error(`STOP: connected to ${db.rows[0].name}, not kavyo_dev`);
  }

  const stores = await client.query('SELECT * FROM stores');
  const retailers = await client.query('SELECT id, name FROM retailers');

  const seedRetailerNames = new Map(
    seed.tables.retailers.map(r => [r.id, r.name])
  );

  const destinationRetailerIds = new Map(
    retailers.rows.map(r => [r.name, r.id])
  );

  const destinationStores = new Map(
    stores.rows.map(s => [s.id, s])
  );

  const grouped = new Map();

  for (const offer of seed.tables.advertised_offers) {
    if (!offer.store_id) continue;

    if (!grouped.has(offer.store_id)) {
      grouped.set(offer.store_id, {
        seedStoreId: offer.store_id,
        offerCount: 0,
        retailerNames: new Set()
      });
    }

    const entry = grouped.get(offer.store_id);
    entry.offerCount++;
    entry.retailerNames.add(
      seedRetailerNames.get(offer.retailer_id) ?? 'UNKNOWN'
    );
  }

  const results = [...grouped.values()].map(entry => {
    const store = destinationStores.get(entry.seedStoreId);
    const names = [...entry.retailerNames];

    return {
      seedStoreId: entry.seedStoreId,
      offerCount: entry.offerCount,
      seedRetailers: names.join(', '),
      destinationStoreExists: Boolean(store),
      destinationStoreName: store?.name ?? null,
      destinationStoreRetailerMatches: store
        ? names.some(name => destinationRetailerIds.get(name) === store.retailer_id)
        : null
    };
  });

  console.log(JSON.stringify({
    database: db.rows[0].name,
    advertisedOffers: seed.tables.advertised_offers.length,
    offersWithoutStoreId: seed.tables.advertised_offers.filter(o => !o.store_id).length,
    offersWithStoreId: seed.tables.advertised_offers.filter(o => o.store_id).length,
    uniqueSeedStoreIds: results.length,
    destinationStoreCount: stores.rows.length,
    storeReferences: results
  }, null, 2));
} finally {
  await client.end();
}

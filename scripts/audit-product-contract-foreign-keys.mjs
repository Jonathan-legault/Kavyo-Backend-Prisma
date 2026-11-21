import 'dotenv/config';
import fs from 'node:fs';
import zlib from 'node:zlib';
import pg from 'pg';

const seed = JSON.parse(zlib.gunzipSync(
  fs.readFileSync('data/research/living-db/kavyo-product-contract-seed.json.gz')
));

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

try {
  const db = await c.query('SELECT current_database() AS name');
  if (db.rows[0].name !== 'kavyo_dev') {
    throw new Error(`STOP: connected to ${db.rows[0].name}`);
  }

  const [destSources, destRetailers, destProducts, destFlyers, destBatches] =
    await Promise.all([
      c.query('SELECT id, name FROM source_systems'),
      c.query('SELECT id, name FROM retailers'),
      c.query('SELECT id FROM products'),
      c.query('SELECT id, source_system_id, external_id, retailer_id FROM flyers'),
      c.query('SELECT id, source_system_id, source_reference FROM ingest_batches')
    ]);

  const byName = rows => new Map(rows.map(r => [r.name, r.id]));
  const sourceMap = byName(destSources.rows);
  const retailerMap = byName(destRetailers.rows);
  const productIds = new Set(destProducts.rows.map(r => r.id));

  const seedSources = new Map(seed.tables.source_systems.map(x => [x.id, x]));
  const seedRetailers = new Map(seed.tables.retailers.map(x => [x.id, x]));
  const seedProducts = new Set(seed.tables.products.map(x => x.id));
  const seedBatches = new Map(seed.tables.ingest_batches.map(x => [x.id, x]));
  const seedFlyers = new Map(seed.tables.flyers.map(x => [x.id, x]));

  const sourceIdMap = new Map();
  for (const x of seed.tables.source_systems) {
    const id = sourceMap.get(x.name);
    if (id) sourceIdMap.set(x.id, id);
  }

  const retailerIdMap = new Map();
  for (const x of seed.tables.retailers) {
    const id = retailerMap.get(x.name);
    if (id) retailerIdMap.set(x.id, id);
  }

  const batchIdMap = new Map();
  const batchAmbiguities = [];

  for (const b of seed.tables.ingest_batches) {
    const sourceId = sourceIdMap.get(b.source_system_id);
    const matches = destBatches.rows.filter(d =>
      d.source_system_id === sourceId &&
      d.source_reference === b.source_reference
    );

    if (matches.length === 1) batchIdMap.set(b.id, matches[0].id);
    if (matches.length > 1) {
      batchAmbiguities.push({
        seedBatchId: b.id,
        sourceReference: b.source_reference,
        destinationMatches: matches.length
      });
    }
  }

  const flyerIdMap = new Map();
  const flyerAmbiguities = [];
  const flyerRetailerMismatches = [];

  for (const f of seed.tables.flyers) {
    const sourceId = sourceIdMap.get(f.source_system_id);
    const retailerId = f.retailer_id
      ? retailerIdMap.get(f.retailer_id)
      : null;

    const matches = destFlyers.rows.filter(d =>
      d.source_system_id === sourceId &&
      String(d.external_id) === String(f.external_id)
    );

    if (matches.length === 1) {
      if ((matches[0].retailer_id ?? null) !== (retailerId ?? null)) {
        flyerRetailerMismatches.push({
          externalId: f.external_id,
          seedRetailerId: retailerId,
          destinationRetailerId: matches[0].retailer_id
        });
      } else {
        flyerIdMap.set(f.id, matches[0].id);
      }
    }

    if (matches.length > 1) {
      flyerAmbiguities.push({
        externalId: f.external_id,
        destinationMatches: matches.length
      });
    }
  }

  const missingRefs = [];
  const check = (table, row, field, parentSet) => {
    const value = row[field];
    if (value != null && !parentSet.has(value)) {
      missingRefs.push({ table, rowId: row.id, field, value });
    }
  };

  const ids = table => new Set(seed.tables[table].map(x => x.id));

  const sourceIds = ids('source_systems');
  const retailerIds = ids('retailers');
  const productIdSet = ids('products');
  const batchIds = ids('ingest_batches');
  const flyerIds = ids('flyers');

  for (const x of seed.tables.ingest_batches) {
    check('ingest_batches', x, 'source_system_id', sourceIds);
  }
  for (const x of seed.tables.flyers) {
    check('flyers', x, 'source_system_id', sourceIds);
    check('flyers', x, 'retailer_id', retailerIds);
  }
  for (const x of seed.tables.staged_offers) {
    check('staged_offers', x, 'source_system_id', sourceIds);
    check('staged_offers', x, 'retailer_id', retailerIds);
    check('staged_offers', x, 'matched_product_id', productIdSet);
    check('staged_offers', x, 'ingest_batch_id', batchIds);
    check('staged_offers', x, 'flyer_id', flyerIds);
  }
  for (const x of seed.tables.product_evidence) {
    check('product_evidence', x, 'product_id', productIdSet);
    check('product_evidence', x, 'source_system_id', sourceIds);
  }
  for (const x of seed.tables.advertised_offers) {
    check('advertised_offers', x, 'source_system_id', sourceIds);
    check('advertised_offers', x, 'retailer_id', retailerIds);
    check('advertised_offers', x, 'product_id', productIdSet);
    check('advertised_offers', x, 'flyer_id', flyerIds);
  }

  const stagedCollisions = [];
  for (const offer of seed.tables.staged_offers) {
    const mappedBatch = batchIdMap.get(offer.ingest_batch_id);
    if (!mappedBatch) continue;

    const r = await c.query(
      'SELECT * FROM staged_offers WHERE ingest_batch_id = $1 AND source_record_id = $2',
      [mappedBatch, offer.source_record_id]
    );

    if (r.rows.length) {
      const d = r.rows[0];
      const mappedFlyer = flyerIdMap.get(offer.flyer_id);
      const mappedRetailer = retailerIdMap.get(offer.retailer_id);
      const mappedSource = sourceIdMap.get(offer.source_system_id);

      const fields = [
        ['product_name', offer.product_name, d.product_name],
        ['retailer_name', offer.retailer_name, d.retailer_name],
        ['advertised_price_text', offer.advertised_price_text, d.advertised_price_text],
        ['advertised_price_amount', offer.advertised_price_amount, d.advertised_price_amount],
        ['package_size_text', offer.package_size_text, d.package_size_text],
        ['quantity_value', offer.quantity_value, d.quantity_value],
        ['quantity_unit', offer.quantity_unit, d.quantity_unit],
        ['unit_price', offer.unit_price, d.unit_price],
        ['unit_price_basis', offer.unit_price_basis, d.unit_price_basis],
        ['match_key', offer.match_key, d.match_key],
        ['family_key', offer.family_key, d.family_key],
        ['flyer_id', mappedFlyer, d.flyer_id],
        ['retailer_id', mappedRetailer, d.retailer_id],
        ['source_system_id', mappedSource, d.source_system_id],
        ['valid_from', offer.valid_from, d.valid_from?.toISOString?.() ?? d.valid_from],
        ['valid_until', offer.valid_until, d.valid_until?.toISOString?.() ?? d.valid_until]
      ];

      const mismatches = fields
        .filter(([name, a, b]) => {
          if (a == null && b == null) return false;
          if (a == null || b == null) return String(a) !== String(b);
          if (['advertised_price_amount', 'quantity_value', 'unit_price'].includes(name)) {
            return Number(a) !== Number(b);
          }
          return String(a) !== String(b);
        })
        .map(([field, seedValue, destinationValue]) => ({
          field, seedValue, destinationValue
        }));

      stagedCollisions.push({
        sourceRecordId: offer.source_record_id,
        destinationId: d.id,
        mismatches
      });
    }
  }

  console.log(JSON.stringify({
    database: db.rows[0].name,
    seedCounts: Object.fromEntries(
      Object.entries(seed.tables).map(([k, v]) => [k, v.length])
    ),
    destinationMappings: {
      sourceSystemsMatched: sourceIdMap.size,
      retailersMatched: retailerIdMap.size,
      productsAlreadyPresentById: seed.tables.products.filter(x => productIds.has(x.id)).length,
      batchesMatchedByExactSourceReference: batchIdMap.size,
      flyersMatched: flyerIdMap.size
    },
    ambiguousBatches: batchAmbiguities,
    ambiguousFlyers: flyerAmbiguities,
    flyerRetailerMismatches,
    missingSeedForeignKeys: missingRefs,
    stagedOfferCollisions: {
      count: stagedCollisions.length,
      mismatches: stagedCollisions.filter(x => x.mismatches.length > 0)
    }
  }, null, 2));
} finally {
  await c.end();
}

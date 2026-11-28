/**
 * Rebuildable, LOCAL-ONLY Kavyo teammate database installer.
 * Does not connect to or mutate the authoritative source database.
 * Requires a deliberate DATABASE_URL pointing at localhost:5432/kavyo_team_dev.
 *
 * New database: npm run db:populate
 * Existing database: npm run db:populate -- --update --ack-backup
 * Disposable reset: npm run db:populate -- --reset --confirm-reset=kavyo_team_dev
 * Optional verified Flipp replay: append --capture=<complete-capture-directory>
 */
import 'dotenv/config';
import { Client } from 'pg';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const DATABASE = 'kavyo_team_dev';
const repo = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const allowed = new Set(['--update', '--ack-backup', '--reset', '--confirm-reset=kavyo_team_dev']);
const captureArgs = args.filter(x => x.startsWith('--capture='));
const fullArgs = args.filter(x => x.startsWith('--full-archive='));
if (fullArgs.length > 1) throw Error('Only one --full-archive is allowed.');
const fullArchive = fullArgs.length ? resolve(repo, fullArgs[0].slice('--full-archive='.length)) : null;
if (captureArgs.length > 1) throw Error('Only one --capture= directory is allowed.');
for (const arg of args) if (!allowed.has(arg) && !arg.startsWith('--capture=') && !arg.startsWith('--full-archive=')) throw Error(`Unknown option: ${arg}`);
const update = args.includes('--update');
const reset = args.includes('--reset');
const confirmed = args.includes('--confirm-reset=kavyo_team_dev');
const backupAcknowledged = args.includes('--ack-backup');
if (update && reset) throw Error('Choose --update or --reset, not both.');
if (reset && !confirmed) throw Error(`Reset requires --confirm-reset=${DATABASE}.`);
if (!reset && confirmed) throw Error('--confirm-reset is allowed only with --reset.');
if (update && !backupAcknowledged) throw Error('Updating an existing database requires --ack-backup.');
if (!update && backupAcknowledged) throw Error('--ack-backup is only needed for --update.');
const capture = captureArgs.length ? captureArgs[0].slice('--capture='.length) : null;
if (capture && !capture.trim()) throw Error('--capture requires a directory.');
if (fullArchive && capture) throw Error('Full archive already contains the flyer history: do not also replay a capture.');
if (fullArchive && update) throw Error('Full archive import requires a fresh database or explicit reset, not --update.');

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw Error('Set DATABASE_URL to a local postgresql://.../kavyo_team_dev connection.');
let url;
try { url = new URL(rawUrl); } catch { throw Error('Invalid DATABASE_URL.'); }
if (!['postgresql:', 'postgres:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    (url.port && url.port !== '5432') ||
    decodeURIComponent(url.pathname) !== `/${DATABASE}` ||
    (url.searchParams.get('schema') && url.searchParams.get('schema') !== 'public')) {
  throw Error(`SAFETY STOP: DATABASE_URL must target localhost:5432/${DATABASE}, schema public. No other database may be populated or dropped.`);
}

const archiveFile = resolve(repo, 'data/research/living-db/kavyo-product-contract-seed.json.gz');
const storeSqlFile = resolve(repo, 'scripts/seed-calgary-stores.sql');
const prismaCli = resolve(repo, 'node_modules/prisma/build/index.js');
const contractScript = resolve(repo, 'scripts/kavyo-product-contract.mjs');
const flippScript = resolve(repo, 'scripts/run-flipp-ingestion.mjs');
const fullScript = resolve(repo, 'scripts/full-flyer-handoff.mjs');
for (const file of [storeSqlFile, prismaCli, ...(fullArchive ? [fullScript, fullArchive, fullArchive+'.sha256'] : [archiveFile, contractScript]), ...(capture ? [flippScript] : [])]) {
  if (!existsSync(file)) throw Error(`Required installer file is missing: ${file}`);
}
let archive = null;
if (!fullArchive) {
  try { archive = JSON.parse(gunzipSync(readFileSync(archiveFile)).toString('utf8')); }
  catch { throw Error('Product handoff archive is corrupt or unreadable.'); }
  if (archive.format !== 'KAVYO_PRODUCT_CONTRACT_NO_STORES_V2' || !archive.tables ||
      !Array.isArray(archive.tables.products) || !Array.isArray(archive.tables.advertised_offers)) {
    throw Error('Product handoff archive format is unsupported.');
  }
  if (archive.sourceDatabase === DATABASE) throw Error('Refusing self-sourced package.');
}
if (capture) {
  const source = resolve(repo, capture);
  if (!existsSync(resolve(source, 'report.json'))) throw Error(`Complete Flipp capture report not found: ${source}`);
}

const adminUrl = new URL(url);
adminUrl.pathname = '/postgres';
const clientUrl = new URL(url);
async function open(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}
function run(label, command, parameters) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, parameters, { cwd: repo, stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) {
    throw Error(`${label} failed${result.status === null ? '' : ` (exit ${result.status})`}.`);
  }
}
async function verifyIdentity(client, expected) {
  const r = await client.query('SELECT current_database() AS name, current_schema() AS schema');
  if (r.rows[0].name !== expected || r.rows[0].schema !== 'public') throw Error('Unexpected PostgreSQL database/schema identity.');
}
async function main() {
  console.log(`Local-only Kavyo teammate database: ${DATABASE}`);
  console.log(`Mode: ${reset ? 'RESET DISPOSABLE' : update ? 'UPDATE EXISTING' : 'CREATE NEW ONLY'}`);
  console.log(fullArchive ? `Package: FULL authoritative flyer archive (${fullArchive})` :
    `Package: ${archive.tables.products.length} products, ${archive.tables.advertised_offers.length} linked advertised offers (not a complete historical capture)`);
  console.log(`Historical replay: ${capture || 'none (pass --capture=<directory> to replay the three Flipp ingestion stages)'}`);

  if (fullArchive) {
    // Verify archive integrity before any CREATE/DROP operation.
    run('Verify full flyer archive and checksum', process.execPath,
      [fullScript, 'inspect', `--file=${fullArchive}`]);
  }

  let admin;
  try {
    admin = await open(adminUrl.toString());
    await verifyIdentity(admin, 'postgres');
    const found = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [DATABASE]);
    const exists = found.rowCount > 0;
    if (reset) {
      if (!exists) throw Error(`Cannot reset missing ${DATABASE}. Use the default create mode.`);
      const connections = await admin.query('SELECT COUNT(*)::int AS n FROM pg_stat_activity WHERE datname=$1', [DATABASE]);
      if (connections.rows[0].n !== 0) throw Error('Refusing reset: database has active sessions. Close applications connected to it.');
      console.log(`Dropping ONLY disposable database ${DATABASE} by explicit request.`);
      await admin.query(`DROP DATABASE "${DATABASE}"`);
      await admin.query(`CREATE DATABASE "${DATABASE}"`);
    } else if (!exists) {
      if (update) throw Error(`${DATABASE} does not exist; run npm run db:populate without --update.`);
      await admin.query(`CREATE DATABASE "${DATABASE}"`);
      console.log(`Created ${DATABASE}.`);
    } else if (!update) {
      throw Error(`${DATABASE} already exists. Use --update --ack-backup to preserve it, or --reset --confirm-reset=${DATABASE} to discard it.`);
    }
  } finally {
    if (admin) await admin.end();
  }

  // The URL remains the explicitly verified destination throughout all child processes.
  process.env.DATABASE_URL = clientUrl.toString();
  run('Apply 12+ repository Prisma migrations', process.execPath, [prismaCli, 'migrate', 'deploy']);
  run('Generate Prisma client', process.execPath, [prismaCli, 'generate']);
  if (fullArchive) {
    // Import original UUIDs before other seeds. The import requires empty migrated tables.
    run('Restore complete authoritative flyer dataset', process.execPath,
      [fullScript, 'import', `--file=${fullArchive}`, `--apply-to=${DATABASE}`]);
  }
  if (fullArchive) {
    // Do not run the standard dev seed over authoritative source-system/store records.
    const roleDb = await open(clientUrl.toString());
    try {
      await verifyIdentity(roleDb, DATABASE);
      await roleDb.query(`INSERT INTO roles (id,name,description,created_at) VALUES
        (gen_random_uuid(),'USER','Standard Kavyo application user',now()),
        (gen_random_uuid(),'ADMIN','Administrative access to Kavyo',now()),
        (gen_random_uuid(),'SUPER_ADMIN','Privileged Kavyo administrator',now())
        ON CONFLICT(name) DO NOTHING`);
      console.log('Seeded local authorization roles only; authoritative reference records preserved.');
    } finally {await roleDb.end();}
  } else {
    run('Seed roles, source systems, baseline retailers/stores', process.execPath, ['--import', 'tsx', 'prisma/seed.ts']);
  }

  console.log('\n=== Import reviewed Calgary stores ===');
  const stores = await open(clientUrl.toString());
  try {
    await verifyIdentity(stores, DATABASE);
    stores.on('notice', n => console.log(`SQL: ${n.message}`));
    await stores.query(readFileSync(storeSqlFile, 'utf8'));
  } finally {
    await stores.end();
  }

  if (!fullArchive) {
    run('Import authoritative product-centred handoff archive', process.execPath,
      [contractScript, 'import', archiveFile, `--apply-to=${DATABASE}`, '--ack-backup']);
  }

  if (capture) {
    // Reuse the existing three-stage pipeline; no alternative normalization or made-up dates.
    run('Replay Flipp capture: stage, advertise, promote products', process.execPath,
      [flippScript, '--capture', resolve(repo, capture), '--write', '--backup-confirmed']);
  }

  // Handoff archives can contain canonical products without a stored image.
  // Copy the latest linked flyer image onto those products so the catalogue
  // never renders placeholder art for products that have flyer photos.
  run('Backfill product images from flyer offers', process.execPath,
    [resolve(repo, 'scripts/backfill-product-images.mjs')]);

  const verify = await open(clientUrl.toString());
  try {
    await verifyIdentity(verify, DATABASE);
    const sql = `SELECT
      (SELECT COUNT(*)::int FROM retailers) AS retailers,
      (SELECT COUNT(*)::int FROM stores) AS stores,
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM staged_offers) AS staged_offers,
      (SELECT COUNT(*)::int FROM advertised_offers) AS advertised_offers,
      (SELECT COUNT(*)::int FROM product_evidence) AS product_evidence,
      (SELECT COUNT(*)::int FROM price_observations) AS price_observations`;
    const counts = (await verify.query(sql)).rows[0];
    console.log('\n=== POPULATION REPORT ===');
    console.log(JSON.stringify({database:DATABASE, counts, fullArchive: Boolean(fullArchive), flyerReplay: Boolean(capture),
      caveats: fullArchive ? ['Review user IDs are detached in shared archive','Validity windows retain historical dates'] :
      ['Product-centred archive excludes unlinked staging and advertisement records',
       'No verified store-level price observations in the handoff archive',
       'Historical Flipp capture must be supplied separately to replay all three stages']}, null, 2));
    if (counts.retailers < 7 || counts.stores < 95 || (!fullArchive && counts.products < archive.tables.products.length)) {
      throw Error('Population counts below expected minimum. Inspect output before sharing the database.');
    }
    console.log('SUCCESS: local teammate database populated. Authoritative source database was not accessed.');
  } finally { await verify.end(); }
}
main().catch(err => { console.error(`POPULATION FAILED: ${err.message}`); process.exitCode = 1; });

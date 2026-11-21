/**
 * One-command Flipp ingestion orchestrator. No changes to the existing pipeline.
 * Default: dry-run. Writes require --write --backup-confirmed.
 * Use --capture <directory> for a reproducible offline replay, or --download for a new capture.
 * Node 22+; run from the backend repository root.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const args = process.argv.slice(2);
const options = new Set(['--download','--write','--backup-confirmed','--reprocess']);
const values = new Set(['--capture','--output']);
const parsed = new Map();
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (options.has(a)) {
    if (parsed.has(a)) throw Error(`Duplicate argument: ${a}`);
    parsed.set(a, true);
  } else if (values.has(a)) {
    if (parsed.has(a) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Missing or duplicate value for ${a}`);
    parsed.set(a, args[++i]);
  } else {
    throw Error(`Unknown argument: ${a}`);
  }
}
const download = !!parsed.get('--download');
const existing = parsed.get('--capture');
const write = !!parsed.get('--write');
if (download === !!existing) throw Error('Choose exactly one: --download OR --capture <directory>');
if (parsed.has('--output') && !download) throw Error('--output only applies to --download');
if (write && !parsed.has('--backup-confirmed')) throw Error('SAFETY STOP: --write requires --backup-confirmed (verify your current database backup first)');
if (parsed.has('--backup-confirmed') && !write) throw Error('--backup-confirmed requires --write');
if (parsed.has('--reprocess') && !existing) throw Error('--reprocess is only supported for an existing --capture');

function run(label, command, parameters) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, parameters, { cwd: process.cwd(), stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${label} failed (exit ${result.status ?? 'unknown'}). Pipeline stopped.`);
}
function json(path) {
  if (!existsSync(path)) throw Error(`Missing pipeline report: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const root = resolve(existing || parsed.get('--output') || `data/research/flipp/${stamp}`);
if (download && existsSync(root)) throw Error(`SAFETY STOP: Capture destination already exists: ${root}`);
if (download) run('Capture raw Flipp source', process.execPath, ['--import','tsx','scripts/capture-flipp-research.ts','--output',root]);
const capture = json(join(root,'report.json'));
if (capture.finished !== true || (capture.failures?.length ?? 0) !== 0) throw Error('SAFETY STOP: Capture incomplete or contains failed requests');

run('Verify and inventory source capture', process.execPath, ['scripts/preview-b6-flipp-capture.mjs',root]);
const preview = json(join(root,'analysis','b6-historical-preview','summary.json'));
if (preview.missingSourceFiles !== 0 || preview.conflicts !== 0 || preview.uniqueFlyerItemPairs <= 0) throw Error('SAFETY STOP: Source inventory failed');

const writeFlags = write ? ['--write','--backup-confirmed'] : [];
run('Stage flyer records', process.execPath, ['--import','tsx','scripts/ingest-flipp-capture.ts',root,...(parsed.has('--reprocess') ? ['--reprocess'] : []),...writeFlags]);
const staging = json(join(root,'analysis','reusable-ingestion',write ? 'write-report.json':'dry-run-report.json'));
run('Promote eligible advertisements', process.execPath, ['--import','tsx','scripts/promote-flipp-advertised-offers.ts',...writeFlags]);
const advertising = json(resolve('data/research/living-db', write ? 'flipp-offers-write.json':'flipp-offers-dry-run.json'));
run('Promote confident canonical products', process.execPath, ['--import','tsx','scripts/promote-flipp-products.ts',...writeFlags]);
const products = json(resolve('data/research/living-db', write ? 'product-promotion-write.json':'product-promotion-dry-run.json'));

// Copy the three stage summaries into a timestamped, self-contained record.
// This is additive reporting, not a replacement for the original evidence.
const result = {mode: write ? 'WRITE' : 'DRY_RUN', capture: basename(root), captureDirectory:root,
  generatedAt:new Date().toISOString(), source:{uniqueFlyerItemPairs:preview.uniqueFlyerItemPairs,priced:preview.priced,notPriced:preview.notPriced,missingSourceFiles:preview.missingSourceFiles,conflicts:preview.conflicts},
  staging, advertising, products};
const outDir = resolve('data/research/living-db');
mkdirSync(outDir,{recursive:true});
const out = join(outDir,`flipp-full-run-${stamp}.json`);
writeFileSync(out,JSON.stringify(result,null,2)+'\n','utf8');
console.log(`\nSUCCESS — ${result.mode} pipeline completed. Combined report: ${out}`);
console.log(JSON.stringify({mode:result.mode,capture:result.capture,source:result.source,
  staged:staging.inserted ?? 0,advertised:advertising.inserted ?? 0,
  productsCreated:products.createdProducts ?? 0,productLinksCreated:products.newLinks ?? 0,conflicts:products.conflicts ?? null},null,2));

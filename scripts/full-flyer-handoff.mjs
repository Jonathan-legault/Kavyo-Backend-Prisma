/**
 * Complete, source-faithful flyer-data handoff, separate from the product-centred archive.
 * EXPORT is READ ONLY. IMPORT is transactional and accepts only an EMPTY, migrated,
 * local kavyo_team_dev database. No users, passwords, roles or baskets are exported.
 * Reviewer user IDs are detached; review decision, timestamps and notes remain.
 */
import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
const {Client}=pg;
// Keep PostgreSQL timestamp microseconds intact instead of rounding through JS Date.
for(const oid of [1114,1184,1082])pg.types.setTypeParser(oid,v=>v);
const mode=process.argv[2];
const args=process.argv.slice(3);
const fileArg=args.find(a=>a.startsWith('--file='));
const filename=path.resolve(fileArg?.slice(7)||'data/handoff/kavyo-full-flyer-data.json.gz');
const sourceArg=args.find(a=>a.startsWith('--source-db='))?.slice(12);
const applyArg=args.find(a=>a.startsWith('--apply-to='))?.slice(11);
const minimumArg=args.find(a=>a.startsWith('--min-staged='))?.slice(13);
const minimum=minimumArg===undefined?0:Number(minimumArg);
checkMinimum();
function checkMinimum(){if(minimumArg!==undefined&&(!Number.isSafeInteger(minimum)||minimum<1))throw Error('Invalid --min-staged threshold')}
const TABLES=['source_systems','retailers','products','stores','ingest_batches','flyers','staged_offers','product_evidence','advertised_offers','price_observations'];
const FORMAT='KAVYO_FULL_FLYER_DATA_V1';
const DST='kavyo_team_dev';
function check(v,m){if(!v)throw Error(m)}
function url(){check(process.env.DATABASE_URL,'DATABASE_URL not set');const u=new URL(process.env.DATABASE_URL);check(['postgresql:','postgres:'].includes(u.protocol),'Expected PostgreSQL URL');check(['localhost','127.0.0.1'].includes(u.hostname) && (!u.port||u.port==='5432'),'Local PostgreSQL localhost:5432 only');check(!u.searchParams.has('schema')||u.searchParams.get('schema')==='public','Expected public schema');return u}
async function db(expected){const u=url();const name=decodeURIComponent(u.pathname.slice(1));check(name===expected,`DATABASE_URL targets ${name}, expected ${expected}`);const c=new Client({connectionString:u.toString()});await c.connect();const r=(await c.query('SELECT current_database() AS db,current_schema() AS schema')).rows[0];check(r.db===expected&&r.schema==='public','Database/schema connection identity mismatch');return c}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const tableName=t=>{check(TABLES.includes(t),'Unrecognized table');return '"'+t+'"'};
function ids(rows,col){return [...new Set(rows.map(r=>r[col]).filter(Boolean))]}
async function select(c,q,vals=[]){return (await c.query(q,vals)).rows}
async function exportAll(){
 check(sourceArg,'Export requires --source-db=<authoritative-db-name>');check(sourceArg!==DST,'Cannot export from disposable team database');
 check(args.every(a=>a.startsWith('--file=')||a.startsWith('--source-db=')||a.startsWith('--min-staged=')),'Unrecognized export argument');
 const c=await db(sourceArg);
 try{
  await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const tables={};
  for(const t of ['source_systems','retailers','stores','ingest_batches','flyers','staged_offers','advertised_offers']){
    tables[t]=await select(c,`SELECT * FROM ${tableName(t)} ORDER BY id`);
  }
  // Include canonical products referenced by flyers, their evidence, and linked store observations.
  const productIds=[...new Set([...ids(tables.staged_offers,'matched_product_id'),...ids(tables.advertised_offers,'product_id')])];
  tables.products=productIds.length?await select(c,'SELECT * FROM products WHERE id = ANY($1::uuid[]) ORDER BY id',[productIds]):[];
  tables.product_evidence=productIds.length?await select(c,'SELECT * FROM product_evidence WHERE product_id = ANY($1::uuid[]) ORDER BY id',[productIds]):[];
  tables.price_observations=productIds.length?await select(c,'SELECT * FROM price_observations WHERE product_id = ANY($1::uuid[]) ORDER BY id',[productIds]):[];
  // Source has reviewer FK to users; user records and credentials are NEVER distributed.
  const detachedReviewerLinks=tables.staged_offers.filter(r=>r.reviewed_by_user_id!==null).length;
  tables.staged_offers=tables.staged_offers.map(r=>({...r,reviewed_by_user_id:null}));
  await c.query('COMMIT');
  const counts=Object.fromEntries(TABLES.map(t=>[t,tables[t].length]));
  check(counts.staged_offers>0,'Authoritative database has zero staged offers; wrong source?');
  check(counts.staged_offers>=minimum,`Export prevented: only ${counts.staged_offers} staged offers, expected at least ${minimum}. Check which database holds the three weeks of flyer records.`);
  const payload={format:FORMAT,generatedAt:new Date().toISOString(),sourceDatabase:sourceArg,
    description:'Complete staged flyer history, all flyers and published advertisements, referenced canonical products and evidence, and referenced product price observations. User/basket tables omitted.',
    redactions:{reviewedByUserId:detachedReviewerLinks},counts,tables};
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  check(!fs.existsSync(filename),`Refusing to overwrite ${filename}`);
  const compressed=gzipSync(Buffer.from(JSON.stringify(payload)));
  fs.writeFileSync(filename,compressed,{flag:'wx'});
  const digest=sha(compressed);fs.writeFileSync(filename+'.sha256',digest+'  '+path.basename(filename)+'\n',{flag:'wx'});
  console.log(JSON.stringify({result:'EXPORTED_READ_ONLY',sourceDatabase:sourceArg,file:filename,sha256:digest,counts,reviewerIdsDetached:detachedReviewerLinks},null,2));
 }catch(e){try{await c.query('ROLLBACK')}catch{}throw e}finally{await c.end()}
}
function readArchive(){
 check(fs.existsSync(filename),`Archive missing: ${filename}`);
 const compressed=fs.readFileSync(filename),checksum=sha(compressed);
 const checkFile=filename+'.sha256';check(fs.existsSync(checkFile),'Missing .sha256 file');
 check(fs.readFileSync(checkFile,'utf8').trim().split(/\s+/)[0]===checksum,'Archive SHA-256 mismatch');
 const data=JSON.parse(gunzipSync(compressed).toString('utf8'));
 check(data.format===FORMAT,'Archive format mismatch');
 for(const t of TABLES){check(Array.isArray(data.tables?.[t]),`Missing archive table ${t}`);check(data.tables[t].length===data.counts?.[t],`Count mismatch ${t}`)}
 check(!('users' in data.tables)&&!('baskets' in data.tables),'Unsafe archive has private user/basket tables');
 check(data.tables.staged_offers.every(r=>!r.reviewed_by_user_id),'Archive contains user IDs');
 return {data,checksum};
}
function verifyRows(t,rows){
 if(!rows.length)return [];
 const fields=Object.keys(rows[0]);
 check(fields.includes('id'),`${t}: missing id`);
 for(const f of fields)check(/^[a-z][a-z0-9_]*$/.test(f),`Unsafe field ${f}`);
 for(const r of rows)check(fields.length===Object.keys(r).length&&fields.every(f=>Object.hasOwn(r,f)),`Inconsistent ${t} columns`);
 return fields;
}
async function importAll(){
 check(applyArg===DST,`Import requires --apply-to=${DST}`);
 check(args.every(a=>a.startsWith('--file=')||a.startsWith('--apply-to=')),'Unrecognized import argument');
 const {data,checksum}=readArchive();check(data.sourceDatabase!==DST,'Refusing a self-sourced archive');
 const c=await db(DST);
 try{
  await c.query('BEGIN');
  // No silent merging with partial legacy handoff: this must be a CLEAN migrated DB.
  for(const t of TABLES){const n=Number((await c.query(`SELECT COUNT(*)::int AS n FROM ${tableName(t)}`)).rows[0].n);check(n===0,`${t} already has ${n} rows; full import requires a fresh migrated database, before other seeds`)}
  for(const t of TABLES){
   const rows=data.tables[t],fields=verifyRows(t,rows);if(!rows.length)continue;
   const jsonCols=new Set((await select(c,`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND data_type IN ('json','jsonb')`,[t])).map(x=>x.column_name));
   const perBatch=Math.min(50,Math.max(1,Math.floor(60000/fields.length)));
   for(let start=0;start<rows.length;start+=perBatch){
    const block=rows.slice(start,start+perBatch),values=[];
    const sets=block.map(row=>{
      const ph=fields.map(f=>{const v=row[f];values.push(jsonCols.has(f)&&v!==null?JSON.stringify(v):v);return '$'+values.length});
      return '('+ph.join(',')+')';
    });
    await c.query(`INSERT INTO ${tableName(t)} (${fields.map(f=>'"'+f+'"').join(',')}) VALUES ${sets.join(',')}`,values);
   }
   console.log(`${t}: ${rows.length} restored`);
  }
  for(const t of TABLES){const n=Number((await c.query(`SELECT COUNT(*)::int AS n FROM ${tableName(t)}`)).rows[0].n);check(n===data.counts[t],`RESTORE_MISMATCH ${t}: ${n} vs ${data.counts[t]}`)}
  await c.query('COMMIT');
  console.log(JSON.stringify({result:'RESTORED',target:DST,sha256:checksum,counts:data.counts,reviewerIdsDetached:data.redactions?.reviewedByUserId??0},null,2));
 }catch(e){try{await c.query('ROLLBACK')}catch{}throw e}finally{await c.end()}
}
async function audit(){
 check(sourceArg,'Audit requires --source-db=<database-name>');
 check(args.every(a=>a.startsWith('--source-db=')),'Unrecognized audit argument');
 const c=await db(sourceArg);
 try {
  const summary=(await c.query(`SELECT (SELECT COUNT(*)::int FROM staged_offers) staged_offers, (SELECT COUNT(*)::int FROM advertised_offers) advertised_offers, (SELECT COUNT(*)::int FROM flyers) flyers, (SELECT COUNT(*)::int FROM ingest_batches) ingest_batches, (SELECT COUNT(*)::int FROM products) products`)).rows[0];
  const weeks=await select(c,`SELECT date_trunc('week',observed_at AT TIME ZONE 'America/Edmonton')::date AS week_start,COUNT(*)::int AS records,COUNT(*) FILTER (WHERE advertised_price_amount IS NOT NULL)::int AS priced FROM staged_offers GROUP BY 1 ORDER BY 1`);
  console.log(JSON.stringify({database:sourceArg,summary,weeks},null,2));
 }finally{await c.end()}
}
try{if(mode==='audit')await audit();else if(mode==='export')await exportAll();else if(mode==='import')await importAll();else if(mode==='inspect'){const {data,checksum}=readArchive();console.log(JSON.stringify({format:data.format,sourceDatabase:data.sourceDatabase,sha256:checksum,counts:data.counts,redactions:data.redactions},null,2))}else throw Error('Usage: audit --source-db=NAME | export --source-db=NAME [--min-staged=10000] [--file=PATH] | inspect [--file=PATH] | import --apply-to=kavyo_team_dev [--file=PATH]')}
catch(e){console.error('FULL FLYER HANDOFF FAILED:',e.message);process.exitCode=1}

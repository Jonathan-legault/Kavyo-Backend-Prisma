/** Kavyo product-centred handoff: real data only. Node >=20, npm deps: pg, dotenv.
 * Export: read-only, transactionally consistent source snapshot.
 * Import: strict schema preflight, transactional insert-only, rollback dry-run, idempotent.
 * Never exports/imports stores, price observations, basket records or invented prices.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import pg from 'pg';
const { Client } = pg;
const mode = process.argv[2];
const opts = process.argv.slice(3);
const argFile = opts.find(x => !x.startsWith('--'));
const filename = path.resolve(argFile || 'data/research/living-db/kavyo-product-contract-seed.json.gz');
const T = ['source_systems','retailers','products','ingest_batches','flyers','staged_offers','product_evidence','advertised_offers'];
const REFS = {
  ingest_batches:{source_system_id:'source_systems'},
  flyers:{source_system_id:'source_systems',retailer_id:'retailers'},
  staged_offers:{source_system_id:'source_systems',ingest_batch_id:'ingest_batches',flyer_id:'flyers',retailer_id:'retailers',matched_product_id:'products'},
  product_evidence:{source_system_id:'source_systems',product_id:'products'},
  advertised_offers:{source_system_id:'source_systems',retailer_id:'retailers',product_id:'products',flyer_id:'flyers'}
};
const KEY = {
  source_systems:['name','source_type'],retailers:['name'],
  products:['product_name','brand','barcode','quantity_value','quantity_unit','quantity_text','is_active'],
  ingest_batches:['source_system_id','source_reference','status'],
  flyers:['source_system_id','external_id','retailer_id'],
  staged_offers:['ingest_batch_id','record_key','source_system_id','source_record_id','matched_product_id'],
  product_evidence:['product_id','source_system_id','source_record_id','evidence_type','verified'],
  advertised_offers:['stable_key','source_system_id','retailer_id','store_id','product_id','source_record_id','advertised_price_amount','regular_price_amount','market_key','valid_from','valid_until']
};
const q=x=>'"'+x.replaceAll('"','""')+'"';
function assert(v,m){if(!v)throw new Error(m)}
function canon(v){
 if(v===undefined || v===null)return null;
 if(v instanceof Date)return v.toISOString();
 if(typeof v==='number')return String(v);
 if(typeof v==='string' && /^-?\d+(?:\.\d+)?$/.test(v))return String(Number(v));
 if(typeof v==='object')return JSON.stringify(v);
 return String(v);
}
function compare(table,a,b,fields=KEY[table]){
 for(const col of fields){if(canon(a[col])!==canon(b[col]))throw new Error(`DATA_CONFLICT ${table} ID ${a.id}: ${col} existing=${JSON.stringify(a[col])} seed=${JSON.stringify(b[col])}`)}
}
async function connect(){
 assert(process.env.DATABASE_URL,'DATABASE_URL is required');
 const url=new URL(process.env.DATABASE_URL);
 assert(['postgres:','postgresql:'].includes(url.protocol),'DATABASE_URL must be PostgreSQL');
 const client=new Client({connectionString:process.env.DATABASE_URL});
 await client.connect();
 const r=await client.query('SELECT current_database() db, current_schema() schema');
 return {client, db:r.rows[0].db, schema:r.rows[0].schema, host:url.host};
}
async function rows(c,sql,values=[]){return (await c.query(sql,values)).rows}
async function first(c,sql,values=[]){return (await c.query(sql,values)).rows[0]||null}
async function columns(c,table){return (await rows(c,`SELECT column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 ORDER BY ordinal_position`,[table]));}
async function ensure(c,table,fields){const present=new Map((await columns(c,table)).map(x=>[x.column_name,x]));assert(present.size>0,`SCHEMA_MISSING table ${table}`);const missing=fields.filter(k=>!present.has(k));assert(!missing.length,`SCHEMA_MISSING ${table} columns: ${missing.join(', ')}`);return present}
async function byIds(c,table,ids){return ids.length?rows(c,`SELECT * FROM ${q(table)} WHERE id=ANY($1::uuid[]) ORDER BY id`,[ids]):[]}
function uniq(xs){return [...new Set(xs.filter(x=>x!=null))]}
async function exportSeed(){
 const {client:c,db,host}=await connect();
 try{
  assert(db==='kavyo_phase_b_test'||process.env.HANDOFF_ALLOW_SOURCE_DB===db,`Source ${db} not authorized. Set HANDOFF_ALLOW_SOURCE_DB=${db} explicitly if intended.`);
  await c.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  for(const t of T)await ensure(c,t,['id',...KEY[t]]);
  // Product-centred snapshot includes active and inactive canonical identities, preserving status.
  const products=await rows(c,'SELECT * FROM products ORDER BY id');
  const productIds=products.map(p=>p.id);
  const evidence=productIds.length?await rows(c,'SELECT * FROM product_evidence WHERE product_id=ANY($1::uuid[]) ORDER BY id',[productIds]):[];
  const ads=productIds.length?await rows(c,'SELECT * FROM advertised_offers WHERE product_id=ANY($1::uuid[]) ORDER BY id',[productIds]):[];
  // Keep staging linked to selected products OR corresponding to exported advertisements.
  // Source item keys are scoped to source system + retailer to avoid cross-retailer false matches.
  const staging=await rows(c,`SELECT DISTINCT s.* FROM staged_offers s
    WHERE s.matched_product_id=ANY($1::uuid[])
       OR EXISTS (SELECT 1 FROM advertised_offers a
         WHERE a.product_id=ANY($1::uuid[]) AND a.source_system_id=s.source_system_id
           AND a.source_record_id=s.source_record_id
           AND a.retailer_id IS NOT DISTINCT FROM s.retailer_id)
    ORDER BY s.id`,[productIds]);
  const batchIds=uniq(staging.map(x=>x.ingest_batch_id));
  const flyerIds=uniq([...staging.map(x=>x.flyer_id),...ads.map(x=>x.flyer_id)]);
  const batches=await byIds(c,'ingest_batches',batchIds);
  const flyers=await byIds(c,'flyers',flyerIds);
  const retailers=await byIds(c,'retailers',uniq([...ads.map(x=>x.retailer_id),...staging.map(x=>x.retailer_id),...flyers.map(x=>x.retailer_id)]));
  const sourceSystems=await byIds(c,'source_systems',uniq([...evidence.map(x=>x.source_system_id),...ads.map(x=>x.source_system_id),...staging.map(x=>x.source_system_id),...batches.map(x=>x.source_system_id),...flyers.map(x=>x.source_system_id)]));
  const payload={format:'KAVYO_PRODUCT_CONTRACT_NO_STORES_V2',generatedAt:new Date().toISOString(),sourceDatabase:db,
    sourceHost:host,contents:'Canonical products, linked advertisements and provenance. No Store or PriceObservation records included.',
    caveats:['Historical advertised prices are not store-verified shelf prices','No Store or PriceObservation rows are exported','Existing recipient stores are preserved','Unlinked ads outside the product-centred scope are excluded','Inactive canonical products included with is_active=false','Postal geography does not prove store applicability'],
    tables:{source_systems:sourceSystems,retailers,products,ingest_batches:batches,flyers,staged_offers:staging,product_evidence:evidence,advertised_offers:ads}};
  payload.counts=Object.fromEntries(T.map(t=>[t,payload.tables[t].length]));
  payload.counts.activeProducts=products.filter(p=>p.is_active).length;
  payload.counts.linkedProducts=uniq(ads.map(a=>a.product_id)).length;
  payload.counts.priceObservations=0;
  payload.counts.storesExported=0;
  await c.query('COMMIT');
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  const encoded=gzipSync(Buffer.from(JSON.stringify(payload)));
  fs.writeFileSync(filename,encoded);
  console.log(JSON.stringify({result:'EXPORTED_READ_ONLY',file:filename,database:db,counts:payload.counts,sha256:crypto.createHash('sha256').update(encoded).digest('hex')},null,2));
 }catch(e){try{await c.query('ROLLBACK')}catch{}throw e}finally{await c.end()}
}
async function assertColumnsForSeed(c,seed){
 const found={};
 for(const t of T){
  assert(Array.isArray(seed.tables?.[t]),`Invalid seed: ${t} missing`);
  const keys=uniq(seed.tables[t].flatMap(x=>Object.keys(x)));
  found[t]=await ensure(c,t,['id',...KEY[t],...keys]);
  // Any newly-required destination columns not provided by the seed must have defaults.
  for(const [k,col] of found[t])if(seed.tables[t].length>0 && col.is_nullable==='NO'&&!keys.includes(k)&&col.column_default==null)
   throw Error(`SCHEMA_REQUIRED ${t}.${k} is a new non-null destination column without default; manual migration/mapping required`);
 }
 return found;
}
async function insertRow(c,t,row){
 const fields=Object.keys(row),params=fields.map((_,i)=>'$'+(i+1));
 const sql=`INSERT INTO ${q(t)} (${fields.map(q).join(',')}) VALUES (${params.join(',')}) ON CONFLICT DO NOTHING RETURNING id`;
 const result=await c.query(sql,fields.map(k=>row[k]));
 assert(result.rowCount===1,`Unique constraint conflict on ${t} source ID ${row.id}; no changes committed`);
}
async function importSeed(){
 assert(fs.existsSync(filename),`Seed missing: ${filename}`);
 const seed=JSON.parse(gunzipSync(fs.readFileSync(filename)).toString('utf8'));
 assert(seed.format==='KAVYO_PRODUCT_CONTRACT_NO_STORES_V2','Wrong seed format');
 const dry=opts.includes('--dry-run');
 const {client:c,db,host}=await connect();
 try{
  assert(db!==seed.sourceDatabase,`Refusing to import into same-named source DB ${db}`);
  if(!dry){assert(opts.includes(`--apply-to=${db}`),`Use --apply-to=${db} for authorized write`);assert(opts.includes('--ack-backup'),`A verified database backup is required; add --ack-backup`)}
  assert(!Object.prototype.hasOwnProperty.call(seed.tables,'stores'), 'Seed contains Store rows; use the no-stores handoff seed');
  await c.query('BEGIN');
  await assertColumnsForSeed(c,seed);
  const maps=Object.fromEntries(T.map(t=>[t,new Map()]));
  const stats={};
  for(const t of T){
   let inserted=0,reused=0;
   for(const original of seed.tables[t]){
    const row={...original};
    for(const [field,parent] of Object.entries(REFS[t]||{}))if(row[field]!=null){
      const mapped=maps[parent].get(row[field]);
      assert(mapped,`Dependency ${parent}/${row[field]} absent for ${t}/${row.id}`);
      row[field]=mapped;
    }
    // An advertisement may refer to a store only if the recipient already has
    // the exact confirmed Store ID. Never import, create, or infer stores.
    if(t==='advertised_offers' && row.store_id!=null){
      const knownStore=await first(c,'SELECT id, retailer_id FROM stores WHERE id=$1',[row.store_id]);
      assert(knownStore,`UNRESOLVED_STORE_REF offer ${row.id}: store ${row.store_id} absent from destination; manual reconciliation required`);
      assert(knownStore.retailer_id===row.retailer_id,`STORE_RETAILER_MISMATCH offer ${row.id}: store ${row.store_id}`);
    }
    let existing=await first(c,`SELECT * FROM ${q(t)} WHERE id=$1`,[row.id]);
    // Natural-key reconciliation only for established unique keys; never invent product identity.
    if(!existing){
      if(t==='source_systems'||t==='retailers')existing=await first(c,`SELECT * FROM ${q(t)} WHERE name=$1`,[row.name]);
      if(t==='products'&&row.barcode){const coll=await first(c,'SELECT * FROM products WHERE barcode=$1',[row.barcode]);assert(!coll,`Product barcode ${row.barcode} already exists with another ID; reconcile manually`)}
      if(t==='flyers')existing=await first(c,'SELECT * FROM flyers WHERE source_system_id=$1 AND external_id=$2',[row.source_system_id,row.external_id]);
      if(t==='staged_offers')existing=await first(c,'SELECT * FROM staged_offers WHERE ingest_batch_id=$1 AND record_key=$2',[row.ingest_batch_id,row.record_key]);
      if(t==='advertised_offers')existing=await first(c,'SELECT * FROM advertised_offers WHERE stable_key=$1',[row.stable_key]);

    }
    if(existing){
      if(t==='advertised_offers'&&existing.id!==row.id)assert(existing.stable_key===row.stable_key,'Offer stable key mismatch');
      compare(t,existing,row);
      maps[t].set(original.id,existing.id);reused++;
    }else{
      await insertRow(c,t,row);
      maps[t].set(original.id,row.id);inserted++;
    }
   }
   stats[t]={inserted,reused};
  }
  if(dry)await c.query('ROLLBACK');else await c.query('COMMIT');
  console.log(JSON.stringify({result:dry?'DRY_RUN_ROLLED_BACK':'IMPORTED',database:db,host,seedSource:seed.sourceDatabase,seedCounts:seed.counts,stats,priceObservationRowsInserted:0,storeRowsInserted:0,existingStoresUntouched:true,basketRecordsChanged:0},null,2));
 }catch(e){try{await c.query('ROLLBACK')}catch{}throw e}finally{await c.end()}
}
try{
 if(mode==='export')await exportSeed();
 else if(mode==='import')await importSeed();
 else throw Error('Usage: node scripts/kavyo-product-contract.mjs export [file] | import [file] --dry-run | import [file] --apply-to=DB_NAME --ack-backup');
}catch(e){console.error(e.stack||e.message);process.exitCode=1}

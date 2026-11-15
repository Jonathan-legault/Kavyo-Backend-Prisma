/** Kavyo B.6.5: export/import a referentially complete, non-user dataset.
 * Requires project's existing pg and dotenv packages. Does not export user/basket/price observation rows.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import pg from 'pg';
const { Client } = pg;
const tables = [
  'source_systems', 'retailers', 'products', 'stores', 'ingest_batches',
  'flyers', 'staged_offers', 'product_evidence', 'advertised_offers'
];
const required = {
  source_systems: ['id','name'], retailers: ['id','name'], products: ['id','product_name','brand','quantity_text','barcode'],
  stores: ['id','retailer_id'], ingest_batches: ['id','source_system_id'],
  flyers: ['id','source_system_id','external_id'],
  staged_offers: ['id','ingest_batch_id','record_key','source_system_id'],
  product_evidence: ['id','source_system_id','product_id'],
  advertised_offers: ['id','stable_key','product_id','retailer_id','source_system_id']
};
const refs = {
  stores: {retailer_id:'retailers'},
  ingest_batches:{source_system_id:'source_systems'},
  flyers:{source_system_id:'source_systems',retailer_id:'retailers'},
  staged_offers:{ingest_batch_id:'ingest_batches',source_system_id:'source_systems',flyer_id:'flyers',retailer_id:'retailers',matched_product_id:'products'},
  product_evidence:{source_system_id:'source_systems',product_id:'products'},
  advertised_offers:{source_system_id:'source_systems',retailer_id:'retailers',store_id:'stores',product_id:'products',flyer_id:'flyers'}
};
const q = k => '"' + k.replaceAll('"','""') + '"';
const source = process.env.DATABASE_URL;
const mode = process.argv[2];
const filename = path.resolve(process.argv[3] || 'data/research/living-db/kavyo-b65-teammate-seed.json.gz');
const validUrl = x => {
  if (!x) throw Error('DATABASE_URL not set; check .env or environment');
  const url=new URL(x);
  if (!['postgres:','postgresql:'].includes(url.protocol)) throw Error('Requires PostgreSQL DATABASE_URL');
  return url;
};
async function connect() {
  const conn=validUrl(source);
  const client=new Client({connectionString:source});
  await client.connect();
  const { rows }=await client.query('SELECT current_database() AS name');
  return {client, db:rows[0].name, server:conn.hostname};
}
async function verifyColumns(client, table, keys) {
  const {rows}=await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1',[table]);
  const actual=new Set(rows.map(r=>r.column_name));
  const missing=keys.filter(k=>!actual.has(k));
  if (missing.length) throw Error(`Schema incompatible: ${table} missing ${missing.join(', ')}. Apply the schema migration first.`);
}
const equal = (a,b) => String(a??'')===String(b??'');
async function exportSeed() {
  const {client,db}=await connect();
  try {
    if (db !== 'kavyo_phase_b_test' && process.env.HANDOFF_ALLOW_SOURCE_DB !== db) throw Error(`Source database ${db} is not authorized; expected kavyo_phase_b_test. Set HANDOFF_ALLOW_SOURCE_DB explicitly if intentional.`);
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const data={format:'KAVYO_B65_HANDOFF_V1',createdAt:new Date().toISOString(),sourceDatabase:db,sourcePriceObservationsIncluded:false,tables:{}};
    for(const table of tables){
      await verifyColumns(client,table,required[table]);
      const {rows}=await client.query(`SELECT * FROM ${q(table)} ORDER BY id`);
      data.tables[table]=rows;
      console.log(`${table}: ${rows.length}`);
    }
    await client.query('COMMIT');
    const counts=Object.fromEntries(tables.map(t=>[t,data.tables[t].length]));
    data.counts=counts;
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    fs.writeFileSync(filename,gzipSync(Buffer.from(JSON.stringify(data))));
    console.log(JSON.stringify({mode:'EXPORTED',file:filename,sourceDatabase:db,counts},null,2));
  } catch(e) {try{await client.query('ROLLBACK')}catch{};throw e;} finally{await client.end()}
}
async function find(client,table,column,value,secondColumn,secondValue){
  if(value==null) return null;
  const sql=`SELECT * FROM ${q(table)} WHERE ${q(column)}=$1` + (secondColumn?` AND ${q(secondColumn)}=$2`:'')+' LIMIT 1';
  const result=await client.query(sql,secondColumn?[value,secondValue]:[value]);
  return result.rows[0]||null;
}
async function insert(client,table,row){
  const fields=Object.keys(row); const values=fields.map(f=>row[f]);
  const res=await client.query(`INSERT INTO ${q(table)} (${fields.map(q).join(',')}) VALUES (${fields.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT DO NOTHING RETURNING id`,values);
  if(res.rowCount!==1) throw Error(`Refused silent uniqueness collision in ${table}, source id ${row.id}. No changes committed.`);
}
function guard(table, existing, row){
  const cols={
    source_systems:['name','source_type'],retailers:['name'],products:['product_name','brand','quantity_value','quantity_unit','quantity_text'],
    stores:['retailer_id','address','postal_code'],ingest_batches:['source_system_id','source_reference'],
    flyers:['source_system_id','external_id'],staged_offers:['ingest_batch_id','record_key','source_system_id'],
    product_evidence:['source_system_id','product_id','source_record_id'],
    advertised_offers:['stable_key','source_system_id','retailer_id','product_id','source_record_id']
  }[table];
  for(const col of cols) if(!equal(existing[col],row[col])) throw Error(`Collision in ${table}: existing ${existing.id} has incompatible ${col} (${existing[col]} vs ${row[col]}). Aborting transaction.`);
}
async function importSeed(){
  const confirmation=process.argv[4];
  if(!fs.existsSync(filename)) throw Error(`Seed not found: ${filename}`);
  const data=JSON.parse(gunzipSync(fs.readFileSync(filename)).toString('utf8'));
  if(data.format!=='KAVYO_B65_HANDOFF_V1') throw Error('Unsupported seed format');
  for(const table of tables) if(!Array.isArray(data.tables?.[table]))throw Error(`Missing seed table: ${table}`);
  const {client,db,server}=await connect();
  try {
    if(db===data.sourceDatabase && confirmation!=='--allow-same-name') throw Error('Destination database name matches source; verify you are using teammate database (or supply --allow-same-name explicitly).');
    if(confirmation!==`--apply-to=${db}`) throw Error(`Safety stop. To apply to ${db}, rerun with fourth argument --apply-to=${db}. No writes performed.`);
    await client.query('BEGIN');
    const maps=Object.fromEntries(tables.map(t=>[t,new Map()]));
    const applied={};
    for(const table of tables){
      const rows=data.tables[table];
      await verifyColumns(client,table,Object.keys(rows[0]||Object.fromEntries(required[table].map(k=>[k,null]))));
      let created=0,reused=0;
      for(const original of rows){
        const row={...original};
        for(const [field,parent] of Object.entries(refs[table]||{})){
          if(row[field]!=null){
            const mapped=maps[parent].get(row[field]);
            if(!mapped)throw Error(`Missing dependency ${parent} id ${row[field]} for ${table} ${row.id}`);
            row[field]=mapped;
          }
        }
        let existing=await find(client,table,'id',row.id);
        if(!existing){
          if(table==='source_systems'||table==='retailers')existing=await find(client,table,'name',row.name);
          else if(table==='products'&&row.barcode)existing=await find(client,table,'barcode',row.barcode);
          else if(table==='flyers')existing=await find(client,table,'source_system_id',row.source_system_id,'external_id',row.external_id);
          else if(table==='staged_offers')existing=await find(client,table,'ingest_batch_id',row.ingest_batch_id,'record_key',row.record_key);
          else if(table==='advertised_offers')existing=await find(client,table,'stable_key',row.stable_key);
        }
        if(existing){guard(table,existing,row);maps[table].set(original.id,existing.id);reused++;}
        else{await insert(client,table,row);maps[table].set(original.id,row.id);created++;}
      }
      applied[table]={created,reused};
      console.log(`${table}: ${created} inserted, ${reused} reused`);
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({mode:'IMPORTED',destination:db,applied,priceObservationRowsImported:0,basketsChanged:false},null,2));
  } catch(e){try{await client.query('ROLLBACK')}catch{};throw e;} finally{await client.end()}
}
if(mode==='export')await exportSeed();
else if(mode==='import')await importSeed();
else throw Error('Usage: node scripts/kavyo-handoff.mjs export [file] OR import [file] --apply-to=DATABASE_NAME');

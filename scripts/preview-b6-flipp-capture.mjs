/** Read-only B.6 Flipp capture inventory. Node 22+; no npm dependencies.
 * Does not classify product scope or create DB rows. All offer decisions must use B.5 pipeline.
 * Usage: node scripts/preview-b6-flipp-capture.mjs data/research/flipp/<capture>
 */
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]??'');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const reportPath=join(root,'report.json');
if(!process.argv[2] || !existsSync(reportPath)) throw Error('Expected capture directory containing report.json');
const report=read(reportPath);
if(report.finished!==true) throw Error('Capture report does not say finished=true');
const output=join(root,'analysis','b6-historical-preview');mkdirSync(output,{recursive:true});
const combos=report.combos??[];
const seen=new Map(), missing=[], conflicts=[], byRetailer=new Map(), byFlyer=new Map(), byPostal=new Map(), manifest=[];
const identity=x=>String(x??'');
const bump=(map,k)=>map.set(k,(map.get(k)??0)+1);
for(const combo of combos){
  const retailer=identity(combo.retailer),postalCode=identity(combo.postalCode);
  for(const flyerId of combo.flyerIds??[]){
    const path=join(root,'queries',postalCode,'flyers',`${flyerId}.json`);
    if(!existsSync(path)){missing.push({kind:'FLYER_QUERY',path});continue;}
    const raw=read(path);
    const items=Array.isArray(raw.items)?raw.items: Array.isArray(raw?.flyer?.items)?raw.flyer.items:null;
    if(!items){missing.push({kind:'UNSUPPORTED_FLYER_QUERY_SHAPE',path,keys:Object.keys(raw)});continue;}
    for(const row of items){
      if(row?.id==null)continue;
      const itemId=identity(row.id);
      const detailPath=join(root,'items',`${itemId}.json`);
      if(!existsSync(detailPath)){missing.push({kind:'ITEM_DETAIL',path:detailPath});continue;}
      const wrapper=read(detailPath),item=wrapper.item??wrapper;
      if(identity(item.id)!==itemId){conflicts.push({kind:'ITEM_ID_MISMATCH',itemId,actual:item.id});continue;}
      if(identity(item.flyer_id)!==identity(flyerId)){conflicts.push({kind:'FLYER_ID_MISMATCH',itemId,expected:flyerId,actual:item.flyer_id});continue;}
      const sourceMerchant=identity(item.merchant??retailer),merchantId=identity(item.merchant_id);
      if(sourceMerchant.toLowerCase()!==retailer.toLowerCase()){
        conflicts.push({kind:'RETAILER_MISMATCH',itemId,expected:retailer,actual:sourceMerchant});continue;
      }
      const key=`${flyerId}:${itemId}`; // source identity; postal codes are applicability, not new items
      let rowOut=seen.get(key);
      if(!rowOut){
        rowOut={source:'FLIPP_FLYERS',capture:root.split(/[\\/]/).at(-1),sourceRecordId:itemId,flyerExternalId:identity(flyerId),merchantId,retailer,postalCodes:[],name:item.name??null,brand:item.brand??null,description:item.description??null,advertisedPrice:item.current_price??null,regularPrice:item.original_price??null,priceText:item.price_text??null,prePriceText:item.pre_price_text??null,saleStory:item.sale_story??null,disclaimer:item.disclaimer_text??null,validFrom:item.valid_from??item.flyer_valid_from??null,validUntil:item.valid_to??item.flyer_valid_to??null,inStoreOnly:item.in_store_only??false,sku:item.sku??null,sourceUrl:item.ttm_url??null,itemDetailPath:`items/${itemId}.json`,itemDetailSha256:createHash('sha256').update(readFileSync(detailPath)).digest('hex')};
        seen.set(key,rowOut);bump(byRetailer,retailer);bump(byFlyer,`${retailer}|${flyerId}`);
      } else if(rowOut.retailer!==retailer||rowOut.merchantId!==merchantId){
        conflicts.push({kind:'SOURCE_ID_CONFLICT',itemId,flyerId,retailer});continue;
      }
      if(!rowOut.postalCodes.includes(postalCode))rowOut.postalCodes.push(postalCode);
      bump(byPostal,postalCode);
    }
  }
}
for(const item of seen.values()){item.postalCodes.sort();manifest.push(item);}
manifest.sort((a,b)=>a.retailer.localeCompare(b.retailer)||a.flyerExternalId.localeCompare(b.flyerExternalId)||a.sourceRecordId.localeCompare(b.sourceRecordId));
const isPositivePrice=v=>{if(v===null||v===undefined)return false;const s=String(v).trim();return /^\$?\s*\d+(?:\.\d+)?$/.test(s)&&Number(s.replace(/^\$\s*/,''))>0;};
const summary={mode:'READ_ONLY',capture:root.split(/[\\/]/).at(-1),captureFinished:true,reportStartedAt:report.startedAt??null,reportCompletedAt:report.completedAt??null,combos:combos.length,retailers:[...byRetailer.entries()].sort().map(([name,items])=>({name,items})),flyerAssociations:[...byFlyer.entries()].sort().map(([retailerAndFlyer,items])=>({retailerAndFlyer,items})),uniqueFlyerItemPairs:manifest.length,uniqueItemIds:new Set(manifest.map(x=>x.sourceRecordId)).size,postalReferences:Object.fromEntries(byPostal),missingSourceFiles:missing.length,conflicts:conflicts.length,priced:manifest.filter(x=>isPositivePrice(x.advertisedPrice)).length,notPriced:manifest.filter(x=>!isPositivePrice(x.advertisedPrice)).length,notice:'No product classification or DB writes. Use existing B.5 scope/variant/price eligibility logic during staged ingestion. Flyer validity may extend beyond the nominal capture week; do not infer shelf prices or store-level availability.'};
writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
writeFileSync(join(output,'source-records.jsonl'),manifest.map(x=>JSON.stringify(x)).join('\n')+'\n');
writeFileSync(join(output,'exceptions.json'),JSON.stringify({missing,conflicts},null,2)+'\n');
console.log(JSON.stringify({...summary,files:['summary.json','source-records.jsonl','exceptions.json'].map(x=>join(output,x))},null,2));
if(missing.length||conflicts.length)process.exitCode=2;

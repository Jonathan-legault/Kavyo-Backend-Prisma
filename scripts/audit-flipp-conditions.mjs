/** Kavyo Flipp promotional-condition audit v2. Node 22+, no dependencies.
 * Read-only source processing; outputs under analysis/condition-audit-v2 or named CSV sibling.
 * Usage: node scripts/audit-flipp-conditions.mjs <archive-directory|condition-examples.csv>
 */
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {join,resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const squish = x => String(x ?? '').replace(/\s+/g,' ').trim();
const csv = x => '"'+String(x??'').replace(/"/g,'""')+'"';
const toCsv = rows => rows.map(row=>row.map(csv).join(',')).join('\n')+'\n';
const rx = (source,flags='i')=>new RegExp(source,flags);
// Restrict price / promotion conditions to related fields, rather than searching arbitrary string fields.
const textFields = ['price_text','pre_price_text','post_price_text','sale_story','disclaimer_text'];
const pushMatch = (matches, kind, field, value, match, extra={}) => matches.push({kind,field,evidence:squish(match[0]),sourceText:squish(value),...extra});
export function detectConditions(record) {
  const matches=[];
  for(const field of textFields) {
    const value=squish(record[field]); if(!value) continue;
    const add=(kind,re,parse)=>{ const m=re.exec(value);if(m) pushMatch(matches,kind,field,value,m,parse?.(m)??{}); };
    add('LOYALTY_POINTS', /\b[\d,]+\s*(?:(?:scene\s*\+|pc\s*optimum|more\s*rewards?)\s*)?(?:pts?|points?)\b|\b(?:get|earn|collect)\s*[\d,]+\s*(?:pts?|points?)\b/i);
    add('MEMBER_PRICE', /(?<!non-)(?<!non )\b(?:members?\s*(?:only\s*)?price|member\s*exclusive\s*price|club\s*price|optimum\s+members?\s+price|price\s+(?:with|for)\s+(?:members?|loyalty\s+card))\b/i);
    add('MEMBER_DISCOUNT', /\bmembers?\s*(?:save|get\s+\d+\s*%\s*off)\b/i);
    add('MEMBER_REWARD', /\bmembers?\s+earn\s+\d+\s*%/i);
    add('MEMBERSHIP_REQUIRED', /\bmust\s+be\s+a\s+registered\s+(?:pc\s*)?optimum\s+member\b|\bmust\s+(?:scan|present|use)\s+(?:a|your)\s+(?:member|loyalty)\s+card\b/i);
    add('NONMEMBER_PRICE', /\bnon[- ]?members?\s*(?:price\s*)?(?:from\s*)?\$?\s*\d+(?:\.\d+)?/i);
    add('MIN_PURCHASE_QUANTITY', /\bwhen\s+you\s+buy\s+(\d+)\b|\b(?:must\s+buy|buy\s+at\s+least|minimum\s+(?:purchase\s+)?(?:of\s+)?|min\.?\s*(?:qty|quantity)\s*)\s*(\d+)\b/i,m=>({quantity:Number(m[1]??m[2])}));
    add('MIN_PURCHASE_AMOUNT', /\b(?:when\s+you\s+spend|minimum\s+purchase\s+of|spend\s+at\s+least)\s*\$\s*(\d+(?:\.\d+)?)/i,m=>({amount:Number(m[1])}));
    add('MAX_PURCHASE_QUANTITY', /\blimit\s*(\d+)\b/i,m=>({quantity:Number(m[1])}));
    add('OVER_LIMIT_PRICE', /\bover\s*limit\s*pay\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:ea|each)?\b/i,m=>({amount:Number(m[1])}));
    add('MULTIBUY', /\bbuy\s+(\d+)\s+get\s+(?:(\d+)(?:st|nd|rd|th)?\s+)?(?:of\s+equal\s+or\s+lesser\s+value\s+)?(?:free|\d+\s*%\s*off)|\bbuy\s+(\d+)\s+get\s+(\d+)(?:st|nd|rd|th)?\s+(?:of\s+equal\s+or\s+lesser\s+value\s+)?\d+\s*%\s*off|\b(\d+)\s+for\s+\$\s*(\d+(?:\.\d+)?)/i);
    add('MIX_MATCH', /\bmix\s*(?:and|&)\s*match\b/i);
    add('ONLINE_ONLY', /\bonline\s*only\b/i);
    add('IN_STORE_ONLY', /\bin[- ]store\s*only\b/i);
    add('PICKUP_ONLY', /\bpickup\s*only\b/i);
    add('DELIVERY_ONLY', /\bdelivery\s*only\b/i);
    add('APP_REQUIRED', /\b(?:app\s+exclusive|clip\s+(?:the\s+)?app|must\s+clip|load(?:ed)?\s+(?:the\s+)?offer)\b/i);
    add('PRICE_RANGE', /\b(?:non[- ]?members?\s+price\s+)?from\s*\$?\s*\d+(?:\.\d+)?\s*[-–]\s*\$?\s*\d+(?:\.\d+)?|\bprice\s+range\b/i);
  }
  // Weight price: explicit unit in the price field, or money per weight in description.
  for(const field of ['price_text','pre_price_text','post_price_text','description']) {
    const value=squish(record[field]); if(!value)continue;
    const m=field==='description' ? /\$?\d+(?:\.\d+)?\s*\/\s*(?:kg|lb|100\s*g|100\s*ml)\b|\$\s*\d+(?:\.\d+)?\s*per\s*(?:kg|lb|100\s*g|100\s*ml)\b/i.exec(value) : /(?:^|\s)(?:\/\s*)?(?:lb|kg|100\s*g|100\s*ml)\b|\bper\s*(?:lb|kg|100\s*g|100\s*ml)\b/i.exec(value);
    if(m)pushMatch(matches,'WEIGHT_PRICE',field,value,m);
  }
  // Variant signal: description of eligible products, not arbitrary sale slogans.
  for(const field of ['name','description']) {
    const value=squish(record[field]); if(!value)continue;
    const m=/\b(?:selected\s+variet(?:y|ies)|assorted\s+(?:variet(?:y|ies)|flavou?rs?|sizes)|selected\s+(?:flavou?rs?|sizes)|mix\s*(?:and|&)\s*match)\b/i.exec(value);
    if(m)pushMatch(matches,'PRODUCT_VARIANTS',field,value,m);
  }
  return matches;
}
function csvParse(raw) { const rows=[]; let row=[],val='',quoted=false; for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"'){val+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(val);val='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&raw[i+1]==='\n')i++;row.push(val);if(row.some(v=>v!==''))rows.push(row);row=[];val='';}else val+=c;}if(val||row.length){row.push(val);rows.push(row);}const headers=rows.shift()??[];return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??'']))); }
function readArchive(root){ const report=JSON.parse(readFileSync(join(root,'report.json'),'utf8'));const rows=[];const missing=[];const seen=new Set();
 for(const combo of report.combos??[])for(const flyerId of combo.flyerIds??[]){const path=join(root,'queries',combo.postalCode,'flyers',flyerId+'.json');if(!existsSync(path)){missing.push(path);continue;}const doc=JSON.parse(readFileSync(path,'utf8'));for(const item of doc.items??[]){if(item?.id==null)continue;const itemId=String(item.id), key=[combo.retailer,combo.postalCode,flyerId,itemId].join('|');if(seen.has(key))continue;seen.add(key);const detailPath=join(root,'items',itemId+'.json');if(!existsSync(detailPath))missing.push(detailPath);const raw=existsSync(detailPath)?JSON.parse(readFileSync(detailPath,'utf8')):{};const detail=raw.item??raw;
 rows.push({retailer:combo.retailer,postalCode:combo.postalCode,flyerId,itemId,name:detail.name??item.name??'',price:detail.current_price??item.price??'',description:detail.description??item.description??'',...Object.fromEntries(textFields.map(f=>[f,detail[f]??item[f]??'']))}); }}return {rows,missing}; }
export function runAudit(records,out,missing=[],inputMode='archive'){mkdirSync(out,{recursive:true});const evidence=[['retailer','postalCode','flyerId','itemId','name','kind','field','evidence','quantity','amount','sourceText']];const itemRows=[['retailer','postalCode','flyerId','itemId','name','price','conditionTypes','matchCount']];const counts={},byRetailer={},typesByItem=new Map();let withConditions=0;
 for(const record of records){const matches=detectConditions(record);const kinds=[...new Set(matches.map(m=>m.kind))];if(kinds.length)withConditions++;itemRows.push([record.retailer,record.postalCode,record.flyerId,record.itemId,record.name,record.price,kinds.join('|'),matches.length]);for(const kind of kinds){counts[kind]=(counts[kind]??0)+1;const rt=byRetailer[record.retailer]??={observations:0,signals:{}};rt.signals[kind]=(rt.signals[kind]??0)+1;byRetailer[record.retailer]=rt;}const rt=byRetailer[record.retailer]??={observations:0,signals:{}};rt.observations++;byRetailer[record.retailer]=rt;
 for(const m of matches)evidence.push([record.retailer,record.postalCode,record.flyerId,record.itemId,record.name,m.kind,m.field,m.evidence,m.quantity??'',m.amount??'',m.sourceText]);
 const key=`${record.retailer}|${record.itemId}`;const set=typesByItem.get(key)??new Set();kinds.forEach(v=>set.add(v));typesByItem.set(key,set);
 }
 const summary={records:records.length,withConditions,uniqueRetailerItems:typesByItem.size,counts,uniqueItemSignals:Object.fromEntries(Object.keys(counts).map(k=>[k,[...typesByItem.values()].filter(set=>set.has(k)).length])),byRetailer,missingSourceFiles:missing,inputMode,limitations:[...(inputMode==='csv' ? ['Input CSV may contain only earlier regex-positive examples; results cannot be extrapolated to the full archive.','Some source fields may be unavailable in the pre-existing examples CSV.'] : []),'Detected signals are evidence-based candidates and require review before publishing conditional pricing.']};
 writeFileSync(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');writeFileSync(join(out,'condition-evidence.csv'),toCsv(evidence));writeFileSync(join(out,'item-classifications.csv'),toCsv(itemRows));writeFileSync(join(out,'condition-counts.csv'),toCsv([['condition','observations','uniqueRetailerItems'],...Object.keys(counts).sort().map(k=>[k,counts[k],summary.uniqueItemSignals[k]])]));return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
const arg=process.argv[2];if(!arg){console.error('Usage: node scripts/audit-flipp-conditions.mjs <archive-directory|condition-examples.csv>');process.exit(1)}const input=resolve(arg),isCsv=extname(input).toLowerCase()==='.csv';if(!existsSync(input)){console.error('Input not found: '+input);process.exit(1)}const {rows,missing}=isCsv?{rows:csvParse(readFileSync(input,'utf8')),missing:[]} :readArchive(input);const out=isCsv?join(dirname(input),'condition-audit-v2'):join(input,'analysis','condition-audit-v2');console.log(JSON.stringify({output:out,...runAudit(rows,out,missing,isCsv?'csv':'archive')},null,2));}

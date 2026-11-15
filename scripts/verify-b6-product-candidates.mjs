/**
 * B.6.4 source verification of reviewed fingerprint candidates.
 * Node 22+, no dependencies. STRICTLY READ_ONLY with respect to PostgreSQL and capture source.
 * Run from backend repository root. The script DOES NOT approve identities or create a write allowlist.
 * Source items are matched to candidate descriptions, and ambiguous matches are surfaced for manual review.
 */
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';

const argv=process.argv.slice(2);
if(argv.some(x=>!x.startsWith('--capture=')&&!x.startsWith('--triage=')&&!x.startsWith('--review=')))
  throw Error('Usage: node scripts/verify-b6-product-candidates.mjs [--capture=directory] [--triage=csv] [--review=csv]');
const arg=(name,fallback)=>resolve(argv.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3)??fallback);
const capture=arg('capture','data/research/flipp/2026-11-09T22-22-05-015Z');
const triagePath=arg('triage','data/research/living-db/kavyo-b6-product-triage.csv');
const reviewPath=arg('review','data/research/living-db/b6-product-review.csv');
const manifestPath=join(capture,'analysis/b6-historical-preview/source-records.jsonl');
for(const p of [triagePath,reviewPath,manifestPath])if(!existsSync(p))throw Error('Required file missing: '+p);
function csvParse(content){
 const rows=[];let cells=[],value='',quoted=false;
 const s=content.replace(/^\uFEFF/,'');
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(quoted){if(ch==='"'){if(s[i+1]==='"'){value+='"';i++;}else quoted=false;}else value+=ch;}
  else if(ch==='"')quoted=true;
  else if(ch===','){cells.push(value);value='';}
  else if(ch==='\n'){cells.push(value.replace(/\r$/,''));if(cells.some(x=>x!==''))rows.push(cells);cells=[];value='';}
  else value+=ch;
 }
 if(quoted)throw Error('Malformed CSV: unclosed quote');
 if(value||cells.length){cells.push(value);rows.push(cells);}
 const header=rows.shift();if(!header?.length)throw Error('Empty CSV');
 return rows.map((parts,index)=>{if(parts.length!==header.length)throw Error('Malformed CSV line '+(index+2));return Object.fromEntries(header.map((h,i)=>[h,parts[i]]));});
}
const triage=csvParse(readFileSync(triagePath,'utf8'));
const reviewed=csvParse(readFileSync(reviewPath,'utf8'));
const byFingerprint=new Map(reviewed.map(r=>[r.fingerprint,r]));
const safeFingerprint=x=>/^[a-f0-9]{64}$/.test(x);
if(triage.length!==86||triage.some(x=>!safeFingerprint(x.fingerprint)))throw Error('Unexpected triage manifest: expected 86 unique identities');
if(new Set(triage.map(x=>x.fingerprint)).size!==triage.length)throw Error('Duplicate candidate fingerprints');
const normalized = value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[®™]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const normalizeQty = value=>normalized(value).replace(/\bgrams?\b/g,'g').replace(/\bkilograms?\b/g,'kg').replace(/\bmillilit(?:ers?|res?)\b/g,'ml').replace(/\blit(?:ers?|res?)\b/g,'l').replace(/\s+/g,'');
function score(candidate, source){
 const ca=normalized(candidate.productName), sn=normalized(source.name);
 if(!ca||!sn)return -1;
 const words=x=>new Set(x.split(' ').filter(t=>t.length>1));
 const a=words(ca), b=words(sn);
 const intersection=[...a].filter(x=>b.has(x)).length;
 const union=new Set([...a,...b]).size;
 let similarity=union?intersection/union:0;
 if(ca===sn)similarity+=1;
 else if(sn.includes(ca)||ca.includes(sn))similarity+=0.25;
 const brand=normalized(candidate.brand);
 const rawBrand=normalized(source.brand);
 if(brand&&rawBrand){if(brand===rawBrand)similarity+=0.35;else similarity-=0.6;}
 if(brand && (sn.includes(brand)||ca.includes(brand)))similarity+=0.05;
 const q=normalizeQty(candidate.quantityText);
 const sourceAll=normalizeQty([source.name,source.description].filter(Boolean).join(' '));
 if(q && sourceAll.includes(q))similarity+=0.20;
 return similarity;
}
function textFlags(text){
 const s=String(text??'');
 const rules={
  'EXPLICIT_VARIANTS':/\b(?:selected|assorted|assortment|variet(?:y|ies)|flavou?rs?|shades?|styles?|mix\s*(?:and|&)\s*match|any\s+flavou?r)\b/i,
  'PRODUCT_ALTERNATIVES':/\s(?:or|and\/or)\s/i,
  'SIZE_RANGE':/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|pk|pack)\s*(?:-|–|to)\s*\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|pk|pack)\b/i,
  'PRICE_CONDITION':/\b(?:members?\s+only|member\s+price|buy\s+\d+|when\s+you\s+buy|minimum|limit\s+\d+|over\s+limit|with\s+card)\b/i,
  'LOYALTY_COMMENT':/\b(?:scene\+|pc\s*optimum|bonus\s+points?|earn\s+\d+\s*(?:pts|points))\b/i,
  'ONLINE_OR_STORE_ONLY':/\b(?:online\s+only|in.store\s+only|pickup\s+only)\b/i
 };
 return Object.keys(rules).filter(k=>rules[k].test(s));
}
const manifest=readFileSync(manifestPath,'utf8').trim().split(/\r?\n/).map(s=>JSON.parse(s));
if(manifest.length!==5969)throw Error('Capture inventory incomplete: '+manifest.length+' records (expected 5969)');
const priced=manifest.filter(x=>x.advertisedPrice!=null&&Number(x.advertisedPrice)>0);
if(priced.length!==5279)throw Error('Unexpected priced count '+priced.length);
const perRetailer=new Map();
for(const r of priced){const list=perRetailer.get(r.retailer)??[];list.push(r);perRetailer.set(r.retailer,list);}
const existing=reviewed.filter(r=>r.disposition==='REUSE_ACTIVE');
const details=[],summaries=[];
for(const c of triage){
 const base=byFingerprint.get(c.fingerprint);
 if(!base||base.disposition!=='REVIEW_REQUIRED')throw Error('Triage/review mismatch: '+c.fingerprint);
 const retailers=c.retailers.split(';').map(x=>x.trim()).filter(Boolean);
 const pool=retailers.flatMap(retailer=>perRetailer.get(retailer)??[]);
 const ranked=pool.map(record=>({record,score:score(c,record)})).filter(x=>x.score>=0.65).sort((a,b)=>b.score-a.score||a.record.sourceRecordId.localeCompare(b.record.sourceRecordId));
 // Cannot establish exact candidate-offer association without persisted offer IDs. Retain competing plausible source items.
 const selected=ranked.filter(x=>x.score>=Math.max(0.75,(ranked[0]?.score??0)-0.30)).slice(0,Math.max(12,Number(c.offers)||1));
 const sourceIds=new Set(selected.map(x=>`${x.record.flyerExternalId}|${x.record.sourceRecordId}`));
 const duplicateCandidates=existing.filter(x=>normalized(x.brand)===normalized(c.brand)&&normalizeQty(x.quantityText)===normalizeQty(c.quantityText)&&(
   normalized(x.productName)===normalized(c.productName)||score(c,{name:x.productName,brand:x.brand,description:x.quantityText})>=1.05
 )).map(x=>({fingerprint:x.fingerprint,productName:x.productName,retailers:x.retailers}));
 let matched=0,variantSignals=0,conditionSignals=0;
 for(const {record,score:matchScore} of selected){
  const p=join(capture,record.itemDetailPath??`items/${record.sourceRecordId}.json`);
  const raw=existsSync(p)?JSON.parse(readFileSync(p,'utf8')):null;
  const item=raw?.item??raw;
  const desc=[record.name,record.description,record.priceText,record.prePriceText,record.saleStory,record.disclaimer,item?.disclaimer_text,item?.flyer_disclaimer_text].filter(Boolean).join(' | ');
  const flags=textFlags(desc);
  if(flags.some(f=>['EXPLICIT_VARIANTS','PRODUCT_ALTERNATIVES','SIZE_RANGE'].includes(f)))variantSignals++;
  if(flags.includes('PRICE_CONDITION'))conditionSignals++;
  details.push({fingerprint:c.fingerprint,triage:c.triage,candidateName:c.productName,candidateBrand:c.brand,candidateQuantity:c.quantityText,
   sourceRecordId:record.sourceRecordId,flyerExternalId:record.flyerExternalId,retailer:record.retailer,merchantId:record.merchantId,
   postalCodes:record.postalCodes,sourceName:record.name,sourceBrand:record.brand,description:record.description,
   advertisedPrice:record.advertisedPrice,regularPrice:record.regularPrice,priceText:record.priceText,prePriceText:record.prePriceText,
   saleStory:record.saleStory,disclaimer:record.disclaimer,validFrom:record.validFrom,validUntil:record.validUntil,sku:record.sku,
   inStoreOnly:record.inStoreOnly,sourceUrl:record.sourceUrl,sourceDetailFile:record.itemDetailPath,flags,matchScore:+matchScore.toFixed(4)});
  matched++;
 }
 const ambiguous=(ranked.length>selected.length)||(matched!==Number(c.offers))||new Set(selected.map(x=>x.record.retailer)).size<retailers.length;
 const next=c.triage==='HOLD_OUT_OF_SCOPE'?'KEEP_HELD_OUT_OF_SCOPE':c.triage==='HOLD_IDENTITY_OR_PACKAGE'?'KEEP_HELD_AMBIGUOUS':
  c.triage==='RECONCILE_EXISTING_FIRST'?'RECONCILE_WITH_PRODUCT_ID_AND_SOURCE_EVIDENCE':
  !matched?'INSPECT_UNMATCHED_SOURCE':duplicateCandidates.length?'POTENTIAL_DUPLICATE_RECONCILE_FIRST':
  ambiguous?'SOURCE_ASSOCIATION_AMBIGUOUS_REVIEW':variantSignals?'SOURCE_VARIANTS_REVIEW':
  'SOURCE_PRESENT_REVIEW_REQUIRED';
 summaries.push({fingerprint:c.fingerprint,productName:c.productName,brand:c.brand,quantityText:c.quantityText,
  expectedOffers:Number(c.offers),retailers:retailers.join(';'),triage:c.triage,sourceMatches:matched,
  plausibleSourceMatches:ranked.length,flaggedVariantMatches:variantSignals,flaggedPriceConditions:conditionSignals,
  potentialExistingDuplicates:duplicateCandidates.map(x=>x.productName).join(';'),
  nextAction:next,approvedForWrite:'NO',matchOfferIds:[...sourceIds].join(';')});
}
const output=resolve('data/research/living-db/b6-source-verification');mkdirSync(output,{recursive:true});
const csvValue=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const header=Object.keys(summaries[0]);
writeFileSync(join(output,'candidate-verification.csv'),[header.join(','),...summaries.map(x=>header.map(k=>csvValue(x[k])).join(','))].join('\n')+'\n');
writeFileSync(join(output,'source-evidence.json'),JSON.stringify(details,null,2)+'\n');
const byDecision=Object.fromEntries([...new Set(summaries.map(x=>x.nextAction))].sort().map(key=>[key,summaries.filter(x=>x.nextAction===key).length]));
const result={mode:'READ_ONLY',capture:basename(capture),candidates:triage.length,reviewNew:triage.filter(x=>x.triage==='SOURCE_VERIFY_NEW').length,
 reconcileFirst:triage.filter(x=>x.triage==='RECONCILE_EXISTING_FIRST').length,
 existingHold:triage.filter(x=>x.triage.startsWith('HOLD')).length,pricedSourceRecords:priced.length,
 sourceMatches:details.length,matchedCandidateIdentities:summaries.filter(x=>x.sourceMatches>0).length,
 exactSourceAssociationsCertified:0,automaticallyApproved:0,decisionCounts:byDecision,
 caveats:['Source records are matched by normalized names, brand and quantity; this is a candidate search, NOT a verified AdvertisedOffer-to-StagedOffer FK join.',
 'When several same-brand descriptions are similar, the candidate-offer association must be checked manually against sourceStagedOfferId or offerId in PostgreSQL.',
 'Description language flags are review signals, not final price-condition classifications. Reuse the B.5 offer eligibility and pricing functions for writes.',
 'No product creation, alias writing, database reads or database mutations occur in this script.'],
 files:[join(output,'candidate-verification.csv'),join(output,'source-evidence.json')]};
writeFileSync(join(output,'summary.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

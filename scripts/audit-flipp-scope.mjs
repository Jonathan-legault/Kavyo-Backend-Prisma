/** Kavyo read-only scope audit. Node.js 22+, no dependencies. Does NOT alter source files or ingestion data. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const reportPath = join(root, 'report.json');
if (!existsSync(reportPath)) {
  console.error('Usage: node scripts/audit-flipp-scope.mjs data/research/flipp/<capture-folder>');
  process.exit(1);
}
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const out = join(root, 'analysis', 'scope-audit');
mkdirSync(out, { recursive: true });
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const evidence = (rules, text) => rules.flatMap(([category, regex]) => { const match = regex.exec(text); return match ? [{category, text:match[0]}] : []; });
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,' ').trim();
const csv = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const writeCsv = (filename, rows) => writeFileSync(join(out, filename), rows.map(row=>row.map(csv).join(',')).join('\n')+'\n');

// Scope policy: shopping basket = groceries, household essentials, personal care, pet supplies,
// pharmacy/OTC/first aid, vitamins, baby products. This is classification, NOT clinical guidance.
// Named rules use boundaries and avoid broad words like 'cat', 'apple', 'tablet', or 'oil'.
const include = [
 ['PET', /\b(?:dog food|cat food|pet food|pet treats?|dog treats?|cat treats?|pet litter|cat litter|dog litter|pet shampoo|pet bowls?|pet toys?|dog toys?|cat toys?|dog beds?|cat beds?|pet supplies|puppy food|kitten food|bird seed|fish food|aquarium food|litter box|pet pads?|dog leash|dog collar|dog harness|pet carrier)\b/i],
 ['PHARMACY', /\b(?:pain relie(?:f|ver)|acetaminophen|ibuprofen|naproxen|aspirin|antacid|cold & flu|cough syrup|cough drops|allergy relief|antihistamine|nasal spray|saline spray|first aid|bandages?|adhesive bandages?|gauze|wound care|antiseptic|hydrogen peroxide|rubbing alcohol|thermometer|vitamins?|supplements?|probiotics?|omega[- ]?3|melatonin|medicated cream|heating pad|pregnancy tests?|contact lens solution|eye drops|ear drops|nicotine patches?|sunscreen|sunblock|spf\s*\d+|condoms?)\b/i],
 ['BABY', /\b(?:baby formula|infant formula|baby food|baby wipes?|diapers?|nappies|training pants|baby shampoo|baby lotion|baby powder|baby wash|baby cereal|baby snacks?|pacifiers?|baby bottles?|baby care|night pants|pull[- ]?ups)\b/i],
 ['PERSONAL_CARE', /\b(?:shampoo|conditioner|body wash|bar soap|hand soap|toothpaste|toothbrush|dental floss|mouthwash|deodorant|antiperspirant|razor blades?|shaving cream|skin care|moisturiz(?:er|ing)|face wash|facial cleanser|menstrual|tampons?|sanitary pads?|incontinence|bladder control|absorbent underwear|discreet underwear|hair dye|hair colour|makeup|mascara|lip balm|lipstick|face cream|cotton swabs?|cotton balls?|bath tissue|toilet paper|facial tissues?)\b/i],
 ['HOUSEHOLD', /\b(?:laundry detergent|laundry pods?|fabric softener|dish soap|dishwasher detergent|dishwasher tabs?|dishwashing liquid|cleaning wipes?|disinfectant|all[- ]purpose cleaner|surface cleaner|window cleaner|bleach|garbage bags?|trash bags?|paper towels?|aluminum foil|aluminium foil|plastic wrap|cling wrap|parchment paper|food storage bags?|sandwich bags?|freezer bags?|food containers?|cleaning supplies|sponges?|scrub pads?|air freshener)\b/i],
 ['GROCERY', /\b(?:milk|cheese|yog(?:urt|hourt)|butter|cream cheese|ice cream|eggs?|bread|bagels?|tortillas?|cereal|oatmeal|rice|pasta|noodles?|flour|sugar|salt|pepper|spices?|seasoning|olive oil|canola oil|vegetable oil|vinegar|sauce|ketchup|mustard|mayonnaise|jam|jelly|peanut butter|almond butter|honey|cookies?|crackers?|chips|popcorn|chocolate|candy|candies|snacks?|granola|nuts?|almonds?|peanuts?|cashews?|soup|broth|stock|beans?|lentils?|tomatoes?|potatoes?|onions?|carrots?|lettuce|salad|spinach|broccoli|cauliflower|apples?|bananas?|oranges?|berries|grapes?|avocado|chicken|beef|pork|turkey|bacon|sausages?|fish|salmon|shrimp|seafood|steak|ground beef|hamburger|pizza|frozen meals?|entrées?|entrees?|frozen vegetables?|juice|coffee|tea|water|sparkling beverages?|soft drinks?|soda|cola|energy drinks?|sports drinks?|pickles?|olives?|canned|preserves?|deli|meat|produce|bakery|dessert|cake|muffins?|buns?|rolls?|fruit|vegetables?|beverages?|chili|tuna|salmon|flavoured? water|seltzer)\b/i]
];
// Strongly contextual exclusions only. Avoid 'plate', 'bowl', 'battery', 'cream', 'oil', 'tablet', 'cat'.
const exclude = [
 ['ELECTRONICS', /\b(?:airpods?|headphones?|earbuds?|televisions?|smart tvs?|laptops?|chromebooks?|computer monitors?|gaming monitors?|wireless speakers?|bluetooth speakers?|smartphones?|mobile phones?|video games?|gaming consoles?|playstation|xbox|nintendo switch|smart watches?|smartwatch|usb[- ]c cables?|charging cables?|wireless chargers?|phone cases?|screen protectors?|printers?|ink cartridges?|tablets?\s+(?:computer|pc|device))\b/i],
 ['CLOTHING', /\b(?:winter jackets?|winter coats?|hoodies?|sweatshirts?|t[- ]shirts?|jeans|leggings|sneakers?|running shoes?|winter boots?|dress shirts?|pajamas?|pyjamas?|swimwear|underwear|socks?\s+(?:pack|pairs?)|clothing|footwear)\b/i],
 ['HOME_DECOR', /\b(?:ornaments?|christmas decorations?|christmas trees?|holiday decorations?|throw pillows?|decorative pillows?|wall art|picture frames?|photo frames?|table lamps?|floor lamps?|bedding sets?|duvet covers?|comforters?|bed sheets?|curtains?|area rugs?|doormats?|home decor|decorative wreath|side plates?|dinnerware sets?|dining chairs?|sofas?|coffee tables?|side tables?)\b/i],
 ['HARDWARE_AUTOMOTIVE', /\b(?:motor oil|engine oil|windshield wipers?|windshield washer fluid|car batteries?|car tires?|snow tires?|automotive accessories|power drills?|drill bits?|screwdrivers?|tool sets?|power tools?|paint rollers?|paintbrushes?|lawn mowers?|snow blowers?|leaf blowers?)\b/i],
 ['TOYS_SPORT', /\b(?:action figures?|board games?|jigsaw puzzles?|plush toys?|lego sets?|dolls?|remote control cars?|rc cars?|soccer balls?|basketballs?|hockey sticks?|bicycles?|bike helmets?|fitness equipment|yoga mats?|treadmills?|dumbbells?)\b/i],
 ['LARGE_APPLIANCES', /\b(?:microwaves?|air fryer ovens?|air fryer appliances?|toaster ovens?|coffee makers?|blenders?|vacuum cleaners?|refrigerators?|dishwashers?|washing machines?|clothes dryers?)\b/i],
];
const promotions = /^(?:my offers?|get recipe|weekly (?:flyer|offers?)|shop now|see (?:more|details)|save (?:big|more)|everyday (?:essentials|low prices)|bonus (?:points|offer)|exclusive offer|limited time|great savings|mix and match)$/i;
const classify = record => {
  const name = norm(record.name);
  const desc = norm(record.description);
  const brand = norm(record.brand);
  if (!name) return {status:'REVIEW', category:'UNKNOWN', reason:'MISSING_NAME', matchedRule:'',evidence:''};
  if (promotions.test(name)) return {status:'REVIEW',category:'NON_PRODUCT_OR_PROMO',reason:'GENERIC_PROMOTIONAL_HEADING',matchedRule:'',evidence:''};
  // Base identity on name + short description, not arbitrary detail text containing generic promotions.
  const phrase = [name,desc].filter(Boolean).join(' | ');
  const inEvidence = evidence(include, phrase);
  const outEvidence = evidence(exclude, name);
  const inMatch = inEvidence.map(x => x.category);
  const outMatch = outEvidence.map(x => x.category);
  const evidenceText = [...inEvidence.map(x => `IN:${x.category}:${x.text}`), ...outEvidence.map(x => `OUT:${x.category}:${x.text}`)].join(' | ');
  if (outMatch.includes('LARGE_APPLIANCES') && inMatch.every(c=>c==='GROCERY')) return {status:'OUT_OF_SCOPE',category:'LARGE_APPLIANCES',reason:'APPLIANCE_NOT_FOOD',matchedRule:outMatch.join('+'),evidence:evidenceText};
  if (inMatch.length && outMatch.length && outMatch.every(c=>c==='CLOTHING') && /\b(?:incontinence|absorbent|discreet|night pants|training pants|bladder control)\b/i.test(phrase) && inMatch.some(c=>c==='PERSONAL_CARE'||c==='BABY')) return {status:'IN_SCOPE',category:inMatch.includes('BABY')?'BABY':'PERSONAL_CARE',reason:'HYGIENE_UNDERWEAR_NOT_APPAREL',matchedRule:inMatch.join('+'),evidence:evidenceText};
  if (inMatch.length && outMatch.length) return {status:'REVIEW',category:'CONFLICT',reason:'BOTH_IN_SCOPE_AND_OUT_OF_SCOPE_SIGNALS',matchedRule:`${inMatch.join('+')} vs ${outMatch.join('+')}`,evidence:evidenceText};
  if (outMatch.length) return {status:'OUT_OF_SCOPE',category:outMatch[0],reason:'EXPLICIT_NON_GROCERY_PRODUCT',matchedRule:outMatch.join('+'),evidence:evidenceText};
  if (inMatch.length) return {status:'IN_SCOPE',category:inMatch[0],reason:'POSITIVE_CATEGORY_SIGNAL',matchedRule:inMatch.join('+'),evidence:evidenceText};
  return {status:'REVIEW',category:'UNKNOWN',reason:'NO_CONFIDENT_CATEGORY_SIGNAL',matchedRule:'',evidence:''};
};

const recordHeaders = ['retailer','postalCode','flyerId','itemId','name','brand','description','status','category','reason','matchedRule','matchEvidence'];
const records = [recordHeaders];
const summary = {capture:root,generatedAt:new Date().toISOString(),policy:'Groceries + household + personal care + baby + pet + pharmacy/OTC; exclude explicit general merchandise; uncertain items REVIEW',counts:{},byRetailer:{},byCategory:{},warnings:[],missingQueryFiles:[],missingDetailFiles:[],duplicateContextRows:0};
const observed = new Set();
const itemClassifications = new Map();
const samples = {IN_SCOPE:[],OUT_OF_SCOPE:[],REVIEW:[]};
const sampleCounts = new Map();
const uniqueByStatus = {IN_SCOPE:0,OUT_OF_SCOPE:0,REVIEW:0};
for (const combo of report.combos ?? []) {
  const retailer = norm(combo.retailer); const postalCode = norm(combo.postalCode);
  for (const flyerId of combo.flyerIds ?? []) {
    const filename = join(root,'queries',postalCode,'flyers',`${flyerId}.json`);
    if (!existsSync(filename)) { summary.missingQueryFiles.push(filename); continue; }
    const query = read(filename);
    for (const item of query.items ?? []) {
      if (item?.id == null) continue;
      const itemId = String(item.id);
      const recordKey = [retailer,postalCode,flyerId,itemId].join('::');
      if (observed.has(recordKey)) {summary.duplicateContextRows++;continue;}
      observed.add(recordKey);
      const detailPath = join(root,'items',`${itemId}.json`);
      if (!existsSync(detailPath)) summary.missingDetailFiles.push(detailPath);
      const rawDetail = existsSync(detailPath) ? read(detailPath) : null;
      const detail = rawDetail?.item ?? rawDetail ?? {};
      const record = {name:detail.name??item.name,brand:detail.brand??item.brand,description:detail.description??item.description};
      const result=classify(record);
      const row = [retailer,postalCode,flyerId,itemId,norm(record.name),norm(record.brand),norm(record.description),result.status,result.category,result.reason,result.matchedRule,result.evidence??''];
      records.push(row);
      summary.counts[result.status]=(summary.counts[result.status]??0)+1;
      const byRetailer=summary.byRetailer[retailer]??={total:0,IN_SCOPE:0,OUT_OF_SCOPE:0,REVIEW:0};
      byRetailer.total++;byRetailer[result.status]++;summary.byRetailer[retailer]=byRetailer;
      summary.byCategory[result.category]=(summary.byCategory[result.category]??0)+1;
      const sampleKey = `${retailer}::${result.status}`;
      const sampled = sampleCounts.get(sampleKey) ?? 0;
      if (sampled < 100) { samples[result.status].push(row); sampleCounts.set(sampleKey, sampled+1); }
      const uniqueId=`${retailer}::${itemId}`;
      const prior=itemClassifications.get(uniqueId);
      if (!prior) itemClassifications.set(uniqueId,{...result,retailer,itemId,name:record.name});
      else if(prior.status!==result.status || prior.category!==result.category) prior.contextDisagreement=true;
    }
  }
}
summary.uniqueRetailerItems=itemClassifications.size;
for (const classification of itemClassifications.values()) uniqueByStatus[classification.status]++;
summary.uniqueStatusCounts=uniqueByStatus;
summary.sampleLimitPerRetailerStatus=100;
summary.contextObservations=records.length-1;
summary.classificationDisagreements=[...itemClassifications.values()].filter(x=>x.contextDisagreement).length;
if (summary.missingQueryFiles.length) summary.warnings.push('Missing query files prevent a complete coverage count.');
if (!Array.isArray(report.combos) || !report.combos.length) summary.warnings.push('report.combos absent or empty; check capture manifest.');
if (summary.missingDetailFiles.length) summary.warnings.push('Some details absent; classification based on partial records.');
if (!summary.contextObservations) summary.warnings.push('No item observations found; check archive layout.');
writeCsv('all-classifications.csv',records);
for(const status of Object.keys(samples)) writeCsv(`${status.toLowerCase()}-examples.csv`,[recordHeaders,...samples[status]]);
writeCsv('retailer-summary.csv', [['retailer','total','IN_SCOPE','OUT_OF_SCOPE','REVIEW','excludedPct'],...Object.entries(summary.byRetailer).map(([name,v])=>[name,v.total,v.IN_SCOPE,v.OUT_OF_SCOPE,v.REVIEW,+(100*v.OUT_OF_SCOPE/v.total).toFixed(2)])]);
writeFileSync(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({output:out,observations:summary.contextObservations,uniqueRetailerItems:summary.uniqueRetailerItems,counts:summary.counts,uniqueStatusCounts:summary.uniqueStatusCounts,byRetailer:summary.byRetailer,warnings:summary.warnings},null,2));

/** Kavyo read-only scope audit. Node.js 22+, no dependencies. Does NOT alter source files or ingestion data. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const csvAuditMode = process.argv[2] === '--audit-csv';
const root = csvAuditMode ? process.cwd() : resolve(process.argv[2] || '.');
const reportPath = join(root, 'report.json');
if (!csvAuditMode && !existsSync(reportPath)) { console.error('Usage: node scripts/audit-flipp-scope-v4.mjs <capture-folder> OR --audit-csv excluded.csv review.csv'); process.exit(1); }
const report = csvAuditMode ? {combos:[]} : JSON.parse(readFileSync(reportPath, 'utf8'));
const out = join(root, 'analysis', 'scope-audit-v4');
if (!csvAuditMode) mkdirSync(out, { recursive: true });
const read = p => JSON.parse(readFileSync(p, 'utf8'));
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
 ['GROCERY', /\b(?:milk|cheese|yog(?:urt|hourt)|butter|cream cheese|ice cream|eggs?|bread|bagels?|tortillas?|cereal|oatmeal|rice|pasta|noodles?|flour|sugar|salt|pepper|spices?|seasoning|olive oil|canola oil|vegetable oil|vinegar|sauce|ketchup|mustard|mayonnaise|jam|jelly|peanut butter|almond butter|honey|cookies?|crackers?|chips|popcorn|chocolate|candy|candies|snacks?|granola|nuts?|almonds?|peanuts?|cashews?|soup|broth|stock|beans?|lentils?|tomatoes?|potatoes?|onions?|carrots?|lettuce|salad|spinach|broccoli|cauliflower|apples?|bananas?|oranges?|berries|grapes?|avocado|chicken|beef|pork|turkey|bacon|sausages?|fish|salmon|shrimp|seafood|steak|ground beef|hamburger|pizza|frozen meals?|entrées?|entrees?|frozen vegetables?|juice|coffee|tea|water|sparkling beverages?|soft drinks?|soda|cola|energy drinks?|sports drinks?|pickles?|olives?|canned|preserves?|deli|meat|produce|bakery|dessert|cake|muffins?|buns?|rolls?|fruit|vegetables?|beverages?|food|chili|tuna|salmon|flavoured? water|seltzer)\b/i]
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

// Audited additions from the November 11 review/exclusion CSVs.
// Deliberately prefer a product-specific match over a retailer-wide assumption.
const v3Positive = [
 ['BABY', /\b(?:huggies|pampers|baby wipes|infant wipes|parents?['’]? choice wipes|baby shampoo|baby lotion|baby wash|baby diapers|diaper cream|diaper rash|infant cereal)\b/i],
 ['PERSONAL_CARE', /\b(?:poise pads?|depend underwear|depend briefs?|adult diapers?|incontinence pads?|feminine pads?|haircare|hair care|hair styling|styling products?|body lotion|hand lotion|body cream|face serum|body scrub|bath salts|dental rinse|toilet tissues?|facial wipes?|cleansing wipes?|cotton rounds|soap bars?|shower gel)\b/i],
 ['PHARMACY', /\b(?:sinus rinse|sinus relief|nasal rinse|neilmed|webber naturals|multivitamins?|pain relief|electrolyte packets?|first[- ]aid kits?|vitamin [a-z0-9]+|cough (?:medicine|syrup|drops)|allergy (?:tablets|medicine|relief))\b/i],
 ['HOUSEHOLD', /\b(?:multi[- ]purpose cleaners?|toilet bowl cleaners?|shower foam|lysol|scrubbing bubbles|clorox|tide (?:pods|detergent)|febreze|fabric refresher|dishwashing pods?|dish detergent|laundry products?|cleaning products?|disinfecting wipes?|garbage bags?|compost bags?|ziploc|bounty paper towels?|scotties tissues?|reynolds wrap|glad (?:bags|wrap)|storage bags?|dish sponges?)\b/i],
 ['PET', /\b(?:dog (?:biscuits|chews|treats|food|toys)|cat (?:treats|food|litter|toys)|pet (?:treats|food|accessories|care|toys)|purina|pedigree (?:dog|food)|whiskas|temptations cat|greenies (?:dog|cat))\b/i],
 ['GROCERY', /\b(?:sourdough|raspberries|blackberries|okra|hummus|non[- ]dairy creamer|non[- ]alcoholic (?:beer|wine)|potato (?:fries|wedges)|hash\s?browns?|paratha|naan|toblerone|chipits|kisses|cupcakes?|chocolates?|biscuits?|mozza|pesto|frozen ramen|protein bars?|squares|cheddar|creamer|frozen (?:fries|food|dinners?|entrees?|meals?)|sliced (?:ham|turkey|cheese)|yogurt drinks?|fruit cups?|granola bars?|craft beer|sweet peppers?|cucumbers?|zucchini|mushrooms?|celery|mangoes?|pineapple|coconut milk|nut butter|pita|croissants?|donuts?|doughnuts?|pastries|pudding|chips|crackers|nutella|kinder bueno|rees[e]?['’]?s|hershey['’]?s|cavendish (?:fries|premium)|mccain (?:fries|hashbrowns)|schneiders (?:breakfast|sandwiches)|christie (?:premium|ritz))\b/i],
];
const v3Negative = [
 ['TOYS_SPORT', /\b(?:hot wheels|play[- ]doh|lego|toy story|barbie|action figures?|dolls?|toy cars?|collectible figurines?|super mario (?:pull back|racers)|peppa pig|plush (?:toys?|animals?)|puzzles?|board games?|snow sleds?|basketball (?:set|ball)|soccer ball|fidget toys?)\b/i],
 ['HOME_DECOR', /\b(?:ornaments?|christmas trees?|birchwood tree|holiday sweaters?|decorative (?:items?|bowls?|plates?)|dinnerware|cutlery sets?|flatware|bakeware|glassware|holiday decor|floral bouquets?|flower bouquets?|artificial flowers?|planters?|storage bins?|plastic storage bins?|sofas?|table lamps?|comforters?|christmas wreaths?)\b/i],
 ['HARDWARE_AUTOMOTIVE', /\b(?:inverter generators?|portable generators?|snow sleds?|snow blowers?|lawn mowers?|car tires?|windshield washer|car wax|drill sets?|power tools?)\b/i],
 ['CLOTHING', /\b(?:knit (?:straight[- ]leg )?pants|holiday sweaters?|sweaters?|sneakers?|socks?|leggings?|pajamas?|pyjamas?|hoodies?|boots?|jackets?|jeans|shirts?|coats?|clothing|footwear)\b/i],
 ['LARGE_APPLIANCES', /\b(?:coffee makers?|air fryers?|microwave ovens?|toaster ovens?|blenders?|electric kettles?|vacuum cleaners?|fridges?|refrigerators?|washing machines?)\b/i],
 ['ELECTRONICS', /\b(?:duracell (?:aa|aaa)|(?:aa|aaa)\s*\d*\s*batteries|wireless controllers?|gaming monitors?|smartphones?|apple watch|headphones?|laptops?|usb[- ]c|gaming consoles?|nintendo|playstation|xbox)\b/i],
];
const v3Heading = /^(?:click for|direct link|banner\s*[-:]|shop all|discover your favourite brands|see all|view all|more deals|my offers|get recipe|weekly (?:flyer|offers?)|shop now|see (?:more|details)|save (?:big|more)|everyday (?:essentials|low prices)|bonus (?:points|offer)|exclusive offer|limited time|great savings|mix and match)\b/i;
const specialFood = /\b(?:microwave popcorn(?: bags?)?|popcorn bags?|air fryer (?:meals?|chicken|food|fries|snacks?)|non[- ]alcoholic (?:beer|wine))\b/i;
const petApparel = /\b(?:dog|cat|pet|puppy|kitten)\s+(?:sweaters?|jackets?|coats?|booties|clothing|apparel|costumes?)\b/i;
const kitchenStorage = /\b(?:food storage containers?|food storage bins?|food storage sets?)\b/i;
const coffeeMaker = /\bcoffee makers?\b/i;
const careUnderwear = /\b(?:poise|depend|incontinence|bladder control|absorbent underwear|discreet underwear|adult diapers?)\b/i;
const v3Match = (rules,text) => rules.flatMap(([cat,re])=>{const m=re.exec(text);return m?[{cat,evidence:m[0]}]:[];});

const classify = record => {
 const name=norm(record.name), desc=norm(record.description);
 if(!name) return {status:'REVIEW',category:'UNKNOWN',reason:'MISSING_NAME',matchedRule:'',matchEvidence:''};
 if(promotions.test(name)||v3Heading.test(name)) return {status:'REVIEW',category:'NON_PRODUCT_OR_PROMO',reason:'GENERIC_PROMOTIONAL_HEADING',matchedRule:'',matchEvidence:name};
 const phrase=[name,desc].filter(Boolean).join(' | ');
 // v4: explicit product identity takes precedence over misleading category words.
 // Examples are taken from the November 11 transition audit.
 const decisive = [
  ['GROCERY', /\bplanters?\s+(?:cashews?|peanuts?|nuts?|almonds?)\b/i,'IN_SCOPE','IDENTIFIED_PACKAGED_NUTS'],
  ['PET', /\b(?:dry|wet)\s+(?:cat|dog|pet)\s+food\b|\b(?:cat|dog|pet)\s+food\b/i, 'IN_SCOPE','IDENTIFIED_PET_FOOD'],
  ['BABY', /\b(?:pampers|ninjamas|rascals|huggies)\b.{0,100}\b(?:training pants|night(?:time)? pants|underwear|diapers?)\b|\b(?:training pants|night(?:time)? pants)\b/i,'IN_SCOPE','IDENTIFIED_BABY_HYGIENE'],
  ['PERSONAL_CARE', /\b(?:lip products?|lip gloss|lipsticks?|lip balms?)\b/i,'IN_SCOPE','IDENTIFIED_LIP_COSMETIC'],
  ['PHARMACY', /\bdiabetic socks?\b/i,'IN_SCOPE','IDENTIFIED_DIABETIC_SOCKS'],
  ['GROCERY', /\bair fryer\s+(?:entr\S*|meals?|food|chicken|fries|snacks?)\b/i,'IN_SCOPE','IDENTIFIED_PREPARED_FOOD'],
  ['TOYS_SPORT', /\b(?:lego|play[- ]doh|hot wheels)\b|\b\d+[ -]piece puzzles?\b/i,'OUT_OF_SCOPE','IDENTIFIED_TOY'],
  ['CLOTHING', /\b(?:socks?|shirts?|sweaters?|jackets?|boots?|jeans|leggings)\b/i,'OUT_OF_SCOPE','IDENTIFIED_APPAREL'],
 ];
 for (const [category,pattern,status,reason] of decisive) {
   const m=pattern.exec(name);
   if(m) return {status,category,reason,matchedRule:'V4_PRODUCT_IDENTITY',matchEvidence:m[0]};
 }
 // Explicit hygiene exceptions win over generic apparel words like 'underwear'.
 if(careUnderwear.test(name)) return {status:'IN_SCOPE',category:'PERSONAL_CARE',reason:'EXPLICIT_INCONTINENCE_CARE',matchedRule:'CARE_EXCEPTION',matchEvidence:careUnderwear.exec(name)?.[0]};
 if(petApparel.test(name)) return {status:'IN_SCOPE',category:'PET',reason:'PET_APPAREL_ACCESSORY',matchedRule:'PET_EXCEPTION',matchEvidence:petApparel.exec(name)?.[0]};
 if(coffeeMaker.test(name)) return {status:'OUT_OF_SCOPE',category:'LARGE_APPLIANCES',reason:'EXPLICIT_COFFEE_APPLIANCE',matchedRule:'APPLIANCE_EXCEPTION',matchEvidence:coffeeMaker.exec(name)?.[0]};
 if(kitchenStorage.test(name)) return {status:'REVIEW',category:'UNKNOWN',reason:'AMBIGUOUS_KITCHEN_STORAGE_SCOPE',matchedRule:'STORAGE_REVIEW',matchEvidence:kitchenStorage.exec(name)?.[0]};
 // 'Microwave popcorn' is a food, not a microwave oven.
 if(specialFood.test(name)) return {status:'IN_SCOPE',category:'GROCERY',reason:'EXPLICIT_FOOD_EXCEPTION',matchedRule:'FOOD_EXCEPTION',matchEvidence:specialFood.exec(name)?.[0]};
 const olderIn=include.flatMap(([cat,re])=>{const m=re.exec(phrase);return m?[{cat,evidence:m[0]}]:[];});
 const olderOut=exclude.flatMap(([cat,re])=>{const m=re.exec(name);return m?[{cat,evidence:m[0]}]:[];});
 const positives=[...v3Match(v3Positive,phrase),...olderIn];
 const negatives=[...v3Match(v3Negative,name),...olderOut];
 const posCats=[...new Set(positives.map(x=>x.cat))];
 const negCats=[...new Set(negatives.map(x=>x.cat))];
 // Strong category-specific negative words take precedence over weak grocery tokens,
 // but ambiguous conflicts require review. Never auto-exclude with contradictory evidence.
 if(posCats.length&&negCats.length) return {status:'REVIEW',category:'CONFLICT',reason:'BOTH_IN_SCOPE_AND_OUT_OF_SCOPE_SIGNALS',matchedRule:`${posCats.join('+')} vs ${negCats.join('+')}`,matchEvidence:[...positives,...negatives].map(x=>`${x.cat}:${x.evidence}`).join(' | ')};
 if(negCats.length) return {status:'OUT_OF_SCOPE',category:negCats[0],reason:'EXPLICIT_NON_GROCERY_PRODUCT',matchedRule:negCats.join('+'),matchEvidence:negatives.map(x=>`${x.cat}:${x.evidence}`).join(' | ')};
 if(posCats.length) return {status:'IN_SCOPE',category:posCats[0],reason:'POSITIVE_CATEGORY_SIGNAL',matchedRule:posCats.join('+'),matchEvidence:positives.map(x=>`${x.cat}:${x.evidence}`).join(' | ')};
 return {status:'REVIEW',category:'UNKNOWN',reason:'NO_CONFIDENT_CATEGORY_SIGNAL',matchedRule:'',matchEvidence:''};
};


function parseCsv(input) {
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){const ch=input[i];if(quoted){if(ch==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else{if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=ch;}}
 if(cell||row.length){row.push(cell);rows.push(row)}
 const headers=rows.shift()??[];return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}
if(process.argv[2]==='--audit-csv'){
 const sources=process.argv.slice(3);
 if(!sources.length)throw new Error('Pass one or more source CSV paths');
 const input=sources.flatMap(p=>parseCsv(readFileSync(p,'utf8')));
 const rows=input.map(r=>({...r,oldStatus:r.status,...classify(r)}));
 const counts=rows.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{});
 const transitions=rows.reduce((a,r)=>(a[`${r.oldStatus}->${r.status}`]=(a[`${r.oldStatus}->${r.status}`]??0)+1,a),{});
 const output=resolve('scope-audit-v4-csv');mkdirSync(output,{recursive:true});
 const hdr=['retailer','itemId','name','brand','description','oldStatus','status','category','reason','matchedRule','matchEvidence'];
 writeFileSync(join(output,'classifications.csv'),[hdr,...rows.map(r=>hdr.map(h=>r[h]??''))].map(row=>row.map(csv).join(',')).join('\n')+'\n');
 console.log(JSON.stringify({records:rows.length,counts,transitions,output},null,2));process.exit(0);
}

const recordHeaders = ['retailer','postalCode','flyerId','itemId','name','brand','description','status','category','reason','matchedRule','matchEvidence'];
const records = [recordHeaders];
const summary = {capture:root,generatedAt:new Date().toISOString(),policy:'Groceries + household + personal care + baby + pet + pharmacy/OTC; exclude explicit general merchandise; uncertain items REVIEW',counts:{},byRetailer:{},byCategory:{},warnings:[],missingQueryFiles:[],missingDetailFiles:[],duplicateContextRows:0};
const observed = new Set();
const itemClassifications = new Map();
const samples = {IN_SCOPE:[],OUT_OF_SCOPE:[],REVIEW:[]};
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
      const row = [retailer,postalCode,flyerId,itemId,norm(record.name),norm(record.brand),norm(record.description),result.status,result.category,result.reason,result.matchedRule,result.matchEvidence??''];
      records.push(row);
      summary.counts[result.status]=(summary.counts[result.status]??0)+1;
      const byRetailer=summary.byRetailer[retailer]??={total:0,IN_SCOPE:0,OUT_OF_SCOPE:0,REVIEW:0};
      byRetailer.total++;byRetailer[result.status]++;summary.byRetailer[retailer]=byRetailer;
      summary.byCategory[result.category]=(summary.byCategory[result.category]??0)+1;
      if (samples[result.status].length<100) samples[result.status].push(row);
      const uniqueId=`${retailer}::${itemId}`;
      const prior=itemClassifications.get(uniqueId);
      if (!prior) itemClassifications.set(uniqueId,{...result,retailer,itemId,name:record.name});
      else if(prior.status!==result.status || prior.category!==result.category) prior.contextDisagreement=true;
    }
  }
}
summary.uniqueRetailerItems=itemClassifications.size;
summary.uniqueStatusCounts={};
for(const value of itemClassifications.values())summary.uniqueStatusCounts[value.status]=(summary.uniqueStatusCounts[value.status]??0)+1;
summary.contextObservations=records.length-1;
summary.classificationDisagreements=[...itemClassifications.values()].filter(x=>x.contextDisagreement).length;
if (summary.missingQueryFiles.length) summary.warnings.push('Missing query files prevent a complete coverage count.');
if (summary.missingDetailFiles.length) summary.warnings.push('Some details absent; classification based on partial records.');
if (!summary.contextObservations) summary.warnings.push('No item observations found; check archive layout.');
writeCsv('all-classifications.csv',records);
for(const status of Object.keys(samples)) writeCsv(`${status.toLowerCase()}-examples.csv`,[recordHeaders,...samples[status]]);
writeCsv('retailer-summary.csv', [['retailer','total','IN_SCOPE','OUT_OF_SCOPE','REVIEW','excludedPct'],...Object.entries(summary.byRetailer).map(([name,v])=>[name,v.total,v.IN_SCOPE,v.OUT_OF_SCOPE,v.REVIEW,+(100*v.OUT_OF_SCOPE/v.total).toFixed(2)])]);
writeFileSync(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({output:out,observations:summary.contextObservations,uniqueRetailerItems:summary.uniqueRetailerItems,counts:summary.counts,uniqueStatusCounts:summary.uniqueStatusCounts,byRetailer:summary.byRetailer,warnings:summary.warnings},null,2));

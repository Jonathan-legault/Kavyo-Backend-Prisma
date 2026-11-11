/** Pure classification extracted from scripts/audit-flipp-scope-v4.mjs.
 * Keep audit script and this module's rules synchronized until a shared module
 * becomes the single source of truth. No I/O and no database writes.
 */
export type ScopeStatus = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'REVIEW';
export interface ScopeInput { name?: string | null; description?: string | null; brand?: string | null; }
export interface ScopeResult { status: ScopeStatus; category: string; reason: string; matchedRule: string; matchEvidence: string; }
const norm = (value: unknown): string => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();

// Scope policy: shopping basket = groceries, household essentials, personal care, pet supplies,
// pharmacy/OTC/first aid, vitamins, baby products. This is classification, NOT clinical guidance.
// Named rules use boundaries and avoid broad words like 'cat', 'apple', 'tablet', or 'oil'.
const include: Array<[string, RegExp]> = [
 ['PET', /\b(?:dog food|cat food|pet food|pet treats?|dog treats?|cat treats?|pet litter|cat litter|dog litter|pet shampoo|pet bowls?|pet toys?|dog toys?|cat toys?|dog beds?|cat beds?|pet supplies|puppy food|kitten food|bird seed|fish food|aquarium food|litter box|pet pads?|dog leash|dog collar|dog harness|pet carrier)\b/i],
 ['PHARMACY', /\b(?:pain relie(?:f|ver)|acetaminophen|ibuprofen|naproxen|aspirin|antacid|cold & flu|cough syrup|cough drops|allergy relief|antihistamine|nasal spray|saline spray|first aid|bandages?|adhesive bandages?|gauze|wound care|antiseptic|hydrogen peroxide|rubbing alcohol|thermometer|vitamins?|supplements?|probiotics?|omega[- ]?3|melatonin|medicated cream|heating pad|pregnancy tests?|contact lens solution|eye drops|ear drops|nicotine patches?|sunscreen|sunblock|spf\s*\d+|condoms?)\b/i],
 ['BABY', /\b(?:baby formula|infant formula|baby food|baby wipes?|diapers?|nappies|training pants|baby shampoo|baby lotion|baby powder|baby wash|baby cereal|baby snacks?|pacifiers?|baby bottles?|baby care|night pants|pull[- ]?ups)\b/i],
 ['PERSONAL_CARE', /\b(?:shampoo|conditioner|body wash|bar soap|hand soap|toothpaste|toothbrush|dental floss|mouthwash|deodorant|antiperspirant|razor blades?|shaving cream|skin care|moisturiz(?:er|ing)|face wash|facial cleanser|menstrual|tampons?|sanitary pads?|incontinence|bladder control|absorbent underwear|discreet underwear|hair dye|hair colour|makeup|mascara|lip balm|lipstick|face cream|cotton swabs?|cotton balls?|bath tissue|toilet paper|facial tissues?)\b/i],
 ['HOUSEHOLD', /\b(?:laundry detergent|laundry pods?|fabric softener|dish soap|dishwasher detergent|dishwasher tabs?|dishwashing liquid|cleaning wipes?|disinfectant|all[- ]purpose cleaner|surface cleaner|window cleaner|bleach|garbage bags?|trash bags?|paper towels?|aluminum foil|aluminium foil|plastic wrap|cling wrap|parchment paper|food storage bags?|sandwich bags?|freezer bags?|food containers?|cleaning supplies|sponges?|scrub pads?|air freshener)\b/i],
 ['GROCERY', /\b(?:milk|cheese|yog(?:urt|hourt)|butter|cream cheese|ice cream|eggs?|bread|bagels?|tortillas?|cereal|oatmeal|rice|pasta|noodles?|flour|sugar|salt|pepper|spices?|seasoning|olive oil|canola oil|vegetable oil|vinegar|sauce|ketchup|mustard|mayonnaise|jam|jelly|peanut butter|almond butter|honey|cookies?|crackers?|chips|popcorn|chocolate|candy|candies|snacks?|granola|nuts?|almonds?|peanuts?|cashews?|soup|broth|stock|beans?|lentils?|tomatoes?|potatoes?|onions?|carrots?|lettuce|salad|spinach|broccoli|cauliflower|apples?|bananas?|oranges?|berries|grapes?|avocado|chicken|beef|pork|turkey|bacon|sausages?|fish|salmon|shrimp|seafood|steak|ground beef|hamburger|pizza|frozen meals?|entrées?|entrees?|frozen vegetables?|juice|coffee|tea|water|sparkling beverages?|soft drinks?|soda|cola|energy drinks?|sports drinks?|pickles?|olives?|canned|preserves?|deli|meat|produce|bakery|dessert|cake|muffins?|buns?|rolls?|fruit|vegetables?|beverages?|food|chili|tuna|salmon|flavoured? water|seltzer)\b/i]
];
// Strongly contextual exclusions only. Avoid 'plate', 'bowl', 'battery', 'cream', 'oil', 'tablet', 'cat'.
const exclude: Array<[string, RegExp]> = [
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
const v3Positive: Array<[string, RegExp]> = [
 ['BABY', /\b(?:huggies|pampers|baby wipes|infant wipes|parents?['’]? choice wipes|baby shampoo|baby lotion|baby wash|baby diapers|diaper cream|diaper rash|infant cereal)\b/i],
 ['PERSONAL_CARE', /\b(?:poise pads?|depend underwear|depend briefs?|adult diapers?|incontinence pads?|feminine pads?|haircare|hair care|hair styling|styling products?|body lotion|hand lotion|body cream|face serum|body scrub|bath salts|dental rinse|toilet tissues?|facial wipes?|cleansing wipes?|cotton rounds|soap bars?|shower gel)\b/i],
 ['PHARMACY', /\b(?:sinus rinse|sinus relief|nasal rinse|neilmed|webber naturals|multivitamins?|pain relief|electrolyte packets?|first[- ]aid kits?|vitamin [a-z0-9]+|cough (?:medicine|syrup|drops)|allergy (?:tablets|medicine|relief))\b/i],
 ['HOUSEHOLD', /\b(?:multi[- ]purpose cleaners?|toilet bowl cleaners?|shower foam|lysol|scrubbing bubbles|clorox|tide (?:pods|detergent)|febreze|fabric refresher|dishwashing pods?|dish detergent|laundry products?|cleaning products?|disinfecting wipes?|garbage bags?|compost bags?|ziploc|bounty paper towels?|scotties tissues?|reynolds wrap|glad (?:bags|wrap)|storage bags?|dish sponges?)\b/i],
 ['PET', /\b(?:dog (?:biscuits|chews|treats|food|toys)|cat (?:treats|food|litter|toys)|pet (?:treats|food|accessories|care|toys)|purina|pedigree (?:dog|food)|whiskas|temptations cat|greenies (?:dog|cat))\b/i],
 ['GROCERY', /\b(?:sourdough|raspberries|blackberries|okra|hummus|non[- ]dairy creamer|non[- ]alcoholic (?:beer|wine)|potato (?:fries|wedges)|hash\s?browns?|paratha|naan|toblerone|chipits|kisses|cupcakes?|chocolates?|biscuits?|mozza|pesto|frozen ramen|protein bars?|squares|cheddar|creamer|frozen (?:fries|food|dinners?|entrees?|meals?)|sliced (?:ham|turkey|cheese)|yogurt drinks?|fruit cups?|granola bars?|craft beer|sweet peppers?|cucumbers?|zucchini|mushrooms?|celery|mangoes?|pineapple|coconut milk|nut butter|pita|croissants?|donuts?|doughnuts?|pastries|pudding|chips|crackers|nutella|kinder bueno|rees[e]?['’]?s|hershey['’]?s|cavendish (?:fries|premium)|mccain (?:fries|hashbrowns)|schneiders (?:breakfast|sandwiches)|christie (?:premium|ritz))\b/i],
];
const v3Negative: Array<[string, RegExp]> = [
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
const v3Match = (rules: Array<[string, RegExp]>,text: string) => rules.flatMap(([cat,re])=>{const m=re.exec(text);return m?[{cat,evidence:m[0]}]:[];});

export function classifyGroceryScope(record: ScopeInput): ScopeResult {
 const name=norm(record.name), desc=norm(record.description);
 if(!name) return {status:'REVIEW',category:'UNKNOWN',reason:'MISSING_NAME',matchedRule:'',matchEvidence:''};
 if(promotions.test(name)||v3Heading.test(name)) return {status:'REVIEW',category:'NON_PRODUCT_OR_PROMO',reason:'GENERIC_PROMOTIONAL_HEADING',matchedRule:'',matchEvidence:name};
 const phrase=[name,desc].filter(Boolean).join(' | ');
 // v4: explicit product identity takes precedence over misleading category words.
 // Examples are taken from the November 11 transition audit.
 const decisive: Array<[string, RegExp, ScopeStatus, string]> = [
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
 if(careUnderwear.test(name)) return {status:'IN_SCOPE',category:'PERSONAL_CARE',reason:'EXPLICIT_INCONTINENCE_CARE',matchedRule:'CARE_EXCEPTION',matchEvidence:careUnderwear.exec(name)?.[0] ?? ''};
 if(petApparel.test(name)) return {status:'IN_SCOPE',category:'PET',reason:'PET_APPAREL_ACCESSORY',matchedRule:'PET_EXCEPTION',matchEvidence:petApparel.exec(name)?.[0] ?? ''};
 if(coffeeMaker.test(name)) return {status:'OUT_OF_SCOPE',category:'LARGE_APPLIANCES',reason:'EXPLICIT_COFFEE_APPLIANCE',matchedRule:'APPLIANCE_EXCEPTION',matchEvidence:coffeeMaker.exec(name)?.[0] ?? ''};
 if(kitchenStorage.test(name)) return {status:'REVIEW',category:'UNKNOWN',reason:'AMBIGUOUS_KITCHEN_STORAGE_SCOPE',matchedRule:'STORAGE_REVIEW',matchEvidence:kitchenStorage.exec(name)?.[0] ?? ''};
 // 'Microwave popcorn' is a food, not a microwave oven.
 if(specialFood.test(name)) return {status:'IN_SCOPE',category:'GROCERY',reason:'EXPLICIT_FOOD_EXCEPTION',matchedRule:'FOOD_EXCEPTION',matchEvidence:specialFood.exec(name)?.[0] ?? ''};
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

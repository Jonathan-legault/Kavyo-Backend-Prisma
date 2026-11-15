/** Apply B.5.1 audited category corrections to the existing A.1 scope classifier.
 * Idempotent. Does not touch the database or overwrite other local scope rules.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'src/ingestion/scope/grocery-scope.ts';
const source = readFileSync(file, 'utf8');
const start = 'export function classifyGroceryScope(record: ScopeInput): ScopeResult {';
const needle = ' const phrase=[name,desc].filter(Boolean).join(\' | \');';
if (source.includes('B5_1_PRODUCT_RULES')) {
  console.log('B.5.1 scope patch already installed; nothing changed.');
  process.exit(0);
}
if (!source.includes(start) || !source.includes(needle)) {
  throw Error('Existing grocery-scope.ts differs from expected A.1 version. No changes made.');
}
const insert = `
 // B5_1_PRODUCT_RULES: audited product-name classification, not retailer/brand classification.
 // Prioritize identified product types; avoid broad words like \"monitor\", \"kit\" and \"calendar\".
 const b5NameRules: Array<[string, RegExp, ScopeStatus, string]> = [
  ['HOME_DECOR', /\\b(?:mattresses?|bed frames?)\\b/i, 'OUT_OF_SCOPE', 'DURABLE_BEDDING_FURNITURE'],
  ['KITCHENWARE', /\\b(?:multi[- ]?pans?|grill pans?|frying pans?|skillets?)\\b/i, 'OUT_OF_SCOPE', 'DURABLE_COOKWARE'],
  ['ELECTRONICS', /^(?:(?:\\d{1,2}(?:[\\\"″]|\\s*(?:inches|inch|in))\\s*)|(?:computer|gaming|lcd|led)\\s+)?monitors?$/i, 'OUT_OF_SCOPE', 'COMPUTER_MONITOR'],
  ['PERSONAL_CARE', /\\b(?:pads?\\s+or\\s+liners?|menstrual\\s+pads?|panty\\s+liners?)\\b/i, 'IN_SCOPE', 'FEMININE_HYGIENE'],
  ['HOUSEHOLD', /\\b(?:scented oil kit|oil warmer(?:s)?\\s+(?:kit|refills?)|air freshener starter kit)\\b/i, 'IN_SCOPE', 'AIR_FRESHENER_KIT'],
  ['GROCERY', /\\b(?:avocados?|anjou pears?|pears?)\\b/i, 'IN_SCOPE', 'FRESH_PRODUCE'],
  ['GROCERY', /\\b(?:protein drinks?|protein shakes?|nutritional drinks?|meal replacement drinks?)\\b/i, 'IN_SCOPE', 'NUTRITIONAL_BEVERAGE'],
  ['GROCERY', /\\b(?:baking mixes?|cake mixes?|brownie mixes?|muffin mixes?|pancake mixes?)\\b/i, 'IN_SCOPE', 'BAKING_MIX'],
  ['GROCERY', /\\b(?:charcuterie|prosciutto|soppressata|salami|deli meats?)\\b/i, 'IN_SCOPE', 'PREPACKAGED_DELI_MEAT'],
  ['GROCERY', /\\bperra\\b/i, 'IN_SCOPE', 'FROZEN_DESSERT'],
 ];
 for (const [category, rule, status, reason] of b5NameRules) {
   const m = rule.exec(name);
   if (m) return {status, category, reason, matchedRule:'B5_PRODUCT_NAME',matchEvidence:m[0]};
 }
 // A holiday food with an identified confectionery brand is groceries, unlike a toy advent calendar.
 if (/\\badvent calendars?\\b/i.test(name) && /\\b(?:reese['’]?s?|hershey['’]?s?|chocolate|candy|sweets?)\\b/i.test([name,desc,record.brand??''].join(' '))) {
   return {status:'IN_SCOPE',category:'GROCERY',reason:'EDIBLE_SEASONAL_CONFECTIONERY',matchedRule:'B5_EDIBLE_CALENDAR',matchEvidence:name};
 }
`;
const next=source.replace(needle,insert+needle);
writeFileSync(file,next,'utf8');
console.log('Applied B.5.1 product-name scope corrections to',file);

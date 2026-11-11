/** Read-only analysis of Kavyo Flipp raw capture. Node 22; no dependencies. */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(join(root, 'report.json'))) { console.error('Usage: node scripts/analyze-flipp-archive.mjs data/research/flipp/<capture-folder>'); process.exit(1) }
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const report = read(join(root, 'report.json'));
const out = join(root, 'analysis'); mkdirSync(out, { recursive: true });
const empty = () => ({ items: 0, details: 0, fields: {}, conditions: {}, examples: [], missingDetail: 0, merchants: new Set(), flyers: new Set(), postalCodes: new Set() });
const byRetailer = new Map(); const all = empty(); const seenRetailerItem = new Set(); const seenAllItem = new Set();
const patterns = {
  multibuy: /\b(?:\d+\s+for\s+\$?\d+(?:\.\d+)?|\d+\s*\/\s*\$\s*\d+(?:\.\d+)?|mix\s*(?:and|&)\s*match|buy\s+\d+\s+get\s+\d+)\b/i,

  membership: /\b(?:non[-\s]?members?|members?|membership|loyalty|rewards?\s*(?:card|price)|scene\+?|more\s*rewards?|pc\s*optimum|club\s*price|with\s*(?:your\s*)?card)\b/i,

  minimum: /\b(?:minimum\s+(?:purchase|quantity|qty)|min\.?\s*(?:purchase|qty|quantity)|when\s+you\s+buy\s+\d+|buy\s+at\s+least\s+\d+|must\s+buy\s+\d+)\b/i,

  maximum: /\b(?:limit\s+\d+|maximum\s+(?:of\s+)?\d+|max\.?\s*\d+)\b/i,

  overLimit: /\b(?:over\s+limit\s+pay|over\s+(?:the\s+)?limit)\b/i,

  range: /(?:\$\s*\d+(?:\.\d{1,2})?\s*(?:-|â€“|to)\s*\$?\s*\d+(?:\.\d{1,2})?|\b(?:starting\s+at|from)\s+\$\s*\d)/i,

  variants: /\b(?:assorted|selected|variet(?:y|ies)|mix\s*(?:and|&)\s*match|your\s*choice|or\s*more)\b/i,

  weight: /\b(?:per\s*(?:kg|lb|100\s*g|100\s*ml)|\/\s*(?:kg|lb|100\s*g|100\s*ml)|each\s*\d+\s*(?:g|kg|ml|l))\b/i,

  online: /\b(?:online\s*only|in.store\s*only|pickup\s*only|delivery\s*only)\b/i
};
const squish = x => String(x ?? '').replace(/\s+/g, ' ').trim();
const csv = x => '"' + String(x ?? '').replace(/"/g, '""') + '"';
const addFields = (bucket, obj, prefix) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return; for (const [k, v] of Object.entries(obj)) { const key = prefix + '.' + k; const row = bucket.fields[key] ??= { present: 0, nonempty: 0, types: {}, samples: [] }; row.present++; const type = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; row.types[type] = (row.types[type] ?? 0) + 1; if (v !== null && v !== '' && (!Array.isArray(v) || v.length)) { row.nonempty++; if (row.samples.length < 3) { const sample = JSON.stringify(v); if (!row.samples.includes(sample)) row.samples.push(sample?.slice(0, 160)) } } } };
const add = (bucket, item, detail, ctx) => {
  bucket.items++; if (detail) bucket.details++; else bucket.missingDetail++;
  addFields(bucket, item, 'flyerItem'); addFields(bucket, detail, 'itemDetail');
  const fields = [
    item?.name,
    item?.pre_price_text,
    item?.post_price_text,
    item?.sale_story,
    detail?.description,
    detail?.price_text,
    detail?.sale_story,
    detail?.disclaimer_text
  ].filter(v => typeof v === 'string' && v.trim());
  const text = fields.map(squish).join(' | ');
  const matches = Object.entries(patterns).filter(([, re]) => re.test(text)).map(([k]) => k);

  for (const m of matches) bucket.conditions[m] = (bucket.conditions[m] ?? 0) + 1;
  if (matches.length) bucket.examples.push({ ...ctx, name: item?.name ?? '', price: item?.price ?? null, price_text: detail?.price_text ?? null, sale_story: detail?.sale_story ?? item?.sale_story ?? null, disclaimer_text: detail?.disclaimer_text ?? null, description: detail?.description ?? null, pre_price_text: item?.pre_price_text ?? null, post_price_text: item?.post_price_text ?? null, matchingSignals: matches, searchableText: text });
};
const combos = report.combos ?? [];
for (const combo of combos) {
  const retailer = combo.retailer; const postal = combo.postalCode;
  const bucket = byRetailer.get(retailer) ?? empty(); byRetailer.set(retailer, bucket); bucket.postalCodes.add(postal);
  for (const flyerId of combo.flyerIds ?? []) {
    const file = join(root, 'queries', postal, 'flyers', flyerId + '.json'); if (!existsSync(file)) continue;
    bucket.flyers.add(flyerId); all.flyers.add(flyerId);
    const doc = read(file);
    for (const item of doc.items ?? []) {
      if (!item?.id) continue;
      const key = retailer + ':' + item.id;
      if (seenRetailerItem.has(key)) continue;
      seenRetailerItem.add(key);
      const detailPath = join(root, 'items', item.id + '.json');
      const docDetail = existsSync(detailPath) ? read(detailPath) : null;
      const detail = docDetail?.item ?? docDetail;
      const context = { retailer, postalCode: postal, flyerId, itemId: item.id };
      add(bucket, item, detail, context);
      if (!seenAllItem.has(item.id)) { seenAllItem.add(item.id); add(all, item, detail, context) }
    }
  }
}
const simplify = b => ({ distinctItems: b.items, detailsAvailable: b.details, missingDetails: b.missingDetail, distinctFlyers: b.flyers.size, postalCodes: [...b.postalCodes], conditionSignals: b.conditions });
const result = { capture: root, finished: report.finished, generatedAt: new Date().toISOString(), total: simplify(all), retailers: Object.fromEntries([...byRetailer].map(([k, v]) => [k, simplify(v)])) };
writeFileSync(join(out, 'summary.json'), JSON.stringify(result, null, 2) + '\n');
const lines = [['retailer', 'items', 'details', 'missing', 'flyers', ...Object.keys(patterns)]];
for (const [retailer, b] of byRetailer) lines.push([retailer, b.items, b.details, b.missingDetail, b.flyers.size, ...Object.keys(patterns).map(k => b.conditions[k] ?? 0)]);
writeFileSync(join(out, 'condition-counts.csv'), lines.map(r => r.map(csv).join(',')).join('\n') + '\n');
const fields = [['retailer', 'field', 'present', 'nonempty', 'types', 'samples']];
for (const [retailer, b] of byRetailer) for (const [key, v] of Object.entries(b.fields)) fields.push([retailer, key, v.present, v.nonempty, JSON.stringify(v.types), v.samples.join(' | ')]);
writeFileSync(join(out, 'field-coverage.csv'), fields.map(r => r.map(csv).join(',')).join('\n') + '\n');
const examples = [['retailer', 'postalCode', 'flyerId', 'itemId', 'name', 'price', 'price_text', 'sale_story', 'disclaimer_text', 'pre_price_text', 'post_price_text', 'description', 'matchingSignals', 'searchableText']];
for (const b of byRetailer.values()) for (const x of b.examples) examples.push(Object.keys(x).length ? ['retailer', 'postalCode', 'flyerId', 'itemId', 'name', 'price', 'price_text', 'sale_story', 'disclaimer_text', 'pre_price_text', 'post_price_text', 'description', 'matchingSignals'].map(k => Array.isArray(x[k]) ? x[k].join('|') : x[k]) : []);
writeFileSync(join(out, 'condition-examples.csv'), examples.map(r => r.map(csv).join(',')).join('\n') + '\n');
console.log('Analyzed', all.items, 'distinct item references across', all.flyers.size, 'unique flyers');
for (const [ret, b] of byRetailer) console.log(ret + ': ' + b.items + ' items, ' + b.missingDetail + ' missing details; signals:', JSON.stringify(b.conditions));
console.log('Reports:', out);
console.log('Note: regex matches are candidates, not validated conditional prices.');

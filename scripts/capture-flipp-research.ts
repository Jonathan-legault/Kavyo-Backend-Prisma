/**
 * Kavyo research capture: four Calgary quadrants x seven grocery retailers.
 * Node 22 + tsx. Run from the backend repository root.
 *
 * Does not connect to PostgreSQL, parse prices, or normalize records.
 * Saves full unmodified JSON response bodies alongside request metadata.
 * Uses only the public endpoints already used by Kavyo's FlippClient.
 * Respect provider terms, rights and rate limits; stop if access is denied.
 *
 * Usage:
 *   npx tsx scripts/capture-flipp-research.ts --max-items 10
 *   npx tsx scripts/capture-flipp-research.ts
 *   npx tsx scripts/capture-flipp-research.ts --output data/research/flipp/my-capture
 *   npx tsx scripts/capture-flipp-research.ts --postal-codes T3M1T4,T3K0Y5,T3H0N6,T2A4T8
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const BASE = 'https://backflipp.wishabi.com/flipp';
const LOCALE = 'en-ca';
const DEFAULT_POSTAL_CODES = [
  { quadrant: 'SE', postalCode: 'T3M1T4', referenceStore: 'Save-On-Foods Seton' },
  { quadrant: 'NW', postalCode: 'T3K0Y5', referenceStore: 'Save-On-Foods Panorama' },
  { quadrant: 'SW', postalCode: 'T3H0N6', referenceStore: 'Safeway Aspen' },
  { quadrant: 'NE', postalCode: 'T2A4T8', referenceStore: 'Save-On-Foods Trans Canada' },
];
const RETAILERS = [
  { name: 'Safeway', slug: 'safeway', ids: [2126], names: [/^safeway$/i] },
  { name: 'Walmart', slug: 'walmart', ids: [234], names: [/^walmart(?:\s+canada)?$/i] },
  { name: 'Calgary Co-op', slug: 'calgary-coop', ids: [2051], names: [/^(?:calgary\s+)?co[ -]?op(?:\s+food)?$/i] },
  { name: 'Save-On-Foods', slug: 'save-on-foods', ids: [], names: [/^save[ -]?on[ -]?foods?$/i] },
  { name: 'Sobeys', slug: 'sobeys', ids: [], names: [/^sobeys(?:\s+inc\.?)?$/i] },
  { name: 'Real Canadian Superstore', slug: 'superstore', ids: [], names: [/^(?:real canadian superstore|superstore)$/i] },
  { name: 'No Frills', slug: 'no-frills', ids: [], names: [/^(?:no[ -]?frills|[\w' -]+no[ -]?frills)$/i] },
] as const;

type JSONObject = Record<string, unknown>;
type Flyer = JSONObject & { id?: number; merchant?: string; merchant_id?: number; valid_from?: string; valid_to?: string };
type CaptureMetadata = {
  url: string; requestedAt: string; status: number; sha256: string; bytes: number; file: string;
};
type CaptureSummary = {
  postalCode: string; quadrant: string; retailer: string; merchantIds: number[];
  flyerIds: number[]; flyerCount: number; totalItemReferences: number;
  uniqueItemIds: number; downloadedItemDetails: number; failures: number;
};

function option(name: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i=0;i<args.length;i++) {
    if (args[i] === `--${name}`) return args[i+1];
    if (args[i].startsWith(`--${name}=`)) return args[i].split('=').slice(1).join('=');
  }
  return undefined;
}
function positiveInt(name: string, fallback: number): number {
  const raw = option(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`--${name} must be a nonnegative integer`);
  return n;
}
function saveJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function hash(data: string) { return createHash('sha256').update(data).digest('hex'); }
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
function asObject(input: unknown): JSONObject { return input && typeof input === 'object' && !Array.isArray(input) ? input as JSONObject : {}; }
function numberId(input: unknown): number | null {
  const n = Number(input);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
const minDelay = positiveInt('delay-ms', 750);
const maxItems = positiveInt('max-items', 0); // zero = no cap
const maxFlyers = positiveInt('max-flyers-per-retailer', 0); // zero = no cap
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const root = resolve(option('output') || `data/research/flipp/${stamp}`);
const pcs = option('postal-codes')?.split(',').map(s=>s.replace(/\s/g,'').toUpperCase()) || DEFAULT_POSTAL_CODES.map(s=>s.postalCode);
if (!pcs.length || pcs.some(p=> !/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(p))) throw new Error('Invalid postal code list');
const places = pcs.map((postalCode, i) => ({postalCode, quadrant: DEFAULT_POSTAL_CODES.find(x=>x.postalCode===postalCode)?.quadrant || `CUSTOM${i+1}`}));
let lastStart = 0;
async function rateLimit() {
  // Single sequential request queue enforces global spacing across all endpoints.
  const wait = Math.max(0, minDelay - (Date.now() - lastStart));
  if (wait) await sleep(wait);
  lastStart = Date.now();
}
class SourceError extends Error {
  constructor(message: string, readonly status: number, readonly url: string) {super(message);}
}
async function fetchJSON(url: URL, out: string): Promise<{ data: unknown; meta: CaptureMetadata; fromCache: boolean }> {
  const metaPath = `${out}.meta.json`;
  if (existsSync(out) && existsSync(metaPath)) {
    try { return {data: JSON.parse(readFileSync(out, 'utf8')) as unknown,
      meta: JSON.parse(readFileSync(metaPath, 'utf8')) as CaptureMetadata, fromCache: true}; }
    catch { /* recapture incomplete cache */ }
  }
  for (let attempt=1;attempt<=4;attempt++) {
    await rateLimit();
    const requestedAt = new Date().toISOString();
    try {
      const response = await fetch(url, {headers:{Accept:'application/json', 'User-Agent':'KavyoEducationalResearch/1.0'}, signal:AbortSignal.timeout(25000)});
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new SourceError('Access denied; aborting capture', response.status, url.toString());
        if (response.status !== 429 && response.status < 500) throw new SourceError(`HTTP ${response.status}`, response.status, url.toString());
        if (attempt === 4) throw new SourceError(`HTTP ${response.status}`,response.status,url.toString());
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(Math.max(1000*2**attempt, Number.isFinite(retryAfter) ? retryAfter*1000 : 0));
        continue;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) throw new Error(`Unexpected content type ${contentType}`);
      const body = await response.text();
      const data:unknown = JSON.parse(body);
      mkdirSync(dirname(out),{recursive:true});
      writeFileSync(out, body, 'utf8'); // actual JSON body, not selected fields
      const meta: CaptureMetadata = {url:url.toString(),requestedAt,status:response.status,sha256:hash(body),bytes:Buffer.byteLength(body),file:out.replace(root+'/', '')};
      saveJson(metaPath, meta);
      return {data,meta,fromCache:false};
    } catch(e) {
      if (e instanceof SourceError && (e.status===401 || e.status===403 || (e.status!==429 && e.status<500))) throw e;
      if (attempt===4) throw e;
      await sleep(1000*2**attempt);
    }
  }
  throw new Error('Unexpected retry exit');
}
function url(path:string, postalCode?:string) {
  const u = new URL(`${BASE}${path}`);
  u.searchParams.set('locale',LOCALE);
  if (postalCode) u.searchParams.set('postal_code',postalCode);
  return u;
}
function identify(f: Flyer) {
  const merchantName = String(f.merchant || '').trim();
  const id = numberId(f.merchant_id);
  return RETAILERS.find(r => r.ids.some(x=>x===id) || r.names.some(re=>re.test(merchantName)));
}
async function main() {
  mkdirSync(root,{recursive:true});
  const summaries:CaptureSummary[]=[];
  const failures: Array<{postalCode:string;retailer?:string;flyerId?:number;itemId?:number;message:string}>=[];
  const capturedItems = new Set<number>();
  const seenFlyerIds = new Set<number>();
  const fullList: Array<{postalCode:string;flyers:number;merchantCounts:Record<string,number>}>=[];
  const start = new Date().toISOString();
  console.log(`Research only. Output: ${root}`);
  console.log(`Postal codes: ${places.map(x=>`${x.quadrant}:${x.postalCode}`).join(', ')}`);
  for (const place of places) {
    console.log(`\n[${place.quadrant}] Requesting flyer list for ${place.postalCode}`);
    const list = await fetchJSON(url('/flyers',place.postalCode),join(root,'queries',place.postalCode,'flyer-list.json'));
    const rawFlyers = asObject(list.data).flyers;
    if (!Array.isArray(rawFlyers)) throw new Error(`Unexpected /flyers response for ${place.postalCode}; examine saved file`);
    const flyers = rawFlyers.map(asObject) as Flyer[];
    const merchantCounts:Record<string,number>={};
    for (const f of flyers) {
      const key = `${String(f.merchant || 'UNKNOWN')} [${String(f.merchant_id ?? 'none')}]`;
      merchantCounts[key]=(merchantCounts[key]||0)+1;
    }
    fullList.push({postalCode:place.postalCode,flyers:flyers.length,merchantCounts});
    console.log(`  List contains ${flyers.length} flyers from all merchants; archived unfiltered.`);
    for (const retailer of RETAILERS) {
      const matching = flyers.filter(f=>identify(f)?.slug===retailer.slug);
      const chosen = maxFlyers ? matching.slice(0,maxFlyers) : matching;
      const summary: CaptureSummary = {postalCode:place.postalCode,quadrant:place.quadrant,retailer:retailer.name,
        merchantIds:[...new Set(matching.map(f=>numberId(f.merchant_id)).filter((n):n is number=>n!==null))],
        flyerIds:[],flyerCount:chosen.length,totalItemReferences:0,uniqueItemIds:0,downloadedItemDetails:0,failures:0};
      const currentItemIds=new Set<number>();
      for (const f of chosen) {
        const id=numberId(f.id); if (!id) continue;
        summary.flyerIds.push(id);
        try {
          // Full flyer response captured once per postal code because content can vary by location.
          const result=await fetchJSON(url(`/flyers/${id}`,place.postalCode),join(root,'queries',place.postalCode,'flyers',`${id}.json`));
          seenFlyerIds.add(id);
          const details = asObject(result.data);
          const items = Array.isArray(details.items) ? details.items : [];
          summary.totalItemReferences+=items.length;
          for (const rawItem of items) {
            const itemId=numberId(asObject(rawItem).id);
            if (itemId) currentItemIds.add(itemId); // DO NOT filter by price
          }
        } catch(e) {
          const message=String(e); failures.push({postalCode:place.postalCode,retailer:retailer.name,flyerId:id,message}); summary.failures++;
          if(e instanceof SourceError && [401,403].includes(e.status)) throw e;
        }
      }
      summary.uniqueItemIds=currentItemIds.size;
      let downloaded=0;
      for (const itemId of currentItemIds) {
        if (maxItems && downloaded>=maxItems) break;
        try {
          const result=await fetchJSON(url(`/items/${itemId}`),join(root,'items',`${itemId}.json`));
          capturedItems.add(itemId);
          if(!result.fromCache) summary.downloadedItemDetails++;
          downloaded++;
        } catch(e) {
          const message=String(e); failures.push({postalCode:place.postalCode,retailer:retailer.name,itemId,message}); summary.failures++;
          if(e instanceof SourceError && [401,403].includes(e.status)) throw e;
        }
      }
      summaries.push(summary);
      console.log(`  ${retailer.name}: ${chosen.length} flyers, ${summary.uniqueItemIds} unique item refs, ${summary.failures} errors`);
      // Checkpoint so partial runs retain readable progress.
      saveJson(join(root,'report.json'),{startedAt:start,updatedAt:new Date().toISOString(),finished:false,settings:{places,locale:LOCALE,minDelay,maxItems,maxFlyers},
        combos:summaries,rawFlyerLists:fullList,uniqueFlyerIds:seenFlyerIds.size,uniqueItemDetails:capturedItems.size,failures});
    }
  }
  saveJson(join(root,'report.json'),{startedAt:start,completedAt:new Date().toISOString(),finished:true,
    settings:{places,locale:LOCALE,minDelay,maxItems,maxFlyers},combos:summaries,rawFlyerLists:fullList,
    uniqueFlyerIds:seenFlyerIds.size,uniqueItemDetails:capturedItems.size,failures});
  console.log(`\nDone: ${seenFlyerIds.size} unique flyer IDs, ${capturedItems.size} unique item detail responses; ${failures.length} errors.`);
  console.log(`Read ${join(root,'report.json')}. Source bodies are stored unmodified. No database writes.`);
}
main().catch(e=>{console.error(e);process.exitCode=1});

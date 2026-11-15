/**
 * Kavyo address-verified geocoding for Calgary seed (Node 22 + tsx, no API key).
 * Run from the backend repository root with internet access:
 *   npx tsx scripts/geocode-calgary-stores.ts
 *   npx tsx scripts/geocode-calgary-stores.ts --city-only
 *
 * Reads data/reference/calgary-grocery-stores.json, writes two NEW files there:
 *   calgary-grocery-stores.geocoded.json  (reviewed coordinates only)
 *   calgary-grocery-stores.geocode-review.csv  (unmatched/ambiguous)
 * NEVER writes to PostgreSQL or overwrites the input JSON.
 *
 * Sources:
 *  - City of Calgary Business Licenses (municipal address-linked points)
 *    https://data.calgary.ca/resource/vdjc-pybd.json
 *  - City of Calgary Parcel Address (address and coordinate evidence)
 *    https://data.calgary.ca/Base-Maps/Parcel-Address/9zvu-p8uz
 *  - NRCan Geolocator (address-level matches, not postal code/city centroids)
 *    https://geolocator.api.geo.ca/
 *
 * For reuse/distribution, respect each source's attribution and license terms.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface Point { type: string; coordinates: [number, number] }
interface MunicipalRecord {
  tradename?: string;
  address?: string;
  point?: Point;
  jobstatusdesc?: string;
}
interface ParcelRecord {
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
}
interface GeolocatorResult {
  key?: string;
  name?: string;
  province?: string | null;
  category?: string;
  lat?: number;
  lng?: number;
}
interface Store {
  retailer: string; storeName: string; address: string; city: string;
  province: string; postalCode?: string | null;
  latitude?: number | null; longitude?: number | null;
  coordinateSource?: string | null;
  coordinateSourceUrl?: string | null;
  coordinateMatchStatus?: string;
  coordinateMatchedAddress?: string | null;
  coordinateCheckedOn?: string | null;
  coordinateReviewReason?: string | null;
  [key: string]: unknown;
}
interface SeedDoc { version: string; stores: Store[]; [key: string]: unknown }

const SOURCE_CITY = 'https://data.calgary.ca/resource/vdjc-pybd.json';
const SOURCE_NRCAN = 'https://geolocator.api.geo.ca/';
const SOURCE_PARCEL = 'https://data.calgary.ca/resource/9zvu-p8uz.json';
const INPUT = resolve('data/reference/calgary-grocery-stores.json');
const OUTPUT = resolve('data/reference/calgary-grocery-stores.geocoded.json');
const REVIEW = resolve('data/reference/calgary-grocery-stores.geocode-review.csv');
const date = new Date().toISOString().slice(0, 10);
const args = new Set(process.argv.slice(2));

function inCalgary(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 50.80 && lat <= 51.26 && lng >= -114.37 && lng <= -113.75;
}
function streetAddress(input: string): string {
  let str = input.toUpperCase().replace(/[’']/g, '').replace(/\./g, ' ').trim();
  // Strip an EXPLICIT suite/unit prefix only, retaining the civic street number.
  str = str.replace(/^(?:#\s*[A-Z0-9]+|(?:UNIT|SUITE|STE)\s+[A-Z0-9]+)\s*[, ]+/, '');
  // 100-123 Main St = 123 Main St. Keep the actual civic number on the right.
  str = str.replace(/^\d{1,5}[A-Z]?\s*-\s*(\d{1,5}[A-Z]?\s+)/, '$1');
  str = str.replace(/\b(\d+)(?:ST|ND|RD|TH)\b/g, '$1');
  const aliases: Record<string,string> = {
    STREET: 'ST', AVENUE: 'AV', DRIVE: 'DR', TRAIL: 'TR', ROAD: 'RD',
    HILL: 'HL', SQUARE: 'SQ', WAY: 'WY', HEIGHTS: 'HT',
    BOULEVARD: 'BV', CRESCENT: 'CR', COURT: 'CT', PLACE: 'PL',
    CIRCLE: 'CI', GATE: 'GA', GROVE: 'GV', CLOSE: 'CL', LANE: 'LN',
    NORTHWEST: 'NW', NORTHEAST: 'NE', SOUTHWEST: 'SW', SOUTHEAST: 'SE',
  };
  const tokens = str.replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g,' ').trim().split(' ');
  return tokens.map(t => aliases[t] ?? t).join(' ');
}
function civic(str: string): string | null {
  const m = streetAddress(str).match(/^(\d{1,5}[A-Z]?)\s/);
  return m?.[1] ?? null;
}
function quadrant(str: string): string | null {
  const m = streetAddress(str).match(/\b(NE|NW|SE|SW)\b$/);
  return m?.[1] ?? null;
}
function distMeters(a: [number,number], b: [number,number]): number {
  const R = 6371000; const rad = Math.PI / 180;
  const dy = (b[0]-a[0])*rad, dx = (b[1]-a[1])*rad;
  const x = Math.sin(dy/2)**2 + Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dx/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
async function getJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, {
    headers: {Accept:'application/json', 'User-Agent':'KavyoCapstoneEducationalStoreVerification/1.0'},
    signal: AbortSignal.timeout(60000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${new URL(url).origin}`);
  return await resp.json() as T;
}
const sleep = (ms: number) => new Promise<void>(done => setTimeout(done,ms));
function csvCell(x: unknown): string { return `"${String(x ?? '').replace(/"/g,'""')}"`; }

/**
 * Query the City of Calgary's Parcel Address dataset for an exact civic address.
 * Matches number, complete street name, street type and quadrant. Never takes
 * the first search result: different 225 Panatella addresses are distinct.
 * Returns an explanation if the parcel evidence is insufficient.
 */
async function findParcelAddress(store: Store): Promise<
  {lat: number; lng: number; address: string; queryUrl: string} | {reason: string}
> {
  const target = streetAddress(store.address);
  const civicNumber = civic(store.address);
  const firstStreetToken = target.split(' ')[1];
  if (!civicNumber || !/^\d+$/.test(civicNumber) || !firstStreetToken) {
    return {reason:'Cannot form exact civic parcel-address query'};
  }

  const url = new URL(SOURCE_PARCEL);
  url.searchParams.set('$select', 'address,latitude,longitude');
  // Narrow result set but do NOT use the first result as a match.
  // A prefix query permits multiword street names such as AUBURN MEADOWS.
  const streetPrefix = firstStreetToken.replace(/'/g, "''");
  url.searchParams.set('$where', `house_number = ${civicNumber} AND street_name like '${streetPrefix}%'`);
  url.searchParams.set('$limit', '5000');

  const raw = await getJson<ParcelRecord[]>(url.toString());
  if (!Array.isArray(raw)) return {reason:'Unexpected parcel address response'};
  const matches = raw
    .filter(r => typeof r.address === 'string' && streetAddress(r.address) === target)
    .map(r => ({
      address: r.address!, lat: Number(r.latitude), lng: Number(r.longitude),
    }))
    .filter(r => inCalgary(r.lat,r.lng));

  if (!matches.length) return {reason:'No exact City parcel-address match'};
  const anchor = matches[0];
  const spread = Math.max(...matches.map(r=>distMeters([anchor.lat,anchor.lng],[r.lat,r.lng])));
  // Some addresses correspond to large shopping centres with many points.
  // Never silently choose an arbitrary point when exact matches are dispersed.
  if (spread > 75) return {reason:`Conflicting exact parcel points (${Math.round(spread)}m spread)`};
  const sortedLats = matches.map(p=>p.lat).sort((a,b)=>a-b);
  const sortedLngs = matches.map(p=>p.lng).sort((a,b)=>a-b);
  const mid = Math.floor(matches.length/2);
  return {lat:sortedLats[mid],lng:sortedLngs[mid],address:anchor.address,queryUrl:url.toString()};
}

async function main(): Promise<void> {
  const doc = JSON.parse(readFileSync(INPUT,'utf8')) as SeedDoc;
  if (!doc.stores?.length) throw new Error('No store records');
  // The City dataset is location evidence, NOT proof a particular company is still trading.
  // Acquire full current municipal licence listing: matching by exact civic street address.
  let byAddress = new Map<string,MunicipalRecord[]>();
  try {
    const url = new URL(SOURCE_CITY);
    url.searchParams.set('$select','tradename,address,point,jobstatusdesc');
    url.searchParams.set('$limit','50000');
    const records = await getJson<MunicipalRecord[]>(url.toString());
    if (!Array.isArray(records)) throw new Error('Unexpected municipal response');
    for (const r of records) {
      const key = r.address ? streetAddress(r.address) : '';
      const coords = r.point?.coordinates;
      if (!key || !coords || !inCalgary(coords[1],coords[0])) continue;
      const group = byAddress.get(key) ?? [];
      group.push(r); byAddress.set(key,group);
    }
    console.log(`City licence records: ${records.length}; distinct geocoded street addresses: ${byAddress.size}`);
  } catch (err) {
    console.warn('City licence lookup unavailable. No municipal matches:',String(err));
  }
  let municipal=0, parcel=0, nrcan=0, preserved=0;
  const review: string[][] = [];
  for (const s of doc.stores) {
    // Preserve pre-verified exact store pin; do not overwrite without a review.
    if (s.latitude != null && s.longitude != null && inCalgary(s.latitude,s.longitude) && s.coordinateSourceUrl) {
      s.coordinateMatchStatus = s.coordinateMatchStatus ?? 'PREVERIFIED_LOCATION';
      preserved++; continue;
    }
    const fullAddress = `${s.address}, Calgary, Alberta`;
    const key = streetAddress(s.address);
    const exact = byAddress.get(key) ?? [];
    let reason = '';
    if (exact.length) {
      const points = exact.map(r=>[r.point!.coordinates[1],r.point!.coordinates[0]] as [number,number]);
      const spread = Math.max(...points.map(p=>distMeters(points[0],p)));
      if (spread <= 35) {
        // Median point from same exact municipal address (avoid nearby-shop centroid guesses).
        const sortedLats = points.map(p=>p[0]).sort((a,b)=>a-b);
        const sortedLngs = points.map(p=>p[1]).sort((a,b)=>a-b);
        s.latitude = sortedLats[Math.floor(sortedLats.length/2)];
        s.longitude = sortedLngs[Math.floor(sortedLngs.length/2)];
        s.coordinateSource = 'City of Calgary Business Licenses';
        s.coordinateSourceUrl = 'https://data.calgary.ca/Business-and-Economic-Activity/Calgary-Business-Licenses/vdjc-pybd';
        s.coordinateMatchStatus = 'EXACT_MUNICIPAL_STREET_ADDRESS';
        s.coordinateMatchedAddress = exact[0].address ?? key;
        s.coordinateCheckedOn = date;
        s.coordinateReviewReason = null;
        municipal++; continue;
      }
      reason = `Municipal point conflict (${Math.round(spread)}m spread)`;
    } else reason = 'Not in current municipal business-licence addresses';

    // Parcel Address is more appropriate for locating a civic address than
    // business licence points. Exact full-address equality is required.
    try {
      const match = await findParcelAddress(s);
      if ('lat' in match) {
        s.latitude = match.lat;
        s.longitude = match.lng;
        s.coordinateSource = 'City of Calgary Parcel Address';
        s.coordinateSourceUrl = 'https://data.calgary.ca/Base-Maps/Parcel-Address/9zvu-p8uz';
        s.coordinateMatchStatus = 'EXACT_CALGARY_PARCEL_ADDRESS';
        s.coordinateMatchedAddress = match.address;
        s.coordinateCheckedOn = date;
        s.coordinateReviewReason = null;
        s.coordinatePrecision = 'PARCEL_ADDRESS_POINT_NOT_STORE_ENTRANCE';
        parcel++;
        continue;
      }
      reason += `; ${match.reason}`;
    } catch (error) {
      reason += `; Parcel lookup failed: ${String(error).slice(0,130)}`;
    }

    if (!args.has('--city-only')) {
      try {
        const url = new URL(SOURCE_NRCAN);
        url.searchParams.set('q',fullAddress);
        url.searchParams.set('keys','nominatim,locate');
        url.searchParams.set('lang','en');
        const results = await getJson<GeolocatorResult[]>(url.toString());
        // Require full civic number, specific street name AND direction in geocoder name.
        const nameParts = streetAddress(s.address).split(' ');
        const civicNumber = civic(s.address);
        const distinctive = nameParts.slice(1).filter(t=>!['NE','NW','SE','SW','ST','AV','DR','TR','RD','BV','CR','CT','PL','CI','GA','GV','CL','LN'].includes(t));
        const direction = quadrant(s.address);
        const valid = (Array.isArray(results) ? results : []).filter(r=> {
          const category = String(r.category ?? '').toUpperCase();
          if (!/ADDRESS|BUILDING|HOUSE|SHOP|SUPERMARKET/.test(category)) return false;
          if (!inCalgary(Number(r.lat),Number(r.lng))) return false;
          const norm = streetAddress(r.name ?? '');
          const numberOK = Boolean(civicNumber && new RegExp(`(?:^| )${civicNumber}(?: |$)`).test(norm));
          const streetOK = distinctive.length>0 && distinctive.every(t=>norm.split(' ').includes(t));
          const directionOK = !direction || norm.split(' ').includes(direction);
          const cityOK = /CALGARY/i.test(r.name ?? '');
          return numberOK && streetOK && directionOK && cityOK;
        });
        if (valid.length) {
          const a = valid[0];
          if (valid.every(b=>distMeters([a.lat!,a.lng!],[b.lat!,b.lng!]) <= 60)) {
            s.latitude = Number(a.lat);
            s.longitude = Number(a.lng);
            s.coordinateSource = `Natural Resources Canada Geolocator (${a.key})`;
            s.coordinateSourceUrl = url.toString();
            s.coordinateMatchStatus = 'EXACT_NRCAN_STREET_ADDRESS';
            s.coordinateMatchedAddress = a.name ?? null;
            s.coordinateCheckedOn = date;
            s.coordinateReviewReason = null;
            nrcan++; continue;
          }
          reason += '; conflicting geocoder positions';
        } else reason += '; no geocoder exact civic-address match';
      } catch (err) {
        reason += `; NRCan lookup failed: ${String(err).slice(0,130)}`;
      }
      await sleep(500);
    }
    s.latitude = null; s.longitude = null;
    s.coordinateMatchStatus = 'REVIEW_REQUIRED';
    s.coordinateReviewReason = reason;
    review.push([s.retailer,s.storeName,s.address,s.postalCode ?? '',reason]);
  }
  doc.version = `${doc.version}-geocoded-${date}`;
  doc.coordinatePolicy = 'Coordinates included only for exact full-address matches; unmatched remain null. Municipal business and parcel points are not necessarily store entrances.';
  mkdirSync(dirname(OUTPUT),{recursive:true});
  writeFileSync(OUTPUT,JSON.stringify(doc,null,2)+'\n');
  writeFileSync(REVIEW,'\ufeff'+[['retailer','storeName','address','postalCode','reviewReason'],...review].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
  console.log(`Coordinates: ${municipal} exact municipal; ${parcel} exact city parcel; ${nrcan} exact NRCan; ${preserved} preverified; ${review.length} review/unmatched.`);
  console.log('Geocoded JSON:',OUTPUT);
  console.log('Review report:',REVIEW);
  console.log('NO DATABASE WRITES. To use the updated coordinates, review/rename the geocoded JSON then run seed with --apply on LOCAL DB only.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

-- Kavyo: Calgary location reference seed (2026-11-16)
-- Source: manually reviewed PostgreSQL export, 95 stores / 7 retailer banners.
-- Use ONLY on an isolated, local kavyo_install_test DB AFTER `npx prisma migrate deploy`.
-- Never run against a production/shared DB. Does not seed flyers/products/users.
-- Reentrant by normalized retailer/address; does NOT require deterministic UUIDs.
-- Idempotency includes updates of store display names, postal codes and coordinates.
-- NOTE: existing stores with a DIFFERENT street address are not silently merged.
\set ON_ERROR_STOP on
BEGIN;

DO $$
BEGIN
  IF current_database() <> 'kavyo_install_test' THEN
    RAISE EXCEPTION 'Safety stop: expected kavyo_install_test, got %', current_database();
  END IF;
END
$$;

CREATE TEMP TABLE kavyo_seed_stores (
  retailer text NOT NULL,
  store_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL
) ON COMMIT DROP;

INSERT INTO kavyo_seed_stores
  (retailer, store_name, address, city, province, postal_code, latitude, longitude)
VALUES
  ('Calgary Co-op', 'Auburn Bay', '#700, 100 Auburn Meadows Drive SE', 'Calgary', 'AB', 'T3M 2G5', 50.894104, -113.945016),
  ('Calgary Co-op', 'Brentwood', '4122 Brentwood Road NW', 'Calgary', 'AB', 'T2L 1K8', 51.088137, -114.131827),
  ('Calgary Co-op', 'Creekside', '12000 Symons Valley Road NW', 'Calgary', 'AB', 'T3P 0A3', 51.161605, -114.122544),
  ('Calgary Co-op', 'Crowfoot', '35 Crowfoot Way NW', 'Calgary', 'AB', 'T3G 2L4', 51.123545, -114.200973),
  ('Calgary Co-op', 'Dalhousie', '5505 Shaganappi Trail NW', 'Calgary', 'AB', 'T3A 1Z6', 51.102776, -114.146259),
  ('Calgary Co-op', 'Deer Valley', '#95, 1221 Canyon Meadows Drive SE', 'Calgary', 'AB', 'T2J 6G2', 50.931273, -114.029902),
  ('Calgary Co-op', 'Forest Lawn', '3330 17 Avenue SE', 'Calgary', 'AB', 'T2A 0P9', 51.038030, -113.987818),
  ('Calgary Co-op', 'Macleod Trail', '8818 Macleod Trail SE', 'Calgary', 'AB', 'T2H 0M5', 50.974561, -114.069262),
  ('Calgary Co-op', 'Midtown', '1130 11 Avenue SW', 'Calgary', 'AB', 'T2R 0G4', 51.043535, -114.088221),
  ('Calgary Co-op', 'Monterey', '#700, 2220 68 Street NE', 'Calgary', 'AB', 'T1Y 6Y7', 51.069180, -113.934810),
  ('Calgary Co-op', 'North Hill', '520 16 Avenue NE', 'Calgary', 'AB', 'T2E 1K4', 51.067470, -114.052463),
  ('Calgary Co-op', 'Oakridge', '#150, 2580 Southland Drive SW', 'Calgary', 'AB', 'T2V 4J8', 50.961488, -114.120983),
  ('Calgary Co-op', 'Quarry Park', '163 Quarry Park Boulevard SE', 'Calgary', 'AB', 'T2C 5E1', 50.962671, -114.007915),
  ('Calgary Co-op', 'Richmond Road', '4940 Richmond Road SW', 'Calgary', 'AB', 'T3E 6K4', 51.019020, -114.158840),
  ('Calgary Co-op', 'Rocky Ridge', '#1000, 11595 Rockyvalley Drive NW', 'Calgary', 'AB', 'T3G 5Y6', 51.148338, -114.255467),
  ('Calgary Co-op', 'Shawnessy', '#100, 250 Shawville Boulevard SE', 'Calgary', 'AB', 'T2Y 2Z7', 50.902797, -114.064965),
  ('Calgary Co-op', 'West Springs', '#100, 917 85 Street SW', 'Calgary', 'AB', 'T3H 4C8', 51.059074, -114.211256),
  ('No Frills', '17 Avenue SE (Harman’s)', '#200, 4501 17 Avenue SE', 'Calgary', 'AB', 'T2A 0T7', 51.037636, -113.969315),
  ('No Frills', 'Carrington (John and Irish’s)', '135 Carrington Plaza NW', 'Calgary', 'AB', 'T3P 1Y3', 51.183285, -114.093520),
  ('No Frills', 'Deer Ridge', '14939 Deer Ridge Drive SE', 'Calgary', 'AB', 'T2J 7C4', 50.931247, -114.025071),
  ('No Frills', 'Downtown (Cynthia’s)', '870 11 Street SW', 'Calgary', 'AB', 'T2P 2C4', 51.045508, -114.087841),
  ('No Frills', 'Elbow Drive', '10233 Elbow Drive SW', 'Calgary', 'AB', 'T2W 1E8', 50.962009, -114.084997),
  ('No Frills', 'Temple', '5401 Temple Drive NE', 'Calgary', 'AB', 'T1Y 3R7', 51.085758, -113.955204),
  ('No Frills', 'West Springs', '882 85 Street SW', 'Calgary', 'AB', 'T3H 4C7', 51.060012, -114.210262),
  ('Real Canadian Superstore', '130 Avenue SE', '#100, 4700 130 Avenue SE', 'Calgary', 'AB', 'T2Z 4E7', 50.932239, -113.966720),
  ('Real Canadian Superstore', '20 Avenue NE', '3575 20 Avenue NE', 'Calgary', 'AB', 'T1Y 6R3', 51.069065, -113.984045),
  ('Real Canadian Superstore', '4 Street NW', '7020 4 Street NW', 'Calgary', 'AB', 'T2K 1C4', 51.115784, -114.071176),
  ('Real Canadian Superstore', 'Country Hills', '5251 Country Hills Boulevard NW', 'Calgary', 'AB', 'T3A 5H8', 51.136485, -114.161256),
  ('Real Canadian Superstore', 'Country Village', '100 Country Village Road NE', 'Calgary', 'AB', 'T3K 5Z2', 51.160608, -114.067754),
  ('Real Canadian Superstore', 'Downtown / 6 Avenue', '428 6 Avenue SE', 'Calgary', 'AB', 'T2G 0G7', 51.047537, -114.054362),
  ('Real Canadian Superstore', 'Heritage Meadows', '#100, 20 Heritage Meadows Way SE', 'Calgary', 'AB', 'T2H 0B5', 50.985900, -114.043762),
  ('Real Canadian Superstore', 'Macleod Trail', '#100, 15915 Macleod Trail SE', 'Calgary', 'AB', 'T2Y 3R9', 50.910253, -114.065911),
  ('Real Canadian Superstore', 'Real Canadian Superstore Seton Way', '19655 Seton Way SE', 'Calgary', 'AB', 'T3M 2N9', 50.874767, -113.960375),
  ('Real Canadian Superstore', 'Signal Hill', '5858 Signal Hill Centre SW', 'Calgary', 'AB', 'T3H 3P8', 51.019342, -114.174218),
  ('Real Canadian Superstore', 'Southport', '10505 Southport Road SW', 'Calgary', 'AB', 'T2W 3N2', 50.961879, -114.074340),
  ('Real Canadian Superstore', 'West Springs / 69 Street', '#110, 3400 69 Street NW', 'Calgary', 'AB', 'T3B 2J8', 51.082512, -114.186857),
  ('Real Canadian Superstore', 'Westwinds', '#100, 3633 Westwinds Drive NE', 'Calgary', 'AB', 'T3J 5K3', 51.109064, -113.969668),
  ('Safeway', 'Aspen', '375 Aspen Glen Landing SW', 'Calgary', 'AB', 'T3H 0N6', 51.041071, -114.208878),
  ('Safeway', 'Beacon Heights', '#20, 1818 Centre Street NE', 'Calgary', 'AB', 'T2E 2S6', 51.068336, -114.061004),
  ('Safeway', 'Beddington', '8120 Beddington Boulevard NW', 'Calgary', 'AB', 'T3K 2A8', 51.125720, -114.074020),
  ('Safeway', 'Beltline', '813 11 Avenue SW', 'Calgary', 'AB', 'T2R 0E6', 51.042343, -114.080088),
  ('Safeway', 'Bonavista Shopping Plaza', '#1, 755 Lake Bonavista Drive SE', 'Calgary', 'AB', 'T2J 0N3', 50.943318, -114.047609),
  ('Safeway', 'Castleridge', '55 Castleridge Boulevard NE', 'Calgary', 'AB', 'T3J 3J8', 51.098939, -113.960265),
  ('Safeway', 'Crowfoot', '99 Crowfoot Crescent NW', 'Calgary', 'AB', 'T3G 2L5', 51.126272, -114.201033),
  ('Safeway', 'Dalhousie Station', '5005 Dalhousie Drive NW', 'Calgary', 'AB', 'T3A 5R8', 51.106388, -114.159069),
  ('Safeway', 'Garrison Woods', '2425 34 Avenue SW', 'Calgary', 'AB', 'T2T 6E3', 51.022756, -114.116621),
  ('Safeway', 'Glamorgan', '3737 37 Street SW', 'Calgary', 'AB', 'T3E 6L6', 51.020713, -114.142075),
  ('Safeway', 'Glenmore Landing', '1600 90 Avenue SW', 'Calgary', 'AB', 'T2V 5A8', 50.972508, -114.097917),
  ('Safeway', 'Kensington', '410 10 Street NW', 'Calgary', 'AB', 'T2N 1V9', 51.056176, -114.085198),
  ('Safeway', 'Market Mall', '3625 Shaganappi Trail NW', 'Calgary', 'AB', 'T3A 0E2', 51.086371, -114.153767),
  ('Safeway', 'Mission', '524 Elbow Drive SW', 'Calgary', 'AB', 'T2S 2H6', 51.030313, -114.072680),
  ('Safeway', 'Montgomery', '5048 16 Avenue NW', 'Calgary', 'AB', 'T3B 0N3', 51.074941, -114.166091),
  ('Safeway', 'North Hill Mall', '1632 14 Avenue NW', 'Calgary', 'AB', 'T2N 1M7', 51.064689, -114.099173),
  ('Safeway', 'Shawnessy', '70 Shawville Boulevard SE', 'Calgary', 'AB', 'T2Y 2Z3', 50.905790, -114.066504),
  ('Safeway', 'South Trail Crossing', '#100, 4915 130 Avenue SE', 'Calgary', 'AB', 'T2Z 3V8', 50.930415, -113.963546),
  ('Safeway', 'Southcentre', '11011 Bonaventure Drive SE', 'Calgary', 'AB', 'T2J 6S1', 50.952734, -114.061650),
  ('Safeway', 'Westbrook Mall', '1200 37 Street SW', 'Calgary', 'AB', 'T3C 1S2', 51.041506, -114.140902),
  ('Safeway', 'Westhills Towne Centre', '200 Stewart Green SW', 'Calgary', 'AB', 'T3H 3C8', 51.014550, -114.167739),
  ('Safeway', 'Woodbine', '2525 Woodview Drive SW', 'Calgary', 'AB', 'T2W 4N4', 50.941051, -114.119429),
  ('Save-On-Foods', 'Heritage', '8855 Macleod Trail SW', 'Calgary', 'AB', 'T2H 0M2', 50.974644, -114.072897),
  ('Save-On-Foods', 'Hunterhorn', '40 Hunterhorn Drive NE', 'Calgary', 'AB', 'T2K 6H2', 51.112550, -114.053890),
  ('Save-On-Foods', 'Mount Royal', '906 16 Avenue SW', 'Calgary', 'AB', 'T2R 0T3', 51.038455, -114.082642),
  ('Save-On-Foods', 'Panorama', '225 Panatella Hill NW', 'Calgary', 'AB', 'T3K 0Y5', 51.167167, -114.088397),
  ('Save-On-Foods', 'Richmond Square', '3915 51 Street SW', 'Calgary', 'AB', 'T3E 6N1', 51.020642, -114.161274),
  ('Save-On-Foods', 'Save-On-Foods Seton', '19489 Seton Crescent SE #130', 'Calgary', 'AB', 'T3M 1T4', 50.879743, -113.957821),
  ('Save-On-Foods', 'Trans Canada', '1440 52 Street NE', 'Calgary', 'AB', 'T2A 4T8', 51.063339, -113.958075),
  ('Save-On-Foods', 'Trinity Hills', '420 Na''a Plaza SW', 'Calgary', 'AB', 'T3H 6A4', 51.079000, -114.195148),
  ('Save-On-Foods', 'University District', '4163 University Avenue NW', 'Calgary', 'AB', 'T3B 6K3', 51.077386, -114.147089),
  ('Save-On-Foods', 'Walden', '155 Walden Gate SE', 'Calgary', 'AB', 'T2X 0R2', 50.874927, -114.038667),
  ('Sobeys', 'Bridlewood', '#100, 2335 162 Avenue SW', 'Calgary', 'AB', 'T2Y 4S6', 50.906505, -114.112114),
  ('Sobeys', 'Country Hills', '#200, 500 Country Hills Boulevard NE', 'Calgary', 'AB', 'T3K 5H2', 51.154591, -114.055949),
  ('Sobeys', 'Cranston', '#3000, 356 Cranston Road SE', 'Calgary', 'AB', 'T3M 0S9', 50.880320, -113.978549),
  ('Sobeys', 'Forest Lawn', '5101 17 Avenue SE', 'Calgary', 'AB', 'T2A 0V7', 51.037266, -113.960825),
  ('Sobeys', 'Legacy', '#100, 200 Hartell Way SE', 'Calgary', 'AB', 'T2X 4K8', 50.863759, -114.027787),
  ('Sobeys', 'McKenzie Towne', '20 McKenzie Towne Avenue SE', 'Calgary', 'AB', 'T2Z 3S7', 50.917270, -113.959831),
  ('Sobeys', 'Millrise', '#2000, 150 Millrise Boulevard SW', 'Calgary', 'AB', 'T2Y 5G7', 50.914533, -114.073474),
  ('Sobeys', 'Nolan Hill', '#700, 8 Nolan Hill Boulevard NW', 'Calgary', 'AB', 'T3R 0J3', 51.172145, -114.157604),
  ('Sobeys', 'Riverbend', '#100, 8338 18 Street SE', 'Calgary', 'AB', 'T2C 4E4', 50.977259, -114.015499),
  ('Sobeys', 'Royal Oak', '#125, 8888 Country Hills Boulevard NW', 'Calgary', 'AB', 'T3G 5T4', 51.151400, -114.213202),
  ('Sobeys', 'Silverado', '#704, 19369 Sheriff King Street SW', 'Calgary', 'AB', 'T2X 0T9', 50.878758, -114.071145),
  ('Sobeys', 'Sobeys Mahogany', '7 Mahogany Plaza SE #1200', 'Calgary', 'AB', 'T3M 2P8', 50.897519, -113.941220),
  ('Sobeys', 'Strathcona Square', '#300, 555 Strathcona Boulevard SW', 'Calgary', 'AB', 'T3H 2Z9', 51.048637, -114.184849),
  ('Sobeys', 'Tuscany', '#2020, 11300 Tuscany Boulevard NW', 'Calgary', 'AB', 'T3L 2V7', 51.123584, -114.247839),
  ('Sobeys', 'West District', '740 85 Street SW', 'Calgary', 'AB', 'T3H 6L8', 51.065197, -114.210151),
  ('Walmart', 'Calgary Deerfoot', '7979 11 Street SE', 'Calgary', 'AB', 'T2H 0B8', 50.984084, -114.046108),
  ('Walmart', 'Calgary Deerfoot Mall', '1110 57 Avenue NE', 'Calgary', 'AB', 'T2E 9B7', 51.107527, -114.037850),
  ('Walmart', 'Calgary East Hills', '255 East Hills Boulevard SE', 'Calgary', 'AB', 'T2A 4X7', 51.038537, -113.910934),
  ('Walmart', 'Calgary Macleod Mall', '9650 Macleod Trail SE', 'Calgary', 'AB', 'T2J 0P7', 50.966049, -114.069238),
  ('Walmart', 'Calgary Marlborough', '3800 Memorial Drive NE', 'Calgary', 'AB', 'T2A 2K2', 51.052669, -113.979301),
  ('Walmart', 'Calgary Northland', '5005 Northland Drive NW', 'Calgary', 'AB', 'T2L 2K1', 51.097047, -114.143802),
  ('Walmart', 'Calgary Royal Oak', '8888 Country Hills Boulevard NW', 'Calgary', 'AB', 'T3G 5T4', 51.153301, -114.213276),
  ('Walmart', 'Calgary Sage Hill', '35 Sage Hill Gate NW', 'Calgary', 'AB', 'T3R 0S4', 51.170505, -114.143296),
  ('Walmart', 'Calgary South', '#100, 310 Shawville Boulevard SE', 'Calgary', 'AB', 'T2Y 3S4', 50.900878, -114.061372),
  ('Walmart', 'Calgary South East', '4705 130 Avenue SE', 'Calgary', 'AB', 'T2Z 4J2', 50.931708, -113.966737),
  ('Walmart', 'Calgary Westbrook', '1212 37 Street SW', 'Calgary', 'AB', 'T3C 1S3', 51.040915, -114.139851);

-- Assert the source file itself is complete and contains no duplicates.
DO $$
BEGIN
 IF (SELECT COUNT(*) FROM kavyo_seed_stores) <> 95 THEN
   RAISE EXCEPTION 'Seed source must contain exactly 95 stores';
 END IF;
 IF EXISTS (
   SELECT 1 FROM kavyo_seed_stores GROUP BY lower(retailer), lower(regexp_replace(address, '[^a-zA-Z0-9]', '', 'g')) HAVING COUNT(*) > 1
 ) THEN
   RAISE EXCEPTION 'Duplicate seed retailer/address pair';
 END IF;
 IF EXISTS (SELECT 1 FROM kavyo_seed_stores WHERE latitude NOT BETWEEN 50.80 AND 51.26 OR longitude NOT BETWEEN -114.37 AND -113.75) THEN
   RAISE EXCEPTION 'Seed contains coordinates outside Calgary validation bounds';
 END IF;
END $$;

-- Create missing retailers, preserving existing retailer fields and IDs.
INSERT INTO public.retailers (id, name, updated_at)
SELECT gen_random_uuid(), src.retailer, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT retailer FROM kavyo_seed_stores) AS src
WHERE NOT EXISTS (SELECT 1 FROM public.retailers r WHERE lower(r.name) = lower(src.retailer));

-- Fail rather than arbitrarily attaching stores to duplicated retailer names.
DO $$
BEGIN
 IF EXISTS (
   SELECT 1 FROM public.retailers r JOIN kavyo_seed_stores s ON lower(r.name)=lower(s.retailer)
   GROUP BY lower(s.retailer) HAVING COUNT(DISTINCT r.id) > 1
 ) THEN
   RAISE EXCEPTION 'Duplicate retailer identities; resolve before running seed';
 END IF;
 IF EXISTS (
   SELECT 1 FROM public.stores st JOIN public.retailers r ON r.id=st.retailer_id
    JOIN kavyo_seed_stores s ON lower(r.name)=lower(s.retailer)
      AND lower(regexp_replace(st.address, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(s.address, '[^a-zA-Z0-9]', '', 'g'))
    GROUP BY lower(r.name), lower(regexp_replace(s.address, '[^a-zA-Z0-9]', '', 'g'))
    HAVING COUNT(DISTINCT st.id) > 1
 ) THEN
   RAISE EXCEPTION 'Duplicate existing stores matched; manual review required';
 END IF;
END $$;

-- Synchronize verified attributes for stores that already match by retailer/address.
UPDATE public.stores st SET
  name=s.store_name,
  city=s.city,
  province=s.province,
  postal_code=s.postal_code,
  latitude=s.latitude,
  longitude=s.longitude,
  updated_at=CURRENT_TIMESTAMP
FROM kavyo_seed_stores s JOIN public.retailers r ON lower(r.name)=lower(s.retailer)
WHERE st.retailer_id=r.id
  AND lower(regexp_replace(st.address, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(s.address, '[^a-zA-Z0-9]', '', 'g'));

-- Create missing stores with new local UUIDs.
INSERT INTO public.stores
  (id, retailer_id, name, address, city, province, postal_code, latitude, longitude, is_active, updated_at)
SELECT gen_random_uuid(), r.id, s.store_name, s.address, s.city,
       s.province, s.postal_code, s.latitude, s.longitude, true, CURRENT_TIMESTAMP
FROM kavyo_seed_stores s
JOIN public.retailers r ON lower(r.name)=lower(s.retailer)
WHERE NOT EXISTS (
 SELECT 1 FROM public.stores st
 WHERE st.retailer_id=r.id
   AND lower(regexp_replace(st.address, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(s.address, '[^a-zA-Z0-9]', '', 'g'))
);

-- Validate every intended record is present and every matching pin agrees.
DO $$
DECLARE matched integer;
BEGIN
 SELECT COUNT(*) INTO matched
 FROM kavyo_seed_stores s
 JOIN public.retailers r ON lower(r.name)=lower(s.retailer)
 JOIN public.stores st ON st.retailer_id=r.id
  AND lower(regexp_replace(st.address, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(s.address, '[^a-zA-Z0-9]', '', 'g'))
  AND st.latitude=s.latitude AND st.longitude=s.longitude
  AND st.postal_code=s.postal_code;
 IF matched <> 95 THEN
   RAISE EXCEPTION 'Seed validation failed: matched % of 95', matched;
 END IF;
 RAISE NOTICE 'Kavyo Calgary reference seed verified: 95/95 matched with coordinates';
END $$;

COMMIT;

SELECT r.name AS retailer, COUNT(*) AS stores, COUNT(*) FILTER (WHERE st.latitude IS NOT NULL AND st.longitude IS NOT NULL) AS geolocated
FROM public.stores st JOIN public.retailers r ON r.id=st.retailer_id
WHERE r.name IN (SELECT DISTINCT retailer FROM (VALUES
  ('Calgary Co-op'), ('No Frills'), ('Real Canadian Superstore'),
  ('Safeway'), ('Save-On-Foods'), ('Sobeys'), ('Walmart')
) AS banners(retailer))
GROUP BY r.name ORDER BY r.name;

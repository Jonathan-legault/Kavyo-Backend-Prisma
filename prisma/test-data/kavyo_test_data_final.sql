-- ============================================================================
-- KAVYO REAL TEST DATA FIXTURE
-- File: kavyo_real_test_data_2026-10-04.sql
--
-- Captured / verified: October 4, 2026
-- Location: Calgary, Alberta
--
-- PURPOSE
-- -------
-- A small, shareable real-data fixture for Kavyo development/testing.
--
-- This file intentionally DOES NOT import the full ~62,575-product
-- Open Food Facts catalogue.
--
-- It creates/updates only:
--   * 2 application roles
--   * 6 source systems (3 base + 3 retailer websites)
--   * 3 retailers
--   * 3 Calgary stores
--   * 5 exact grocery products
--   * 3 ingest batches
--   * 15 price observations (5 products x 3 stores)
--
-- REQUIREMENT
-- -----------
-- Run the project's Prisma migrations FIRST.
-- This script seeds data only. It does NOT create or replace the Prisma schema.
-- The preflight below checks the expected mapped PostgreSQL columns before
-- inserting anything.
--
-- SAFE TO RE-RUN
-- --------------
-- The script uses UPSERT / NOT EXISTS checks so a teammate can re-run it
-- without intentionally creating another copy of this fixture.
--
-- EXACT SCHEMA REVIEW
-- -------------------
-- Verified against the uploaded schema.prisma on 2026-10-04.
-- Raw SQL uses the @map()/@@map() PostgreSQL names defined by Prisma.
-- The five products are created/upserted in Section 5 before prices are loaded.
--
-- PROMOTION MODEL TODO
-- --------------------
-- The current price_observations table stores:
--   regular_price
--   sale_price
--
-- The comparison engine will also need structured promotion conditions.
--
-- Required condition types discussed:
--   QUANTITY_LIMIT
--   MEMBER_PRICE
--   LOYALTY_CARD
--   MULTI_BUY
--   BOGO / 2-FOR-1
--   MINIMUM_SPEND
--   APP_OFFER
--
-- MULTI_BUY must distinguish at least:
--
--   PRO_RATA
--   Example:
--     3 for $9
--     1 item = $3
--     2 items = $6
--     3 items = $9
--
--   THRESHOLD_REQUIRED
--   Example:
--     Buy 3 for $9
--     otherwise the normal single-unit price applies.
--
-- Likely future normalized structure:
--   condition_types
--   price_conditions
--
-- Possible fields:
--   condition_type_id
--   condition_quantity
--   bundle_price
--   single_unit_price
--   post_condition_price
--   buy_quantity
--   get_quantity
--   discount_percent
--   pricing_mode
--
-- Until those tables exist, Superstore quantity-limit information is retained
-- in ingest_batches.source_reference so it is not lost.
-- ============================================================================


-- ============================================================================
-- PRISMA / POSTGRESQL COMPATIBILITY NOTES
-- ============================================================================
--
-- Prisma code uses model field names such as:
--   retailerId, postalCode, isActive, sourceSystemId, regularPrice, validUntil
--
-- Raw SQL must use the mapped PostgreSQL column names:
--   retailer_id, postal_code, is_active, source_system_id, regular_price,
--   valid_until, etc.
--
-- The retailer field currently used by the Prisma seed is `website`; the
-- physical PostgreSQL column used by this fixture is therefore `website`.
--
-- The SQL that was executed successfully on 2026-10-04 also confirms the
-- physical names for source_systems, ingest_batches and price_observations.
--
-- This preflight intentionally FAILS EARLY with a clear message if a teammate
-- runs the fixture against a schema that is older/different from the expected
-- Prisma migrations.
-- ============================================================================

DO $$
DECLARE
    missing_columns text;
BEGIN
    WITH required(table_name, column_name) AS (
        VALUES
            ('roles', 'id'),
            ('roles', 'name'),
            ('roles', 'description'),

            ('retailers', 'id'),
            ('retailers', 'name'),
            ('retailers', 'website'),
            ('retailers', 'is_active'),
            ('retailers', 'created_at'),
            ('retailers', 'updated_at'),

            ('stores', 'id'),
            ('stores', 'retailer_id'),
            ('stores', 'name'),
            ('stores', 'address'),
            ('stores', 'city'),
            ('stores', 'province'),
            ('stores', 'postal_code'),
            ('stores', 'is_active'),
            ('stores', 'created_at'),
            ('stores', 'updated_at'),

            ('products', 'id'),
            ('products', 'barcode'),
            ('products', 'product_name'),
            ('products', 'brand'),
            ('products', 'quantity_value'),
            ('products', 'quantity_unit'),
            ('products', 'quantity_text'),
            ('products', 'created_at'),
            ('products', 'updated_at'),

            ('source_systems', 'id'),
            ('source_systems', 'name'),
            ('source_systems', 'source_type'),
            ('source_systems', 'base_url'),
            ('source_systems', 'license_info'),
            ('source_systems', 'is_active'),
            ('source_systems', 'created_at'),
            ('source_systems', 'updated_at'),

            ('ingest_batches', 'id'),
            ('ingest_batches', 'source_system_id'),
            ('ingest_batches', 'status'),
            ('ingest_batches', 'started_at'),
            ('ingest_batches', 'completed_at'),
            ('ingest_batches', 'records_read'),
            ('ingest_batches', 'records_inserted'),
            ('ingest_batches', 'records_updated'),
            ('ingest_batches', 'records_rejected'),
            ('ingest_batches', 'source_reference'),

            ('price_observations', 'id'),
            ('price_observations', 'product_id'),
            ('price_observations', 'store_id'),
            ('price_observations', 'source_system_id'),
            ('price_observations', 'ingest_batch_id'),
            ('price_observations', 'regular_price'),
            ('price_observations', 'sale_price'),
            ('price_observations', 'currency'),
            ('price_observations', 'observed_at'),
            ('price_observations', 'valid_from'),
            ('price_observations', 'valid_until'),
            ('price_observations', 'source_record_id'),
            ('price_observations', 'created_at')
    ),
    missing AS (
        SELECT r.table_name, r.column_name
        FROM required r
        LEFT JOIN information_schema.columns c
          ON c.table_schema = 'public'
         AND c.table_name = r.table_name
         AND c.column_name = r.column_name
        WHERE c.column_name IS NULL
    )
    SELECT string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name)
    INTO missing_columns
    FROM missing;

    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION
            'Kavyo fixture schema mismatch. Run the current Prisma migrations first. Missing expected columns: %',
            missing_columns;
    END IF;
END
$$;


BEGIN;


-- ============================================================================
-- 1. APPLICATION ROLES
-- ============================================================================
-- Matches the current Prisma seed.

INSERT INTO roles (
    id,
    name,
    description
)
VALUES
    (
        gen_random_uuid(),
        'USER',
        'Standard Kavyo application user'
    ),
    (
        gen_random_uuid(),
        'ADMIN',
        'Administrative access to Kavyo'
    )
ON CONFLICT (name)
DO UPDATE SET
    description = EXCLUDED.description;


-- ============================================================================
-- 2. BASE SOURCE SYSTEMS
-- ============================================================================
-- These were already part of the project seed before today's retailer work.

INSERT INTO source_systems (
    id,
    name,
    source_type,
    base_url,
    license_info,
    is_active,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        'OPEN_FOOD_FACTS',
        'PRODUCT_CATALOG',
        'https://world.openfoodfacts.org',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'OPEN_PRICES',
        'PRICE_DATA',
        'https://prices.openfoodfacts.org',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'MANUAL_IMPORT',
        'MANUAL',
        NULL,
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (name)
DO UPDATE SET
    source_type = EXCLUDED.source_type,
    base_url = EXCLUDED.base_url,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- 3. RETAILERS
-- ============================================================================

INSERT INTO retailers (
    id,
    name,
    website,
    is_active,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        'Real Canadian Superstore',
        'https://www.realcanadiansuperstore.ca',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Save-On-Foods',
        'https://www.saveonfoods.com',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Sobeys',
        'https://www.sobeys.com',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (name)
DO UPDATE SET
    website = EXCLUDED.website,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- 4. STORES
-- ============================================================================
-- The current Prisma seed finds stores by retailer + address.
-- We use the same identity rule here.

-- --------------------------------------------------------------------------
-- Real Canadian Superstore Seton Way
-- --------------------------------------------------------------------------

UPDATE stores s
SET
    name = 'Real Canadian Superstore Seton Way',
    city = 'Calgary',
    province = 'AB',
    postal_code = 'T3M 2N9',
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM retailers r
WHERE s.retailer_id = r.id
  AND r.name = 'Real Canadian Superstore'
  AND s.address = '19655 Seton Way SE';

INSERT INTO stores (
    id,
    retailer_id,
    name,
    address,
    city,
    province,
    postal_code,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    r.id,
    'Real Canadian Superstore Seton Way',
    '19655 Seton Way SE',
    'Calgary',
    'AB',
    'T3M 2N9',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM retailers r
WHERE r.name = 'Real Canadian Superstore'
  AND NOT EXISTS (
      SELECT 1
      FROM stores s
      WHERE s.retailer_id = r.id
        AND s.address = '19655 Seton Way SE'
  );


-- --------------------------------------------------------------------------
-- Save-On-Foods Seton
-- --------------------------------------------------------------------------

UPDATE stores s
SET
    name = 'Save-On-Foods Seton',
    city = 'Calgary',
    province = 'AB',
    postal_code = 'T3M 1T4',
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM retailers r
WHERE s.retailer_id = r.id
  AND r.name = 'Save-On-Foods'
  AND s.address = '19489 Seton Crescent SE #130';

INSERT INTO stores (
    id,
    retailer_id,
    name,
    address,
    city,
    province,
    postal_code,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    r.id,
    'Save-On-Foods Seton',
    '19489 Seton Crescent SE #130',
    'Calgary',
    'AB',
    'T3M 1T4',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM retailers r
WHERE r.name = 'Save-On-Foods'
  AND NOT EXISTS (
      SELECT 1
      FROM stores s
      WHERE s.retailer_id = r.id
        AND s.address = '19489 Seton Crescent SE #130'
  );


-- --------------------------------------------------------------------------
-- Sobeys Mahogany
-- --------------------------------------------------------------------------

UPDATE stores s
SET
    name = 'Sobeys Mahogany',
    city = 'Calgary',
    province = 'AB',
    postal_code = 'T3M 2P8',
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM retailers r
WHERE s.retailer_id = r.id
  AND r.name = 'Sobeys'
  AND s.address = '7 Mahogany Plaza SE #1200';

INSERT INTO stores (
    id,
    retailer_id,
    name,
    address,
    city,
    province,
    postal_code,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    r.id,
    'Sobeys Mahogany',
    '7 Mahogany Plaza SE #1200',
    'Calgary',
    'AB',
    'T3M 2P8',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM retailers r
WHERE r.name = 'Sobeys'
  AND NOT EXISTS (
      SELECT 1
      FROM stores s
      WHERE s.retailer_id = r.id
        AND s.address = '7 Mahogany Plaza SE #1200'
  );


-- ============================================================================
-- 5. FIVE TEST PRODUCTS
-- ============================================================================
-- These are the exact five SKUs used across all three stores.
--
-- Product identity:
--   internal UUID = Kavyo ID
--   barcode       = external UPC/EAN-style identifier
--
-- Barcode remains VARCHAR so leading zeroes are preserved.

INSERT INTO products (
    id,
    barcode,
    product_name,
    brand,
    quantity_value,
    quantity_unit,
    quantity_text,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        '0059724101647',
        'Froot Loops',
        'Kellogg''s',
        480.000,
        'g',
        '480 g',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '0059724101722',
        'Frosted Flakes',
        'Kellogg''s',
        545.000,
        'g',
        '545 g',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '0064100143135',
        'Rice Krispies',
        'Kelloggs',
        560.000,
        'g',
        '560 grammes',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '0068100084245',
        'Smooth Peanut Butter',
        'Kraft',
        1000.000,
        'g',
        '1kg',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        '0059724101661',
        'Two Scoops Raisin Bran',
        'Kellogg''s',
        600.000,
        'g',
        '600 g',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (barcode)
DO UPDATE SET
    product_name = EXCLUDED.product_name,
    brand = EXCLUDED.brand,
    quantity_value = EXCLUDED.quantity_value,
    quantity_unit = EXCLUDED.quantity_unit,
    quantity_text = EXCLUDED.quantity_text,
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- 6. RETAILER WEBSITE SOURCE SYSTEMS
-- ============================================================================

INSERT INTO source_systems (
    id,
    name,
    source_type,
    base_url,
    license_info,
    is_active,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        'SAVE_ON_FOODS_WEB',
        'RETAILER_WEBSITE',
        'https://www.saveonfoods.com',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'REAL_CANADIAN_SUPERSTORE_WEB',
        'RETAILER_WEBSITE',
        'https://www.realcanadiansuperstore.ca',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'SOBEYS_WEB',
        'RETAILER_WEBSITE',
        'https://www.sobeys.com',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (name)
DO UPDATE SET
    source_type = EXCLUDED.source_type,
    base_url = EXCLUDED.base_url,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- 7. INGEST BATCHES
-- ============================================================================
-- One batch per retailer/source for the data captured on 2026-10-04.

-- --------------------------------------------------------------------------
-- Save-On-Foods batch
-- --------------------------------------------------------------------------

INSERT INTO ingest_batches (
    id,
    source_system_id,
    status,
    started_at,
    completed_at,
    records_read,
    records_inserted,
    records_updated,
    records_rejected,
    source_reference
)
SELECT
    gen_random_uuid(),
    ss.id,
    'COMPLETED',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-04 12:41:21-06'::timestamptz,
    5,
    5,
    0,
    0,
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website'
FROM source_systems ss
WHERE ss.name = 'SAVE_ON_FOODS_WEB'
  AND NOT EXISTS (
      SELECT 1
      FROM ingest_batches ib
      WHERE ib.source_system_id = ss.id
        AND ib.source_reference =
            'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website'
  );


-- --------------------------------------------------------------------------
-- Real Canadian Superstore batch
-- --------------------------------------------------------------------------

INSERT INTO ingest_batches (
    id,
    source_system_id,
    status,
    started_at,
    completed_at,
    records_read,
    records_inserted,
    records_updated,
    records_rejected,
    source_reference
)
SELECT
    gen_random_uuid(),
    ss.id,
    'COMPLETED',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    5,
    5,
    0,
    0,
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.'
FROM source_systems ss
WHERE ss.name = 'REAL_CANADIAN_SUPERSTORE_WEB'
  AND NOT EXISTS (
      SELECT 1
      FROM ingest_batches ib
      WHERE ib.source_system_id = ss.id
        AND ib.source_reference =
            'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.'
  );


-- --------------------------------------------------------------------------
-- Sobeys batch
-- --------------------------------------------------------------------------

INSERT INTO ingest_batches (
    id,
    source_system_id,
    status,
    started_at,
    completed_at,
    records_read,
    records_inserted,
    records_updated,
    records_rejected,
    source_reference
)
SELECT
    gen_random_uuid(),
    ss.id,
    'COMPLETED',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-04 13:39:40-06'::timestamptz,
    5,
    5,
    0,
    0,
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.'
FROM source_systems ss
WHERE ss.name = 'SOBEYS_WEB'
  AND NOT EXISTS (
      SELECT 1
      FROM ingest_batches ib
      WHERE ib.source_system_id = ss.id
        AND ib.source_reference =
            'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.'
  );


-- ============================================================================
-- 8. TEMPORARY CANONICAL PRICE FIXTURE
-- ============================================================================
-- Exactly 15 rows = 5 products x 3 stores.

CREATE TEMP TABLE _kavyo_real_price_fixture (
    barcode          VARCHAR(64)  NOT NULL,
    retailer_name    VARCHAR(200) NOT NULL,
    store_name       VARCHAR(200) NOT NULL,
    source_name      VARCHAR(100) NOT NULL,
    batch_reference  TEXT         NOT NULL,
    regular_price    NUMERIC(10,3),
    sale_price       NUMERIC(10,3),
    currency         VARCHAR(3)   NOT NULL,
    observed_at      TIMESTAMPTZ  NOT NULL,
    valid_from       TIMESTAMPTZ,
    valid_until      TIMESTAMPTZ,
    source_record_id VARCHAR(150) NOT NULL
) ON COMMIT DROP;


-- ============================================================================
-- 8A. SAVE-ON-FOODS SETON
-- ============================================================================
-- Flyer prices valid Oct 1-7, 2026.
-- valid_until is stored as Oct 8 at 00:00, treated as EXCLUSIVE.

INSERT INTO _kavyo_real_price_fixture VALUES

-- Froot Loops 480 g
(
    '0059724101647',
    'Save-On-Foods',
    'Save-On-Foods Seton',
    'SAVE_ON_FOODS_WEB',
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website',
    8.290,
    5.490,
    'CAD',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '00059724101647'
),

-- Frosted Flakes 545 g
(
    '0059724101722',
    'Save-On-Foods',
    'Save-On-Foods Seton',
    'SAVE_ON_FOODS_WEB',
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website',
    8.290,
    5.490,
    'CAD',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '00059724101722'
),

-- Rice Krispies 560 g
(
    '0064100143135',
    'Save-On-Foods',
    'Save-On-Foods Seton',
    'SAVE_ON_FOODS_WEB',
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website',
    8.290,
    5.490,
    'CAD',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '00064100143135'
),

-- Smooth Peanut Butter 1 kg
(
    '0068100084245',
    'Save-On-Foods',
    'Save-On-Foods Seton',
    'SAVE_ON_FOODS_WEB',
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website',
    8.290,
    5.990,
    'CAD',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '00068100084245'
),

-- Two Scoops Raisin Bran 600 g
(
    '0059724101661',
    'Save-On-Foods',
    'Save-On-Foods Seton',
    'SAVE_ON_FOODS_WEB',
    'Save-On-Foods Seton flyer Oct 1-7 2026 + retailer website',
    8.290,
    5.490,
    'CAD',
    '2026-10-04 12:41:21-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '00059724101661'
);


-- ============================================================================
-- 8B. REAL CANADIAN SUPERSTORE SETON WAY
-- ============================================================================
--
-- Conditions visible on the verified Seton cart:
--
-- Rice Krispies:
--   current price = $6.99
--   limit 3
--   after limit = $7.99 each
--
-- Two Scoops Raisin Bran:
--   current price = $6.99
--   limit 3
--   after limit = $7.99 each
--
-- Kraft Smooth Peanut Butter:
--   current price = $5.97
--   limit 4
--   after limit = $6.99 each
--
-- Froot Loops / Frosted Flakes:
--   displayed at $6.99 with no separate sale/regular condition shown.
--
-- These conditions are not normalized yet; they are also retained in the
-- ingest batch source_reference above.
-- ============================================================================

INSERT INTO _kavyo_real_price_fixture VALUES

-- Froot Loops 480 g
(
    '0059724101647',
    'Real Canadian Superstore',
    'Real Canadian Superstore Seton Way',
    'REAL_CANADIAN_SUPERSTORE_WEB',
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.',
    6.990,
    NULL,
    'CAD',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    NULL::timestamptz,
    '0059724101647'
),

-- Frosted Flakes 545 g
(
    '0059724101722',
    'Real Canadian Superstore',
    'Real Canadian Superstore Seton Way',
    'REAL_CANADIAN_SUPERSTORE_WEB',
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.',
    6.990,
    NULL,
    'CAD',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    NULL::timestamptz,
    '0059724101722'
),

-- Rice Krispies 560 g
(
    '0064100143135',
    'Real Canadian Superstore',
    'Real Canadian Superstore Seton Way',
    'REAL_CANADIAN_SUPERSTORE_WEB',
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.',
    7.990,
    6.990,
    'CAD',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    NULL::timestamptz,
    '0064100143135'
),

-- Smooth Peanut Butter 1 kg
(
    '0068100084245',
    'Real Canadian Superstore',
    'Real Canadian Superstore Seton Way',
    'REAL_CANADIAN_SUPERSTORE_WEB',
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.',
    6.990,
    5.970,
    'CAD',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    NULL::timestamptz,
    '0068100084245'
),

-- Two Scoops Raisin Bran 600 g
(
    '0059724101661',
    'Real Canadian Superstore',
    'Real Canadian Superstore Seton Way',
    'REAL_CANADIAN_SUPERSTORE_WEB',
    'RCSS Seton cart 2026-10-04. TEMP promotion metadata: Rice Krispies $6.99 limit 3 then $7.99; Raisin Bran $6.99 limit 3 then $7.99; Kraft PB $5.97 limit 4 then $6.99. Promotion conditions not yet normalized.',
    7.990,
    6.990,
    'CAD',
    '2026-10-04 12:56:03-06'::timestamptz,
    '2026-10-04 12:56:03-06'::timestamptz,
    NULL::timestamptz,
    '0059724101661'
);


-- ============================================================================
-- 8C. SOBEYS MAHOGANY
-- ============================================================================
--
-- Website-confirmed prices:
--   Frosted Flakes 545 g          $8.29
--   Rice Krispies 560 g           $8.29
--   Froot Loops 480 g             $8.29
--   Two Scoops Raisin Bran 600 g  $8.29
--   Kraft Smooth Peanut Butter     $6.99 regular
--
-- Sobeys flyer:
--   Kraft Peanut Butter 750 g - 1 kg
--   sale price $5.99
--   valid Oct 1-7, 2026
-- ============================================================================

INSERT INTO _kavyo_real_price_fixture VALUES

-- Froot Loops 480 g
(
    '0059724101647',
    'Sobeys',
    'Sobeys Mahogany',
    'SOBEYS_WEB',
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.',
    8.290,
    NULL,
    'CAD',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-04 13:39:40-06'::timestamptz,
    NULL::timestamptz,
    '0059724101647'
),

-- Frosted Flakes 545 g
(
    '0059724101722',
    'Sobeys',
    'Sobeys Mahogany',
    'SOBEYS_WEB',
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.',
    8.290,
    NULL,
    'CAD',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-04 13:39:40-06'::timestamptz,
    NULL::timestamptz,
    '0059724101722'
),

-- Rice Krispies 560 g
(
    '0064100143135',
    'Sobeys',
    'Sobeys Mahogany',
    'SOBEYS_WEB',
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.',
    8.290,
    NULL,
    'CAD',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-04 13:39:40-06'::timestamptz,
    NULL::timestamptz,
    '0064100143135'
),

-- Smooth Peanut Butter 1 kg
(
    '0068100084245',
    'Sobeys',
    'Sobeys Mahogany',
    'SOBEYS_WEB',
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.',
    6.990,
    5.990,
    'CAD',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-01 00:00:00-06'::timestamptz,
    '2026-10-08 00:00:00-06'::timestamptz,
    '0068100084245'
),

-- Two Scoops Raisin Bran 600 g
(
    '0059724101661',
    'Sobeys',
    'Sobeys Mahogany',
    'SOBEYS_WEB',
    'Sobeys Mahogany website verified 2026-10-04. Kraft PB flyer sale $5.99 valid Oct 1-7 2026; website regular price $6.99.',
    8.290,
    NULL,
    'CAD',
    '2026-10-04 13:39:40-06'::timestamptz,
    '2026-10-04 13:39:40-06'::timestamptz,
    NULL::timestamptz,
    '0059724101661'
);


-- ============================================================================
-- 9. UPDATE EXISTING MATCHING FIXTURE ROWS
-- ============================================================================
-- If this exact fixture has already been inserted, normalize/update it instead
-- of adding another copy.

UPDATE price_observations po
SET
    ingest_batch_id = ib.id,
    regular_price = f.regular_price,
    sale_price = f.sale_price,
    currency = f.currency,
    observed_at = f.observed_at,
    valid_from = f.valid_from,
    valid_until = f.valid_until
FROM _kavyo_real_price_fixture f
JOIN products p
    ON p.barcode = f.barcode
JOIN stores s
    ON s.name = f.store_name
JOIN retailers r
    ON r.id = s.retailer_id
   AND r.name = f.retailer_name
JOIN source_systems ss
    ON ss.name = f.source_name
JOIN ingest_batches ib
    ON ib.source_system_id = ss.id
   AND ib.source_reference = f.batch_reference
WHERE po.product_id = p.id
  AND po.store_id = s.id
  AND po.source_system_id = ss.id
  AND po.source_record_id = f.source_record_id;


-- ============================================================================
-- 10. INSERT MISSING PRICE OBSERVATIONS
-- ============================================================================

INSERT INTO price_observations (
    id,
    product_id,
    store_id,
    source_system_id,
    ingest_batch_id,
    regular_price,
    sale_price,
    currency,
    observed_at,
    valid_from,
    valid_until,
    source_record_id,
    created_at
)
SELECT
    gen_random_uuid(),
    p.id,
    s.id,
    ss.id,
    ib.id,
    f.regular_price,
    f.sale_price,
    f.currency,
    f.observed_at,
    f.valid_from,
    f.valid_until,
    f.source_record_id,
    CURRENT_TIMESTAMP
FROM _kavyo_real_price_fixture f
JOIN products p
    ON p.barcode = f.barcode
JOIN stores s
    ON s.name = f.store_name
JOIN retailers r
    ON r.id = s.retailer_id
   AND r.name = f.retailer_name
JOIN source_systems ss
    ON ss.name = f.source_name
JOIN ingest_batches ib
    ON ib.source_system_id = ss.id
   AND ib.source_reference = f.batch_reference
WHERE NOT EXISTS (
    SELECT 1
    FROM price_observations po
    WHERE po.product_id = p.id
      AND po.store_id = s.id
      AND po.source_system_id = ss.id
      AND po.source_record_id = f.source_record_id
);


COMMIT;


-- ============================================================================
-- 11. VERIFICATION
-- ============================================================================
-- Expected:
--   product_count = 5
--   store_count   = 3
--   price_rows    = 15

SELECT
    COUNT(DISTINCT p.id) AS product_count,
    COUNT(DISTINCT s.id) AS store_count,
    COUNT(*) AS price_rows
FROM price_observations po
JOIN products p
    ON p.id = po.product_id
JOIN stores s
    ON s.id = po.store_id
JOIN source_systems ss
    ON ss.id = po.source_system_id
WHERE p.barcode IN (
    '0059724101647',
    '0059724101722',
    '0064100143135',
    '0068100084245',
    '0059724101661'
)
  AND ss.name IN (
      'SAVE_ON_FOODS_WEB',
      'REAL_CANADIAN_SUPERSTORE_WEB',
      'SOBEYS_WEB'
  )
  AND s.name IN (
      'Save-On-Foods Seton',
      'Real Canadian Superstore Seton Way',
      'Sobeys Mahogany'
  );


-- Detailed verification.
-- Expected output: 15 rows.

SELECT
    p.product_name,
    p.barcode,
    p.brand,
    p.quantity_value,
    p.quantity_unit,
    p.quantity_text,
    r.name AS retailer,
    s.name AS store,
    s.address,
    s.postal_code,
    po.regular_price,
    po.sale_price,
    po.currency,
    ss.name AS source,
    po.observed_at,
    po.valid_from,
    po.valid_until,
    po.source_record_id
FROM price_observations po
JOIN products p
    ON p.id = po.product_id
JOIN stores s
    ON s.id = po.store_id
JOIN retailers r
    ON r.id = s.retailer_id
JOIN source_systems ss
    ON ss.id = po.source_system_id
WHERE p.barcode IN (
    '0059724101647',
    '0059724101722',
    '0064100143135',
    '0068100084245',
    '0059724101661'
)
  AND ss.name IN (
      'SAVE_ON_FOODS_WEB',
      'REAL_CANADIAN_SUPERSTORE_WEB',
      'SOBEYS_WEB'
  )
  AND s.name IN (
      'Save-On-Foods Seton',
      'Real Canadian Superstore Seton Way',
      'Sobeys Mahogany'
  )
ORDER BY
    p.product_name,
    s.name;


-- ============================================================================
-- 12. EXPECTED ONE-OF-EACH BASKET REFERENCE
-- ============================================================================
--
-- SAVE-ON-FOODS SETON
--   Froot Loops               $5.49
--   Frosted Flakes            $5.49
--   Rice Krispies             $5.49
--   Smooth Peanut Butter      $5.99
--   Two Scoops Raisin Bran    $5.49
--
-- REAL CANADIAN SUPERSTORE SETON WAY
--   Froot Loops               $6.99
--   Frosted Flakes            $6.99
--   Rice Krispies             $6.99  limit 3, then $7.99
--   Smooth Peanut Butter      $5.97  limit 4, then $6.99
--   Two Scoops Raisin Bran    $6.99  limit 3, then $7.99
--
-- SOBEYS MAHOGANY
--   Froot Loops               $8.29
--   Frosted Flakes            $8.29
--   Rice Krispies             $8.29
--   Smooth Peanut Butter      $5.99 sale / $6.99 regular
--   Two Scoops Raisin Bran    $8.29
--
-- ============================================================================

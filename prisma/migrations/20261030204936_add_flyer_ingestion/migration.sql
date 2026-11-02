-- Kavyo integration: October 30 Flipp ingestion migration
-- Prerequisite: 20261024223211_add_staged_offers has already run.
-- Preserves existing staged_offers and its record_key-based unique index.

-- New Flipp flyer metadata table.
CREATE TABLE "flyers" (
    "id" UUID NOT NULL,
    "source_system_id" UUID NOT NULL,
    "retailer_id" UUID,
    "external_id" VARCHAR(100) NOT NULL,
    "merchant_id" VARCHAR(50),
    "name" VARCHAR(200) NOT NULL,
    "postal_code" VARCHAR(20),
    "locale" VARCHAR(20),
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "source_url" VARCHAR(1000),
    "thumbnail_url" VARCHAR(1000),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "flyers_pkey" PRIMARY KEY ("id")
);

-- Extend the preexisting October 24 staged_offers table; do not recreate it.
-- Preserve source_record_id VARCHAR(300), brand VARCHAR(500), advertised_price_text TEXT,
-- advertised_price_amount DECIMAL(12,3), advertised_price_unit VARCHAR(50),
-- and record_key VARCHAR(160) plus its existing unique index.
ALTER TABLE "staged_offers"
    ADD COLUMN "source_system_id" UUID,
    ADD COLUMN "flyer_id" UUID,
    ADD COLUMN "retailer_id" UUID,
    ADD COLUMN "description_text" TEXT,
    ADD COLUMN "package_size_text" VARCHAR(200),
    ADD COLUMN "quantity_value" DECIMAL(12,3),
    ADD COLUMN "quantity_unit" VARCHAR(20),
    ADD COLUMN "quantity_is_approximate" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "family" VARCHAR(80),
    ADD COLUMN "regular_price_amount" DECIMAL(10,3),
    ADD COLUMN "pricing_basis" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN "is_member_price" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "is_multibuy" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "is_multi_variant" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "is_price_range" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "unit_price" DECIMAL(12,4),
    ADD COLUMN "unit_price_basis" VARCHAR(20),
    ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    ADD COLUMN "promotion_text" TEXT,
    ADD COLUMN "valid_from" TIMESTAMPTZ(6),
    ADD COLUMN "valid_until" TIMESTAMPTZ(6),
    ADD COLUMN "observed_at" TIMESTAMPTZ(6),
    ADD COLUMN "image_url" VARCHAR(1000),
    ADD COLUMN "source_url" VARCHAR(1000),
    ADD COLUMN "match_key" VARCHAR(300),
    ADD COLUMN "family_key" VARCHAR(150),
    ADD COLUMN "matched_product_id" UUID,
    ADD COLUMN "offer_comment" TEXT;

-- Populate required provenance from the actual ingestion batch.
-- The saved source observation timestamp is used only when safely parseable as an ISO-like date.
UPDATE "staged_offers" AS so
    SET "source_system_id" = ib."source_system_id",
        "observed_at" = COALESCE(
            ib."started_at",
            so."created_at"
        )

FROM "ingest_batches" AS ib
WHERE so."ingest_batch_id" = ib."id";

-- Fail rather than silently corrupt the provenance of any existing records.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "staged_offers"
        WHERE "source_system_id" IS NULL OR "observed_at" IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot backfill source_system_id/observed_at for every staged offer';
    END IF;
END $$;

ALTER TABLE "staged_offers"
    ALTER COLUMN "source_system_id" SET NOT NULL,
    ALTER COLUMN "observed_at" SET NOT NULL,
    ALTER COLUMN "extraction_method" SET DEFAULT 'API';

CREATE INDEX "flyers_retailer_id_valid_until_idx" ON "flyers"("retailer_id", "valid_until");
CREATE UNIQUE INDEX "flyers_source_system_id_external_id_key" ON "flyers"("source_system_id", "external_id");

CREATE INDEX "staged_offers_source_system_id_source_record_id_idx" ON "staged_offers"("source_system_id", "source_record_id");
CREATE INDEX "staged_offers_retailer_id_status_idx" ON "staged_offers"("retailer_id", "status");
CREATE INDEX "staged_offers_family_unit_price_basis_idx" ON "staged_offers"("family", "unit_price_basis");
CREATE INDEX "staged_offers_match_key_idx" ON "staged_offers"("match_key");
CREATE INDEX "staged_offers_status_observed_at_idx" ON "staged_offers"("status", "observed_at");
CREATE UNIQUE INDEX "staged_offers_ingest_batch_id_source_record_id_key" ON "staged_offers"("ingest_batch_id", "source_record_id");

ALTER TABLE "flyers" ADD CONSTRAINT "flyers_source_system_id_fkey"
    FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "flyers" ADD CONSTRAINT "flyers_retailer_id_fkey"
    FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The ingest_batch foreign key already exists from the October 24 migration.
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_source_system_id_fkey"
    FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_flyer_id_fkey"
    FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_retailer_id_fkey"
    FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_matched_product_id_fkey"
    FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

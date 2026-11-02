-- CreateTable
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

-- CreateTable
CREATE TABLE "staged_offers" (
    "id" UUID NOT NULL,
    "ingest_batch_id" UUID NOT NULL,
    "source_system_id" UUID NOT NULL,
    "flyer_id" UUID NOT NULL,
    "retailer_id" UUID,
    "source_record_id" VARCHAR(150) NOT NULL,
    "retailer_name" VARCHAR(150) NOT NULL,
    "store_identifier" VARCHAR(150),
    "product_name" VARCHAR(500) NOT NULL,
    "brand" VARCHAR(200),
    "description_text" TEXT,
    "package_size_text" VARCHAR(200),
    "quantity_value" DECIMAL(12,3),
    "quantity_unit" VARCHAR(20),
    "quantity_is_approximate" BOOLEAN NOT NULL DEFAULT false,
    "family" VARCHAR(80),
    "advertised_price_text" VARCHAR(100),
    "advertised_price_amount" DECIMAL(10,3),
    "regular_price_amount" DECIMAL(10,3),
    "pricing_basis" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    "is_member_price" BOOLEAN NOT NULL DEFAULT false,
    "is_multibuy" BOOLEAN NOT NULL DEFAULT false,
    "is_multi_variant" BOOLEAN NOT NULL DEFAULT false,
    "is_price_range" BOOLEAN NOT NULL DEFAULT false,
    "unit_price" DECIMAL(12,4),
    "unit_price_basis" VARCHAR(20),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "promotion_text" TEXT,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "observed_at" TIMESTAMPTZ(6) NOT NULL,
    "image_url" VARCHAR(1000),
    "source_url" VARCHAR(1000),
    "match_key" VARCHAR(300),
    "family_key" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    "review_required" BOOLEAN NOT NULL DEFAULT true,
    "review_reasons" JSONB NOT NULL,
    "matched_product_id" UUID,
    "normalized_payload" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staged_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flyers_retailer_id_valid_until_idx" ON "flyers"("retailer_id", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "flyers_source_system_id_external_id_key" ON "flyers"("source_system_id", "external_id");

-- CreateIndex
CREATE INDEX "staged_offers_source_system_id_source_record_id_idx" ON "staged_offers"("source_system_id", "source_record_id");

-- CreateIndex
CREATE INDEX "staged_offers_retailer_id_status_idx" ON "staged_offers"("retailer_id", "status");

-- CreateIndex
CREATE INDEX "staged_offers_family_unit_price_basis_idx" ON "staged_offers"("family", "unit_price_basis");

-- CreateIndex
CREATE INDEX "staged_offers_match_key_idx" ON "staged_offers"("match_key");

-- CreateIndex
CREATE INDEX "staged_offers_status_observed_at_idx" ON "staged_offers"("status", "observed_at");

-- CreateIndex
CREATE UNIQUE INDEX "staged_offers_ingest_batch_id_source_record_id_key" ON "staged_offers"("ingest_batch_id", "source_record_id");

-- AddForeignKey
ALTER TABLE "flyers" ADD CONSTRAINT "flyers_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flyers" ADD CONSTRAINT "flyers_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_ingest_batch_id_fkey" FOREIGN KEY ("ingest_batch_id") REFERENCES "ingest_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_matched_product_id_fkey" FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "barcode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "product_evidence" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "source_system_id" UUID NOT NULL,
    "source_record_id" VARCHAR(300) NOT NULL,
    "evidence_type" VARCHAR(40) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_payload" JSONB,

    CONSTRAINT "product_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertised_offers" (
    "id" UUID NOT NULL,
    "stable_key" VARCHAR(64) NOT NULL,
    "source_system_id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "store_id" UUID,
    "product_id" UUID,
    "flyer_id" UUID,
    "flyer_external_id" VARCHAR(100) NOT NULL,
    "source_record_id" VARCHAR(300) NOT NULL,
    "market_key" VARCHAR(60) NOT NULL,
    "product_name" VARCHAR(500) NOT NULL,
    "package_size_text" VARCHAR(200),
    "advertised_price_amount" DECIMAL(12,3),
    "regular_price_amount" DECIMAL(12,3),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "promotion_text" TEXT,
    "condition_evidence" JSONB,
    "source_url" VARCHAR(1000),
    "raw_payload" JSONB,
    "observed_at" TIMESTAMPTZ(6) NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advertised_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_evidence_product_id_captured_at_idx" ON "product_evidence"("product_id", "captured_at");

-- CreateIndex
CREATE INDEX "product_evidence_source_system_id_source_record_id_idx" ON "product_evidence"("source_system_id", "source_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "advertised_offers_stable_key_key" ON "advertised_offers"("stable_key");

-- CreateIndex
CREATE INDEX "advertised_offers_retailer_id_valid_until_idx" ON "advertised_offers"("retailer_id", "valid_until");

-- CreateIndex
CREATE INDEX "advertised_offers_product_id_valid_until_idx" ON "advertised_offers"("product_id", "valid_until");

-- CreateIndex
CREATE INDEX "advertised_offers_source_system_id_flyer_external_id_source_idx" ON "advertised_offers"("source_system_id", "flyer_external_id", "source_record_id");

-- AddForeignKey
ALTER TABLE "product_evidence" ADD CONSTRAINT "product_evidence_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_evidence" ADD CONSTRAINT "product_evidence_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertised_offers" ADD CONSTRAINT "advertised_offers_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertised_offers" ADD CONSTRAINT "advertised_offers_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertised_offers" ADD CONSTRAINT "advertised_offers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertised_offers" ADD CONSTRAINT "advertised_offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertised_offers" ADD CONSTRAINT "advertised_offers_flyer_id_fkey" FOREIGN KEY ("flyer_id") REFERENCES "flyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

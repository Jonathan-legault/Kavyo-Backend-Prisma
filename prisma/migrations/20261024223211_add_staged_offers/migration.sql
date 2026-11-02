-- CreateTable
CREATE TABLE "staged_offers" (
    "id" UUID NOT NULL,
    "ingest_batch_id" UUID NOT NULL,
    "record_key" VARCHAR(160) NOT NULL,
    "source_record_id" VARCHAR(300),
    "source_reference" TEXT,
    "retailer_name" VARCHAR(150) NOT NULL,
    "store_identifier" VARCHAR(150),
    "applicability" VARCHAR(200),
    "product_name" VARCHAR(500) NOT NULL,
    "brand" VARCHAR(500),
    "advertised_price_text" TEXT,
    "advertised_price_amount" DECIMAL(12,3),
    "advertised_price_unit" VARCHAR(50),
    "extraction_method" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    "review_required" BOOLEAN NOT NULL DEFAULT true,
    "review_reasons" JSONB NOT NULL,
    "normalized_payload" JSONB NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staged_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staged_offers_ingest_batch_id_status_idx" ON "staged_offers"("ingest_batch_id", "status");

-- CreateIndex
CREATE INDEX "staged_offers_retailer_name_idx" ON "staged_offers"("retailer_name");

-- CreateIndex
CREATE INDEX "staged_offers_status_idx" ON "staged_offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staged_offers_ingest_batch_id_record_key_key" ON "staged_offers"("ingest_batch_id", "record_key");

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_ingest_batch_id_fkey" FOREIGN KEY ("ingest_batch_id") REFERENCES "ingest_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

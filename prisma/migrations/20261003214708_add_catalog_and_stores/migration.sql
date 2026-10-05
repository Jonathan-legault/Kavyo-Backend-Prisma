-- CreateTable
CREATE TABLE "source_systems" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "base_url" VARCHAR(500),
    "license_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "source_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_batches" (
    "id" UUID NOT NULL,
    "source_system_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "records_read" INTEGER NOT NULL DEFAULT 0,
    "records_inserted" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "source_reference" VARCHAR(500),
    "error_message" TEXT,

    CONSTRAINT "ingest_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_observations" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "source_system_id" UUID NOT NULL,
    "ingest_batch_id" UUID,
    "regular_price" DECIMAL(10,3),
    "sale_price" DECIMAL(10,3),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "observed_at" TIMESTAMPTZ(6) NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "source_record_id" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_systems_name_key" ON "source_systems"("name");

-- CreateIndex
CREATE INDEX "ingest_batches_source_system_id_idx" ON "ingest_batches"("source_system_id");

-- CreateIndex
CREATE INDEX "ingest_batches_status_idx" ON "ingest_batches"("status");

-- CreateIndex
CREATE INDEX "ingest_batches_started_at_idx" ON "ingest_batches"("started_at");

-- CreateIndex
CREATE INDEX "price_observations_product_id_idx" ON "price_observations"("product_id");

-- CreateIndex
CREATE INDEX "price_observations_store_id_idx" ON "price_observations"("store_id");

-- CreateIndex
CREATE INDEX "price_observations_source_system_id_idx" ON "price_observations"("source_system_id");

-- CreateIndex
CREATE INDEX "price_observations_ingest_batch_id_idx" ON "price_observations"("ingest_batch_id");

-- CreateIndex
CREATE INDEX "price_observations_observed_at_idx" ON "price_observations"("observed_at");

-- CreateIndex
CREATE INDEX "price_observations_product_id_store_id_observed_at_idx" ON "price_observations"("product_id", "store_id", "observed_at");

-- AddForeignKey
ALTER TABLE "ingest_batches" ADD CONSTRAINT "ingest_batches_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_ingest_batch_id_fkey" FOREIGN KEY ("ingest_batch_id") REFERENCES "ingest_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

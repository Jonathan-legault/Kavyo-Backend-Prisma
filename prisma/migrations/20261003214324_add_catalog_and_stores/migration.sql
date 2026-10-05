-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "barcode" VARCHAR(64) NOT NULL,
    "product_name" VARCHAR(500) NOT NULL,
    "brand" VARCHAR(500),
    "quantity_value" DECIMAL(12,3),
    "quantity_unit" VARCHAR(30),
    "quantity_text" VARCHAR(150),
    "categories" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "website" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "retailer_id" UUID NOT NULL,
    "name" VARCHAR(200),
    "address" VARCHAR(300),
    "city" VARCHAR(100),
    "province" VARCHAR(50),
    "postal_code" VARCHAR(20),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_product_name_idx" ON "products"("product_name");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "retailers_name_key" ON "retailers"("name");

-- CreateIndex
CREATE INDEX "stores_retailer_id_idx" ON "stores"("retailer_id");

-- CreateIndex
CREATE INDEX "stores_city_idx" ON "stores"("city");

-- CreateIndex
CREATE INDEX "stores_postal_code_idx" ON "stores"("postal_code");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "catalog_key" VARCHAR(300),
ALTER COLUMN "barcode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staged_offers" ADD COLUMN     "conditions_text" TEXT,
ADD COLUMN     "member_price_amount" DECIMAL(10,3),
ADD COLUMN     "member_program" VARCHAR(100),
ADD COLUMN     "non_member_price_amount" DECIMAL(10,3),
ADD COLUMN     "price_max_amount" DECIMAL(10,3),
ADD COLUMN     "price_min_amount" DECIMAL(10,3),
ADD COLUMN     "promotion_conditions" JSONB,
ADD COLUMN     "promotion_quantity" INTEGER,
ADD COLUMN     "promotion_total_price" DECIMAL(10,3),
ADD COLUMN     "promotion_type" VARCHAR(30) NOT NULL DEFAULT 'NONE',
ADD COLUMN     "promotion_unit_price" DECIMAL(10,4),
ADD COLUMN     "review_decision" VARCHAR(30),
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "reviewed_by_user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "products_catalog_key_key" ON "products"("catalog_key");

-- CreateIndex
CREATE INDEX "staged_offers_promotion_type_idx" ON "staged_offers"("promotion_type");

-- CreateIndex
CREATE INDEX "staged_offers_review_decision_reviewed_at_idx" ON "staged_offers"("review_decision", "reviewed_at");

-- AddForeignKey
ALTER TABLE "staged_offers" ADD CONSTRAINT "staged_offers_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

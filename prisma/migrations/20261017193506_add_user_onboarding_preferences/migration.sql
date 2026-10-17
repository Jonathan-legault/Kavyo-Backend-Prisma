-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('DRIVING', 'TRANSIT', 'WALKING', 'CYCLING');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "household_size" INTEGER,
ADD COLUMN     "postal_code" VARCHAR(20),
ADD COLUMN     "transport_mode" "TransportMode";

-- CreateIndex
CREATE INDEX "user_preferences_postal_code_idx" ON "user_preferences"("postal_code");

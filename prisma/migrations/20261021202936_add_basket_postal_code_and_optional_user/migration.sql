-- AlterTable
ALTER TABLE "baskets" ADD COLUMN     "postal_code" VARCHAR(20),
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateEnum
CREATE TYPE "ProductSourceType" AS ENUM ('OWN_STOCK', 'DROPSHIPPING');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "sourceType" "ProductSourceType" NOT NULL DEFAULT 'DROPSHIPPING';
ALTER TABLE "products" ADD COLUMN "stockDisplayName" TEXT;
ALTER TABLE "products" ADD COLUMN "stockSortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill from trackStock before dropping it
UPDATE "products" SET "sourceType" = 'OWN_STOCK' WHERE "trackStock" = true;

-- DropColumn
ALTER TABLE "products" DROP COLUMN "trackStock";

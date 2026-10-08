-- Custo por variação: as vendas da Shopee passam a ser por variação vendida. As vendas atuais não
-- guardaram a variação, então são apagadas e o próximo sync reimporta os pedidos (desde 01/10/2026).
DELETE FROM "sales" WHERE "origin" = 'SHOPEE';
UPDATE "shopee_shops" SET "lastOrderSyncAt" = NULL;

-- DropIndex
DROP INDEX "sales_shopeeOrderSn_productId_key";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopeeUpdateTime" INTEGER;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "variationId" TEXT;

-- CreateTable
CREATE TABLE "product_variations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shopeeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "shopeeSku" TEXT,
    "costGroupId" TEXT,
    "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variations_shopeeKey_key" ON "product_variations"("shopeeKey");

-- CreateIndex
CREATE INDEX "product_variations_productId_idx" ON "product_variations"("productId");

-- CreateIndex
CREATE INDEX "product_variations_costGroupId_idx" ON "product_variations"("costGroupId");

-- CreateIndex
CREATE INDEX "sales_variationId_idx" ON "sales"("variationId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_shopeeOrderSn_variationId_key" ON "sales"("shopeeOrderSn", "variationId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "product_variations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_costGroupId_fkey" FOREIGN KEY ("costGroupId") REFERENCES "cost_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;


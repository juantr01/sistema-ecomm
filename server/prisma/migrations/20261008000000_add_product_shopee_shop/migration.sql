-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopeeShopId" TEXT;

-- CreateIndex
CREATE INDEX "products_shopeeShopId_idx" ON "products"("shopeeShopId");

-- Produtos já sincronizados vieram da única loja conectada até aqui (a primeira)
UPDATE "products"
SET "shopeeShopId" = (SELECT "shopId" FROM "shopee_shops" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "shopeeItemId" IS NOT NULL;

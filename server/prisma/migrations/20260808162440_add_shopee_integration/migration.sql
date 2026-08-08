-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopeeItemId" TEXT,
ADD COLUMN     "shopeeModelId" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "shopeeOrderSn" TEXT;

-- CreateTable
CREATE TABLE "shopee_shops" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastProductSyncAt" TIMESTAMP(3),
    "lastOrderSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopee_shops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopee_shops_shopId_key" ON "shopee_shops"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "products_shopeeItemId_key" ON "products"("shopeeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_shopeeOrderSn_productId_key" ON "sales"("shopeeOrderSn", "productId");


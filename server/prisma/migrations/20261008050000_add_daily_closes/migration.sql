-- CreateTable
CREATE TABLE "daily_closes" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "shopId" TEXT NOT NULL DEFAULT '',
    "revenue" DECIMAL(12,2) NOT NULL,
    "profit" DECIMAL(12,2) NOT NULL,
    "orders" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_closes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_closes_date_shopId_key" ON "daily_closes"("date", "shopId");

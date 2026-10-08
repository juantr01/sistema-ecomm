-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costGroupId" TEXT;

-- CreateTable
CREATE TABLE "cost_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_costGroupId_idx" ON "products"("costGroupId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_costGroupId_fkey" FOREIGN KEY ("costGroupId") REFERENCES "cost_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

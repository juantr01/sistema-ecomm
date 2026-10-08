-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopeeSku" TEXT;

-- Reconstrução dos dados da Shopee: o sync antigo juntava anúncios com o mesmo SKU num único
-- produto, e não há como separar de volta. Apaga o que veio da Shopee e zera as datas de sync
-- para o próximo sync trazer tudo de novo, agora com um produto por anúncio.
DELETE FROM "sales" WHERE "origin" = 'SHOPEE';

-- Produtos da Shopee sem uso manual são apagados; os que têm venda manual, compra ou
-- movimentação de estoque são mantidos como produtos manuais (desvinculados da Shopee)
DELETE FROM "products" p
WHERE p."shopeeItemId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "sales" s WHERE s."productId" = p."id")
  AND NOT EXISTS (SELECT 1 FROM "purchase_items" pi WHERE pi."productId" = p."id")
  AND NOT EXISTS (SELECT 1 FROM "stock_movements" sm WHERE sm."productId" = p."id");

UPDATE "products" SET "shopeeItemId" = NULL, "shopeeShopId" = NULL WHERE "shopeeItemId" IS NOT NULL;

UPDATE "shopee_shops" SET "lastProductSyncAt" = NULL, "lastOrderSyncAt" = NULL;

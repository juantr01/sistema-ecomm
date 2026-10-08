-- Pedido do usuário: remover os produtos cadastrados à mão (sem loja Shopee).
-- Sem nenhum vínculo são apagados; com venda, compra ou movimentação de estoque são arquivados,
-- para não apagar esses registros junto.
DELETE FROM "products" p
WHERE p."shopeeShopId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "sales" s WHERE s."productId" = p."id")
  AND NOT EXISTS (SELECT 1 FROM "purchase_items" pi WHERE pi."productId" = p."id")
  AND NOT EXISTS (SELECT 1 FROM "stock_movements" sm WHERE sm."productId" = p."id");

UPDATE "products" SET "active" = false WHERE "shopeeShopId" IS NULL;

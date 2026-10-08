import { ShopeeShop } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { buildShopeeUrl } from "../utils/shopeeSign";

const ORDER_LIST_WINDOW_DAYS = 15;
// Vendas da Shopee só contam a partir do início do uso do sistema (01/10/2026, horário de Brasília)
const ORDERS_START = Math.floor(new Date("2026-10-01T00:00:00-03:00").getTime() / 1000);

async function shopeeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AppError(`Resposta inválida da API da Shopee (HTTP ${res.status})`, 502);
  }
  if (data?.error) {
    throw new AppError(`Erro na API da Shopee (${data.error}): ${data.message ?? "sem detalhes"}`, 502);
  }
  return data as T;
}

export async function getAuthorizationUrl(): Promise<string> {
  return buildShopeeUrl("/api/v2/shop/auth_partner", { redirect: env.shopeeRedirectUrl });
}

export async function handleOAuthCallback(code: string, shopId: string) {
  const url = buildShopeeUrl("/api/v2/auth/token/get", {});
  const data = await shopeeFetch<{ access_token: string; refresh_token: string; expire_in: number }>(url, {
    method: "POST",
    body: JSON.stringify({ code, shop_id: Number(shopId), partner_id: Number(env.shopeePartnerId) }),
  });

  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + data.expire_in * 1000);
  const refreshTokenExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);

  let shopName: string | undefined;
  try {
    const infoUrl = buildShopeeUrl("/api/v2/shop/get_shop_info", {}, { accessToken: data.access_token, shopId });
    const info = await shopeeFetch<{ shop_name?: string }>(infoUrl);
    shopName = info.shop_name;
  } catch {
    // não bloqueia a conexão se o nome da loja não vier
  }

  return prisma.shopeeShop.upsert({
    where: { shopId },
    create: {
      shopId,
      shopName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    },
    update: {
      shopName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    },
  });
}

async function listShops() {
  return prisma.shopeeShop.findMany({ orderBy: { createdAt: "asc" } });
}

async function getValidAccessToken(shop: { shopId: string; accessToken: string; refreshToken: string; accessTokenExpiresAt: Date }): Promise<string> {
  const bufferMs = 5 * 60 * 1000;
  if (shop.accessTokenExpiresAt.getTime() - bufferMs > Date.now()) {
    return shop.accessToken;
  }

  const url = buildShopeeUrl("/api/v2/auth/access_token/get", {});
  const data = await shopeeFetch<{ access_token: string; refresh_token: string; expire_in: number }>(url, {
    method: "POST",
    body: JSON.stringify({ refresh_token: shop.refreshToken, shop_id: Number(shop.shopId), partner_id: Number(env.shopeePartnerId) }),
  });

  const accessTokenExpiresAt = new Date(Date.now() + data.expire_in * 1000);
  await prisma.shopeeShop.update({
    where: { shopId: shop.shopId },
    data: { accessToken: data.access_token, refreshToken: data.refresh_token, accessTokenExpiresAt },
  });

  return data.access_token;
}

// Um produto por anúncio: o item_id é único em toda a Shopee. O SKU da Shopee pode se repetir entre
// anúncios (ex.: o tipo do produto), então fica em shopeeSku e o sku do sistema é gerado do item_id.
function systemSku(shopeeItemId: string) {
  return `shopee-${shopeeItemId}`;
}

async function findShopeeProduct(shopeeItemId: string) {
  return (
    (await prisma.product.findUnique({ where: { shopeeItemId } })) ??
    // produto que já foi deste anúncio e ficou desvinculado (ex.: reconstrução dos dados)
    (await prisma.product.findUnique({ where: { sku: systemSku(shopeeItemId) } }))
  );
}

// Foto principal do anúncio; nunca substitui uma imagem que o usuário enviou (R2)
function shopeeImageUpdate(currentImageUrl: string | null, shopeeImageUrl?: string) {
  if (!shopeeImageUrl || currentImageUrl?.startsWith(env.r2PublicUrl)) return undefined;
  return shopeeImageUrl;
}

// Cada variação do anúncio tem o seu custo; anúncio sem variações usa o modelo 0
function variationKey(itemId: string | number, modelId: string | number) {
  return `${itemId}:${modelId}`;
}

interface VariationInfo {
  key: string;
  name: string;
  sku: string | null;
}

// Variação nova herda o grupo de custo do produto (grupos montados antes do custo por variação)
async function upsertVariation(product: { id: string; costGroupId: string | null }, variation: VariationInfo) {
  const group = product.costGroupId ? await prisma.costGroup.findUnique({ where: { id: product.costGroupId } }) : null;
  return prisma.productVariation.upsert({
    where: { shopeeKey: variation.key },
    create: {
      productId: product.id,
      shopeeKey: variation.key,
      name: variation.name,
      shopeeSku: variation.sku,
      costGroupId: group?.id,
      costPrice: group?.cost ?? 0,
    },
    update: { productId: product.id, name: variation.name, shopeeSku: variation.sku, active: true },
  });
}

interface ShopeeItemBaseInfo {
  item_id: number;
  item_name: string;
  item_sku?: string;
  price_info?: { current_price?: number; original_price?: number }[];
  image?: { image_url_list?: string[] };
  has_model?: boolean;
  update_time?: number;
}

interface ShopeeModelList {
  tier_variation?: { name?: string; option_list?: { option?: string }[] }[];
  model?: { model_id: number; model_sku?: string; tier_index?: number[] }[];
}

async function fetchVariations(accessToken: string, shopId: string, item: ShopeeItemBaseInfo): Promise<VariationInfo[]> {
  if (!item.has_model) {
    return [{ key: variationKey(item.item_id, 0), name: "", sku: item.item_sku?.trim() || null }];
  }
  const url = buildShopeeUrl("/api/v2/product/get_model_list", { item_id: item.item_id }, { accessToken, shopId });
  const data = await shopeeFetch<{ response?: ShopeeModelList }>(url);
  const tiers = data.response?.tier_variation ?? [];
  return (data.response?.model ?? []).map((model) => ({
    key: variationKey(item.item_id, model.model_id),
    // tier_index aponta a opção escolhida em cada nível (ex.: Cor → "Preto", Tamanho → "8 anos")
    name: (model.tier_index ?? [])
      .map((optionIndex, tier) => tiers[tier]?.option_list?.[optionIndex]?.option ?? "")
      .filter(Boolean)
      .join(" / "),
    sku: model.model_sku?.trim() || item.item_sku?.trim() || null,
  }));
}

// Variações que sumiram do anúncio ficam inativas (as vendas antigas continuam ligadas a elas)
async function syncProductVariations(product: { id: string; costGroupId: string | null }, variations: VariationInfo[]) {
  if (!variations.length) return;
  for (const variation of variations) {
    await upsertVariation(product, variation);
  }
  await prisma.productVariation.updateMany({
    where: { productId: product.id, shopeeKey: { notIn: variations.map((v) => v.key) } },
    data: { active: false },
  });
}

async function syncProducts(shop: ShopeeShop) {
  const accessToken = await getValidAccessToken(shop);

  const itemIds: number[] = [];
  let offset = 0;
  const pageSize = 50;
  while (true) {
    const url = buildShopeeUrl(
      "/api/v2/product/get_item_list",
      { offset, page_size: pageSize, item_status: "NORMAL" },
      { accessToken, shopId: shop.shopId }
    );
    // A Shopee omite `item` quando a loja não tem produtos
    const data = await shopeeFetch<{ response?: { item?: { item_id: number }[]; has_next_page?: boolean; next_offset: number } }>(url);
    itemIds.push(...(data.response?.item ?? []).map((i) => i.item_id));
    if (!data.response?.has_next_page) break;
    offset = data.response.next_offset;
  }

  let created = 0;
  let updated = 0;

  for (let i = 0; i < itemIds.length; i += 50) {
    const batch = itemIds.slice(i, i + 50);
    const url = buildShopeeUrl(
      "/api/v2/product/get_item_base_info",
      { item_id_list: batch.join(",") },
      { accessToken, shopId: shop.shopId }
    );
    const data = await shopeeFetch<{ response?: { item_list?: ShopeeItemBaseInfo[] } }>(url);

    for (const item of data.response?.item_list ?? []) {
      const shopeeItemId = String(item.item_id);
      const price = item.price_info?.[0]?.current_price ?? item.price_info?.[0]?.original_price ?? 0;
      const shopeeSku = item.item_sku?.trim() || null;
      const imageUrl = item.image?.image_url_list?.[0];

      const existing = await findShopeeProduct(shopeeItemId);
      let product;

      if (existing) {
        product = await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.item_name,
            salePrice: price,
            shopeeItemId,
            shopeeShopId: shop.shopId,
            shopeeSku,
            imageUrl: shopeeImageUpdate(existing.imageUrl, imageUrl),
          },
        });
        updated++;
      } else {
        product = await prisma.product.create({
          data: {
            name: item.item_name,
            sku: systemSku(shopeeItemId),
            salePrice: price,
            shopeeItemId,
            shopeeShopId: shop.shopId,
            shopeeSku,
            imageUrl,
          },
        });
        created++;
      }

      // Buscar as variações custa uma chamada por anúncio; só repete quando o anúncio mudou
      const unchanged =
        item.update_time !== undefined &&
        product.shopeeUpdateTime === item.update_time &&
        (await prisma.productVariation.count({ where: { productId: product.id } })) > 0;
      if (!unchanged) {
        await syncProductVariations(product, await fetchVariations(accessToken, shop.shopId, item));
        await prisma.product.update({ where: { id: product.id }, data: { shopeeUpdateTime: item.update_time ?? null } });
      }
    }
  }

  await prisma.shopeeShop.update({ where: { shopId: shop.shopId }, data: { lastProductSyncAt: new Date() } });

  return { created, updated };
}

interface ShopeeOrderLineItem {
  item_id: number;
  item_name: string;
  item_sku?: string;
  model_id?: number;
  model_name?: string;
  model_sku?: string;
  model_quantity_purchased: number;
  model_discounted_price: number;
  image_info?: { image_url?: string };
}

interface ShopeeOrderDetail {
  order_sn: string;
  order_status: string;
  create_time: number;
  total_amount: number;
  item_list: ShopeeOrderLineItem[];
}

// Pedidos não pagos ainda não são venda; cancelados/devolvidos deixam de ser
const IGNORED_ORDER_STATUSES = new Set(["UNPAID"]);
const VOIDED_ORDER_STATUSES = new Set(["IN_CANCEL", "CANCELLED", "TO_RETURN"]);

async function fetchOrderSnsInWindow(accessToken: string, shopId: string, timeFrom: number, timeTo: number): Promise<string[]> {
  const orderSns: string[] = [];
  let cursor = "";
  while (true) {
    const url = buildShopeeUrl(
      "/api/v2/order/get_order_list",
      {
        time_range_field: "update_time",
        time_from: timeFrom,
        time_to: timeTo,
        page_size: 50,
        cursor,
      },
      { accessToken, shopId }
    );
    const data = await shopeeFetch<{ response?: { order_list?: { order_sn: string }[]; next_cursor: string; more?: boolean } }>(url);
    orderSns.push(...(data.response?.order_list ?? []).map((o) => o.order_sn));
    if (!data.response?.more) break;
    cursor = data.response.next_cursor;
  }
  return orderSns;
}

async function fetchOrderNetAmount(accessToken: string, shopId: string, orderSn: string, grossFallback: number): Promise<number> {
  try {
    const url = buildShopeeUrl("/api/v2/payment/get_escrow_detail", { order_sn: orderSn }, { accessToken, shopId });
    const data = await shopeeFetch<{ response: { order_income?: { escrow_amount?: number } } }>(url);
    const net = data.response.order_income?.escrow_amount;
    return typeof net === "number" ? net : grossFallback;
  } catch {
    return grossFallback;
  }
}

async function findOrCreateProductFromOrder(
  shopId: string,
  itemId: number,
  line: { name: string; sku?: string; unitPrice: number; imageUrl?: string }
) {
  const shopeeItemId = String(itemId);
  const shopeeSku = line.sku?.trim() || null;
  const existing = await findShopeeProduct(shopeeItemId);
  if (existing) {
    if (!existing.shopeeItemId || !existing.shopeeShopId || !existing.imageUrl) {
      return prisma.product.update({
        where: { id: existing.id },
        data: { shopeeItemId, shopeeShopId: shopId, shopeeSku, imageUrl: shopeeImageUpdate(existing.imageUrl, line.imageUrl) },
      });
    }
    return existing;
  }
  return prisma.product.create({
    data: {
      name: line.name,
      sku: systemSku(shopeeItemId),
      salePrice: line.unitPrice,
      shopeeItemId,
      shopeeShopId: shopId,
      shopeeSku,
      imageUrl: line.imageUrl,
    },
  });
}

// Variação que ainda não veio no sync de produtos (anúncio pausado/excluído ou alterado depois)
async function findOrCreateVariationFromOrder(product: { id: string; costGroupId: string | null }, variation: VariationInfo) {
  return (await prisma.productVariation.findUnique({ where: { shopeeKey: variation.key } })) ?? upsertVariation(product, variation);
}

async function syncOrders(shop: ShopeeShop) {
  const accessToken = await getValidAccessToken(shop);

  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = ORDER_LIST_WINDOW_DAYS * 24 * 60 * 60;
  // Sempre revisa ao menos a última janela, para pegar pedidos em andamento que mudaram de valor/status
  const overallFrom = shop.lastOrderSyncAt
    ? Math.min(Math.floor(shop.lastOrderSyncAt.getTime() / 1000), now - windowSeconds)
    : ORDERS_START;

  const orderSns: string[] = [];
  for (let windowStart = overallFrom; windowStart < now; windowStart += windowSeconds) {
    const windowEnd = Math.min(windowStart + windowSeconds, now);
    orderSns.push(...(await fetchOrderSnsInWindow(accessToken, shop.shopId, windowStart, windowEnd)));
  }

  // A lista pode repetir pedidos entre janelas
  const uniqueOrderSns = [...new Set(orderSns)];

  let created = 0;
  let updated = 0;
  let removed = 0;
  // Pedidos que a Shopee listou mas não viraram venda, com o motivo (para conferência)
  const skipped: { orderSn: string; reason: string }[] = [];

  for (let i = 0; i < uniqueOrderSns.length; i += 50) {
    const batch = uniqueOrderSns.slice(i, i + 50);
    const url = buildShopeeUrl(
      "/api/v2/order/get_order_detail",
      { order_sn_list: batch.join(","), response_optional_fields: "item_list,total_amount" },
      { accessToken, shopId: shop.shopId }
    );
    const data = await shopeeFetch<{ response?: { order_list?: ShopeeOrderDetail[] } }>(url);

    for (const order of data.response?.order_list ?? []) {
      // A lista é por data de atualização; pedido feito antes do início não entra
      if (order.create_time < ORDERS_START) continue;

      if (IGNORED_ORDER_STATUSES.has(order.order_status)) {
        skipped.push({ orderSn: order.order_sn, reason: "aguardando pagamento" });
        continue;
      }

      if (VOIDED_ORDER_STATUSES.has(order.order_status)) {
        const result = await prisma.sale.deleteMany({ where: { shopeeOrderSn: order.order_sn } });
        removed += result.count;
        continue;
      }

      // O valor bruto do pedido inclui taxas da plataforma; usamos o repasse líquido (escrow)
      // para refletir o que realmente cai na conta, mesma regra das vendas manuais.
      // Antes de o pedido ser concluído o escrow é uma estimativa; os próximos syncs atualizam o valor.
      const netAmount = await fetchOrderNetAmount(accessToken, shop.shopId, order.order_sn, order.total_amount);
      const itemList = order.item_list ?? [];
      const grossTotal = itemList.reduce((sum, it) => sum + it.model_discounted_price * it.model_quantity_purchased, 0) || order.total_amount;

      // Uma venda por variação do pedido (unique em shopeeOrderSn + variationId)
      const linesByVariation = new Map<
        string,
        { itemId: number; quantity: number; gross: number; name: string; sku?: string; unitPrice: number; imageUrl?: string; variation: VariationInfo }
      >();
      for (const line of itemList) {
        const key = variationKey(line.item_id, line.model_id ?? 0);
        const acc = linesByVariation.get(key) ?? {
          itemId: line.item_id,
          quantity: 0,
          gross: 0,
          name: line.item_name,
          sku: line.item_sku,
          unitPrice: line.model_discounted_price,
          imageUrl: line.image_info?.image_url,
          variation: { key, name: line.model_name?.trim() ?? "", sku: line.model_sku?.trim() || line.item_sku?.trim() || null },
        };
        acc.quantity += line.model_quantity_purchased;
        acc.gross += line.model_discounted_price * line.model_quantity_purchased;
        linesByVariation.set(key, acc);
      }

      for (const line of linesByVariation.values()) {
        // Anúncios pausados/excluídos não vêm no sync de produtos; cria o produto a partir do pedido
        const product = await findOrCreateProductFromOrder(shop.shopId, line.itemId, line);
        const variation = await findOrCreateVariationFromOrder(product, line.variation);

        const lineNet = grossTotal > 0 ? netAmount * (line.gross / grossTotal) : 0;
        const where = { shopeeOrderSn_variationId: { shopeeOrderSn: order.order_sn, variationId: variation.id } };
        const existing = await prisma.sale.findUnique({ where });

        if (existing) {
          await prisma.sale.update({
            where,
            data: {
              quantity: line.quantity,
              totalAmount: lineNet,
              profit: lineNet - Number(existing.unitCostAtSale) * line.quantity,
            },
          });
          updated++;
        } else {
          await prisma.sale.create({
            data: {
              productId: product.id,
              variationId: variation.id,
              quantity: line.quantity,
              totalAmount: lineNet,
              unitCostAtSale: variation.costPrice,
              profit: lineNet - Number(variation.costPrice) * line.quantity,
              origin: "SHOPEE",
              shopeeOrderSn: order.order_sn,
              saleDate: new Date(order.create_time * 1000),
            },
          });
          created++;
        }
      }
    }
  }

  await prisma.shopeeShop.update({ where: { shopId: shop.shopId }, data: { lastOrderSyncAt: new Date() } });

  return { found: uniqueOrderSns.length, created, updated, removed, skipped };
}

// Um sync por vez: clique repetido, ou o sync automático da 00:00 junto com um manual,
// duplicaria o trabalho e poderia criar registros em dobro
let syncRunning = false;

export function isSyncRunning() {
  return syncRunning;
}

export async function syncAllShops() {
  if (syncRunning) {
    throw new AppError("Já existe uma sincronização em andamento. Aguarde alguns minutos e tente de novo.", 409);
  }
  syncRunning = true;
  try {
    return await runSyncAllShops();
  } finally {
    syncRunning = false;
  }
}

// Sincroniza todas as lojas; se uma falhar (ex.: autorização expirada), as outras continuam
async function runSyncAllShops() {
  const shops = await listShops();
  if (!shops.length) {
    throw new AppError("Nenhuma loja Shopee conectada", 400);
  }

  const products = { created: 0, updated: 0 };
  const orders = { found: 0, created: 0, updated: 0, removed: 0, skipped: [] as { orderSn: string; reason: string }[] };
  const failures: { shopName: string; message: string }[] = [];

  for (const shop of shops) {
    try {
      const p = await syncProducts(shop);
      const o = await syncOrders(shop);
      products.created += p.created;
      products.updated += p.updated;
      orders.found += o.found;
      orders.created += o.created;
      orders.updated += o.updated;
      orders.removed += o.removed;
      orders.skipped.push(...o.skipped);
    } catch (err) {
      console.error(`Falha ao sincronizar a loja Shopee ${shop.shopId}:`, err);
      failures.push({ shopName: shop.shopName ?? shop.shopId, message: err instanceof AppError ? err.message : "erro inesperado" });
    }
  }

  if (failures.length === shops.length) {
    throw new AppError(failures.map((f) => `${f.shopName}: ${f.message}`).join("; "), 502);
  }

  return { products, orders, failures };
}

// Remove só a autorização da loja; produtos e vendas já sincronizados são mantidos
export async function disconnect(shopId: string) {
  const result = await prisma.shopeeShop.deleteMany({ where: { shopId } });
  if (!result.count) {
    throw new AppError("Loja Shopee não encontrada", 404);
  }
}

export async function getStatus() {
  const shops = await prisma.shopeeShop.findMany({
    select: { shopId: true, shopName: true, lastProductSyncAt: true, lastOrderSyncAt: true },
    orderBy: { createdAt: "asc" },
  });
  return { connected: shops.length > 0, shops };
}

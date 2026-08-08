import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { buildShopeeUrl } from "../utils/shopeeSign";

const ORDER_LIST_WINDOW_DAYS = 15;
const DEFAULT_LOOKBACK_DAYS = 90;

async function shopeeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = (await res.json()) as any;
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

export async function getConnectedShop() {
  return prisma.shopeeShop.findFirst({ orderBy: { createdAt: "desc" } });
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

async function requireConnectedShop() {
  const shop = await getConnectedShop();
  if (!shop) {
    throw new AppError("Nenhuma loja Shopee conectada", 400);
  }
  return shop;
}

interface ShopeeItemBaseInfo {
  item_id: number;
  item_name: string;
  item_sku?: string;
  price_info?: { current_price?: number; original_price?: number }[];
}

export async function syncProducts() {
  const shop = await requireConnectedShop();
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
    const data = await shopeeFetch<{ response: { item: { item_id: number }[]; has_next_page: boolean; next_offset: number } }>(url);
    itemIds.push(...data.response.item.map((i) => i.item_id));
    if (!data.response.has_next_page) break;
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
    const data = await shopeeFetch<{ response: { item_list: ShopeeItemBaseInfo[] } }>(url);

    for (const item of data.response.item_list) {
      const shopeeItemId = String(item.item_id);
      const price = item.price_info?.[0]?.current_price ?? item.price_info?.[0]?.original_price ?? 0;
      const sku = item.item_sku?.trim() || `shopee-${shopeeItemId}`;

      const existing =
        (await prisma.product.findUnique({ where: { shopeeItemId } })) ??
        (await prisma.product.findUnique({ where: { sku } }));

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { name: item.item_name, salePrice: price, shopeeItemId },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: { name: item.item_name, sku, salePrice: price, shopeeItemId },
        });
        created++;
      }
    }
  }

  await prisma.shopeeShop.update({ where: { shopId: shop.shopId }, data: { lastProductSyncAt: new Date() } });

  return { created, updated };
}

interface ShopeeOrderLineItem {
  item_id: number;
  model_quantity_purchased: number;
  model_discounted_price: number;
}

interface ShopeeOrderDetail {
  order_sn: string;
  create_time: number;
  total_amount: number;
  item_list: ShopeeOrderLineItem[];
}

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
        order_status: "COMPLETED",
      },
      { accessToken, shopId }
    );
    const data = await shopeeFetch<{ response: { order_list: { order_sn: string }[]; next_cursor: string; more: boolean } }>(url);
    orderSns.push(...data.response.order_list.map((o) => o.order_sn));
    if (!data.response.more) break;
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

export async function syncOrders() {
  const shop = await requireConnectedShop();
  const accessToken = await getValidAccessToken(shop);

  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = ORDER_LIST_WINDOW_DAYS * 24 * 60 * 60;
  const overallFrom = shop.lastOrderSyncAt
    ? Math.floor(shop.lastOrderSyncAt.getTime() / 1000)
    : now - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60;

  const orderSns: string[] = [];
  for (let windowStart = overallFrom; windowStart < now; windowStart += windowSeconds) {
    const windowEnd = Math.min(windowStart + windowSeconds, now);
    orderSns.push(...(await fetchOrderSnsInWindow(accessToken, shop.shopId, windowStart, windowEnd)));
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < orderSns.length; i += 50) {
    const batch = orderSns.slice(i, i + 50);
    const url = buildShopeeUrl(
      "/api/v2/order/get_order_detail",
      { order_sn_list: batch.join(","), response_optional_fields: "item_list,total_amount" },
      { accessToken, shopId: shop.shopId }
    );
    const data = await shopeeFetch<{ response: { order_list: ShopeeOrderDetail[] } }>(url);

    for (const order of data.response.order_list) {
      // O valor bruto do pedido inclui taxas da plataforma; usamos o repasse líquido (escrow)
      // para refletir o que realmente cai na conta, mesma regra das vendas manuais.
      const netAmount = await fetchOrderNetAmount(accessToken, shop.shopId, order.order_sn, order.total_amount);
      const grossTotal = order.item_list.reduce((sum, it) => sum + it.model_discounted_price * it.model_quantity_purchased, 0) || order.total_amount;

      for (const line of order.item_list) {
        const product = await prisma.product.findUnique({ where: { shopeeItemId: String(line.item_id) } });
        if (!product) {
          skipped++;
          continue;
        }

        const lineGross = line.model_discounted_price * line.model_quantity_purchased;
        const lineNet = grossTotal > 0 ? netAmount * (lineGross / grossTotal) : 0;

        try {
          await prisma.sale.create({
            data: {
              productId: product.id,
              quantity: line.model_quantity_purchased,
              totalAmount: lineNet,
              unitCostAtSale: product.costPrice,
              profit: lineNet - Number(product.costPrice) * line.model_quantity_purchased,
              origin: "SHOPEE",
              shopeeOrderSn: order.order_sn,
              saleDate: new Date(order.create_time * 1000),
            },
          });
          created++;
        } catch {
          skipped++;
        }
      }
    }
  }

  await prisma.shopeeShop.update({ where: { shopId: shop.shopId }, data: { lastOrderSyncAt: new Date() } });

  return { created, skipped };
}

export async function getStatus() {
  const shop = await getConnectedShop();
  if (!shop) {
    return { connected: false as const };
  }
  return {
    connected: true as const,
    shopId: shop.shopId,
    shopName: shop.shopName,
    lastProductSyncAt: shop.lastProductSyncAt,
    lastOrderSyncAt: shop.lastOrderSyncAt,
  };
}

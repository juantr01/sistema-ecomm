import { prisma } from "../config/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, toDateKey, parseLocalDate } from "../utils/dateRange";

// Filtro por loja Shopee: só vendas de produtos daquela loja
function shopFilter(shopId?: string) {
  return shopId ? { product: { shopeeShopId: shopId } } : {};
}

// Faturamento, lucro e pedidos de um dia (horário de Brasília)
async function summarizeDay(day: Date, shopId?: string) {
  const where = { saleDate: { gte: startOfDay(day), lte: endOfDay(day) }, ...shopFilter(shopId) };
  const [totals, sales] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, profit: true } }),
    prisma.sale.findMany({ where, select: { shopeeOrderSn: true } }),
  ]);

  // Um pedido da Shopee pode ter várias vendas (uma por variação); venda manual conta como um pedido
  const shopeeOrders = new Set(sales.filter((s) => s.shopeeOrderSn).map((s) => s.shopeeOrderSn));
  const manualOrders = sales.filter((s) => !s.shopeeOrderSn).length;

  return {
    revenue: Number(totals._sum.totalAmount ?? 0),
    profit: Number(totals._sum.profit ?? 0),
    orders: shopeeOrders.size + manualOrders,
  };
}

function previousDay(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

// Guarda o resultado do dia (todas as lojas e cada loja) para não mudar depois do fechamento
export async function closeDay(day: Date) {
  const date = toDateKey(day);
  const shops = await prisma.shopeeShop.findMany({ select: { shopId: true } });
  for (const shopId of ["", ...shops.map((s) => s.shopId)]) {
    const summary = await summarizeDay(day, shopId || undefined);
    await prisma.dailyClose.upsert({
      where: { date_shopId: { date, shopId } },
      create: { date, shopId, ...summary },
      update: summary,
    });
  }
}

export async function hasClosedDay(day: Date) {
  return !!(await prisma.dailyClose.findUnique({ where: { date_shopId: { date: toDateKey(day), shopId: "" } } }));
}

// Pedidos de um dia com o lucro de cada um, para conferir o card "Lucro do dia"
export async function getDayOrders(date: string, shopId?: string) {
  const day = parseLocalDate(date);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: startOfDay(day), lte: endOfDay(day) }, ...shopFilter(shopId) },
    include: {
      product: { select: { name: true, imageUrl: true, shopeeShopId: true } },
      variation: { select: { name: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  // Pedido da Shopee junta as vendas (uma por variação); venda manual é um pedido sozinha
  const orders = new Map<
    string,
    {
      orderSn: string | null;
      shopeeShopId: string | null;
      saleDate: Date;
      totalAmount: number;
      cost: number;
      profit: number;
      items: {
        saleId: string;
        productName: string;
        imageUrl: string | null;
        variationName: string | null;
        quantity: number;
        totalAmount: number;
        unitCost: number;
        profit: number;
      }[];
    }
  >();

  for (const sale of sales) {
    const key = sale.shopeeOrderSn ?? `manual:${sale.id}`;
    const order = orders.get(key) ?? {
      orderSn: sale.shopeeOrderSn,
      shopeeShopId: sale.product.shopeeShopId,
      saleDate: sale.saleDate,
      totalAmount: 0,
      cost: 0,
      profit: 0,
      items: [],
    };
    const totalAmount = Number(sale.totalAmount);
    const unitCost = Number(sale.unitCostAtSale);
    const profit = Number(sale.profit);
    order.totalAmount += totalAmount;
    order.cost += unitCost * sale.quantity;
    order.profit += profit;
    order.items.push({
      saleId: sale.id,
      productName: sale.product.name,
      imageUrl: sale.product.imageUrl,
      variationName: sale.variation?.name || null,
      quantity: sale.quantity,
      totalAmount,
      unitCost,
      profit,
    });
    orders.set(key, order);
  }

  const list = [...orders.values()];
  return {
    date: toDateKey(day),
    orders: list,
    totals: {
      orders: list.length,
      totalAmount: list.reduce((sum, o) => sum + o.totalAmount, 0),
      cost: list.reduce((sum, o) => sum + o.cost, 0),
      profit: list.reduce((sum, o) => sum + o.profit, 0),
    },
  };
}

export async function getDashboardSummary(shopId?: string) {
  const now = new Date();
  const yesterday = previousDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [today, salesMonth, yesterdayClose] = await Promise.all([
    summarizeDay(now, shopId),
    prisma.sale.aggregate({
      where: { saleDate: { gte: monthStart, lte: monthEnd }, ...shopFilter(shopId) },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.dailyClose.findUnique({ where: { date_shopId: { date: toDateKey(yesterday), shopId: shopId ?? "" } } }),
  ]);

  // Antes do fechamento da 00:00 (ou se ele falhou) mostra o valor atual de ontem
  const lucroOntem = yesterdayClose ? Number(yesterdayClose.profit) : (await summarizeDay(yesterday, shopId)).profit;

  return {
    faturamentoDia: today.revenue,
    faturamentoMes: Number(salesMonth._sum.totalAmount ?? 0),
    lucroDia: today.profit,
    lucroMes: Number(salesMonth._sum.profit ?? 0),
    pedidosDia: today.orders,
    lucroOntem,
    lucroOntemFechado: !!yesterdayClose,
  };
}

export async function getRevenueTrend(days = 30, shopId?: string) {
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: from }, ...(shopId ? { product: { shopeeShopId: shopId } } : {}) },
    select: { saleDate: true, totalAmount: true, profit: true },
  });

  const byDay = new Map<string, { totalAmount: number; profit: number }>();
  for (let i = 0; i < days; i++) {
    const day = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    byDay.set(toDateKey(day), { totalAmount: 0, profit: 0 });
  }

  for (const sale of sales) {
    const key = toDateKey(sale.saleDate);
    const entry = byDay.get(key);
    if (entry) {
      entry.totalAmount += Number(sale.totalAmount);
      entry.profit += Number(sale.profit);
    }
  }

  return Array.from(byDay.entries()).map(([date, values]) => ({ date, ...values }));
}

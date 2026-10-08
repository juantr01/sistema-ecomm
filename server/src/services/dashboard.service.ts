import { prisma } from "../config/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, toDateKey } from "../utils/dateRange";

export async function getDashboardSummary(shopId?: string) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filtro por loja Shopee: só vendas de produtos daquela loja
  const shopFilter = shopId ? { product: { shopeeShopId: shopId } } : {};

  const [salesToday, salesMonth, ordersToday] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: dayStart, lte: dayEnd }, ...shopFilter },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: monthStart, lte: monthEnd }, ...shopFilter },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.sale.findMany({
      where: { saleDate: { gte: dayStart, lte: dayEnd }, ...shopFilter },
      select: { shopeeOrderSn: true },
    }),
  ]);

  // Um pedido da Shopee pode ter vários produtos (uma venda por produto); venda manual conta como um pedido
  const shopeeOrders = new Set(ordersToday.filter((s) => s.shopeeOrderSn).map((s) => s.shopeeOrderSn));
  const manualOrders = ordersToday.filter((s) => !s.shopeeOrderSn).length;

  return {
    faturamentoDia: Number(salesToday._sum.totalAmount ?? 0),
    faturamentoMes: Number(salesMonth._sum.totalAmount ?? 0),
    lucroDia: Number(salesToday._sum.profit ?? 0),
    lucroMes: Number(salesMonth._sum.profit ?? 0),
    pedidosDia: shopeeOrders.size + manualOrders,
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

import { prisma } from "../config/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "../utils/dateRange";

export async function getDashboardSummary() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [salesToday, salesMonth, expensesMonth, productCount, products, topProductsRaw] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: dayStart, lte: dayEnd } },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: monthStart, lte: monthEnd } },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({ where: { active: true }, select: { stockQuantity: true, minStock: true } }),
    prisma.sale.groupBy({
      by: ["productId"],
      where: { saleDate: { gte: monthStart, lte: monthEnd } },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStock).length;

  const topProductIds = topProductsRaw.map((t) => t.productId);
  const topProductsInfo = await prisma.product.findMany({ where: { id: { in: topProductIds } } });
  const topProducts = topProductsRaw.map((t) => {
    const product = topProductsInfo.find((p) => p.id === t.productId);
    return {
      product,
      quantitySold: t._sum.quantity ?? 0,
      totalAmount: Number(t._sum.totalAmount ?? 0),
    };
  });

  const faturamentoMes = Number(salesMonth._sum.totalAmount ?? 0);
  const totalGastoMes = Number(expensesMonth._sum.amount ?? 0);

  return {
    faturamentoDia: Number(salesToday._sum.totalAmount ?? 0),
    faturamentoMes,
    lucroDia: Number(salesToday._sum.profit ?? 0),
    lucroMes: Number(salesMonth._sum.profit ?? 0),
    totalGastoMes,
    saldo: faturamentoMes - totalGastoMes,
    quantidadeProdutos: productCount,
    estoqueBaixo: lowStockCount,
    produtosMaisVendidos: topProducts,
  };
}

export async function getRevenueTrend(days = 30) {
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: from } },
    select: { saleDate: true, totalAmount: true, profit: true },
  });

  const byDay = new Map<string, { totalAmount: number; profit: number }>();
  for (let i = 0; i < days; i++) {
    const day = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    byDay.set(day.toISOString().slice(0, 10), { totalAmount: 0, profit: 0 });
  }

  for (const sale of sales) {
    const key = sale.saleDate.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (entry) {
      entry.totalAmount += Number(sale.totalAmount);
      entry.profit += Number(sale.profit);
    }
  }

  return Array.from(byDay.entries()).map(([date, values]) => ({ date, ...values }));
}

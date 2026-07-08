import { prisma } from "../config/prisma";
import { parseDateRange } from "../utils/dateRange";

interface RangeQuery {
  from?: string;
  to?: string;
}

export async function getSalesSummary(query: RangeQuery) {
  const { from, to } = parseDateRange(query.from, query.to);
  const dateFilter = from || to ? { gte: from, lte: to } : undefined;

  const [salesAgg, allExpensesAgg, manualExpensesAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: dateFilter ? { saleDate: dateFilter } : {},
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.expense.aggregate({
      where: dateFilter ? { date: dateFilter } : {},
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { source: "MANUAL", ...(dateFilter ? { date: dateFilter } : {}) },
      _sum: { amount: true },
    }),
  ]);

  const totalVendido = Number(salesAgg._sum.totalAmount ?? 0);
  const lucroBruto = Number(salesAgg._sum.profit ?? 0);
  const despesasOperacionais = Number(manualExpensesAgg._sum.amount ?? 0);

  return {
    totalVendido,
    totalGasto: Number(allExpensesAgg._sum.amount ?? 0),
    lucroBruto,
    lucroLiquido: lucroBruto - despesasOperacionais,
  };
}

export async function getTopProducts(query: RangeQuery & { limit?: number }) {
  const { from, to } = parseDateRange(query.from, query.to);
  const dateFilter = from || to ? { gte: from, lte: to } : undefined;
  const limit = query.limit ?? 10;

  const grouped = await prisma.sale.groupBy({
    by: ["productId"],
    where: dateFilter ? { saleDate: dateFilter } : {},
    _sum: { quantity: true, totalAmount: true, profit: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const products = await prisma.product.findMany({ where: { id: { in: grouped.map((g) => g.productId) } } });

  return grouped.map((g) => ({
    product: products.find((p) => p.id === g.productId),
    quantitySold: g._sum.quantity ?? 0,
    totalAmount: Number(g._sum.totalAmount ?? 0),
    profit: Number(g._sum.profit ?? 0),
  }));
}

export async function getExpensesBySupplier(query: RangeQuery) {
  const { from, to } = parseDateRange(query.from, query.to);

  const purchases = await prisma.purchase.findMany({
    where: from || to ? { purchaseDate: { gte: from, lte: to } } : {},
    include: { supplier: true, items: true },
  });

  const bySupplier = new Map<string, { supplierId: string; supplierName: string; total: number }>();

  for (const purchase of purchases) {
    const itemsTotal = purchase.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const total = itemsTotal + Number(purchase.freight);

    const current = bySupplier.get(purchase.supplierId) ?? {
      supplierId: purchase.supplierId,
      supplierName: purchase.supplier.name,
      total: 0,
    };
    current.total += total;
    bySupplier.set(purchase.supplierId, current);
  }

  return Array.from(bySupplier.values()).sort((a, b) => b.total - a.total);
}

export async function getLowStock() {
  const products = await prisma.product.findMany({
    where: { active: true, sourceType: "OWN_STOCK" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return products.filter((p) => p.stockQuantity <= p.minStock);
}

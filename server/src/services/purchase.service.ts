import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreatePurchaseInput, ListPurchasesQuery } from "../schemas/purchase.schema";
import { recordStockMovement } from "./stock.service";
import { parseDateRange } from "../utils/dateRange";

export async function listPurchases(query: ListPurchasesQuery) {
  const { from, to } = parseDateRange(query.from, query.to);
  const where: Prisma.PurchaseWhereInput = {};

  if (query.supplierId) where.supplierId = query.supplierId;
  if (from || to) {
    where.purchaseDate = {};
    if (from) where.purchaseDate.gte = from;
    if (to) where.purchaseDate.lte = to;
  }

  return prisma.purchase.findMany({
    where,
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getPurchase(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { supplier: true, items: { include: { product: true } }, expense: true },
  });
  if (!purchase) {
    throw new AppError("Compra não encontrada", 404);
  }
  return purchase;
}

export async function createPurchase(input: CreatePurchaseInput) {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) {
    throw new AppError("Fornecedor não encontrado", 404);
  }

  const itemsWithSubtotal = input.items.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unitCost,
  }));
  const totalItemsSubtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        supplierId: input.supplierId,
        purchaseDate: input.purchaseDate,
        freight: input.freight,
        notes: input.notes,
        items: {
          create: itemsWithSubtotal.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    // Agrega por produto para permitir múltiplas linhas do mesmo item numa compra
    const byProduct = new Map<string, { quantity: number; cost: number }>();
    for (const item of itemsWithSubtotal) {
      const allocatedFreight =
        totalItemsSubtotal > 0
          ? input.freight * (item.subtotal / totalItemsSubtotal)
          : input.freight / itemsWithSubtotal.length;

      const current = byProduct.get(item.productId) ?? { quantity: 0, cost: 0 };
      current.quantity += item.quantity;
      current.cost += item.subtotal + allocatedFreight;
      byProduct.set(item.productId, current);
    }

    for (const [productId, agg] of byProduct.entries()) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new AppError(`Produto ${productId} não encontrado`, 404);
      }

      const existingTotalCost = product.stockQuantity * Number(product.costPrice);
      const newTotalQuantity = product.stockQuantity + agg.quantity;
      const newCostPrice = newTotalQuantity > 0 ? (existingTotalCost + agg.cost) / newTotalQuantity : Number(product.costPrice);

      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newTotalQuantity,
          costPrice: newCostPrice,
        },
      });

      await recordStockMovement(tx, {
        productId,
        type: "PURCHASE",
        quantityDelta: agg.quantity,
        referenceId: purchase.id,
      });
    }

    await tx.expense.create({
      data: {
        description: `Compra de produtos - ${supplier.name}`,
        category: "COMPRA_PRODUTOS",
        amount: totalItemsSubtotal + input.freight,
        date: input.purchaseDate,
        source: "PURCHASE",
        purchaseId: purchase.id,
      },
    });

    return tx.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
      include: { supplier: true, items: { include: { product: true } }, expense: true },
    });
  });
}

export async function deletePurchase(id: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include: { items: true } });
  if (!purchase) {
    throw new AppError("Compra não encontrada", 404);
  }

  return prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const newQuantity = product.stockQuantity - item.quantity;
      if (newQuantity < 0) {
        throw new AppError(
          `Não é possível excluir: o estoque de "${product.name}" já foi movimentado após esta compra`,
          409
        );
      }

      // costPrice não é revertido: a média ponderada não é reversível com precisão
      // caso outras compras/vendas tenham ocorrido depois; mantemos o custo atual.
      await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: newQuantity } });

      await recordStockMovement(tx, {
        productId: item.productId,
        type: "ADJUSTMENT",
        quantityDelta: -item.quantity,
        referenceId: purchase.id,
        reason: "Estorno de compra excluída",
      });
    }

    await tx.expense.deleteMany({ where: { purchaseId: id } });
    await tx.purchase.delete({ where: { id } });
  });
}

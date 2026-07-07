import { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { StockAdjustmentInput } from "../schemas/stock.schema";

type TxClient = Prisma.TransactionClient;

export async function recordStockMovement(
  tx: TxClient,
  data: {
    productId: string;
    type: StockMovementType;
    quantityDelta: number;
    referenceId?: string;
    reason?: string;
  }
) {
  await tx.stockMovement.create({ data });
}

export async function getStockLevels() {
  const products = await prisma.product.findMany({
    where: { active: true, trackStock: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    ...p,
    lowStock: p.stockQuantity <= p.minStock,
  }));
}

export async function listMovements(productId?: string) {
  return prisma.stockMovement.findMany({
    where: productId ? { productId } : {},
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function adjustStock({ productId, quantityDelta, reason }: StockAdjustmentInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Produto não encontrado", 404);
    }

    const newQuantity = product.stockQuantity + quantityDelta;
    if (newQuantity < 0) {
      throw new AppError("Ajuste resultaria em estoque negativo", 422);
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
    });

    await recordStockMovement(tx, {
      productId,
      type: "ADJUSTMENT",
      quantityDelta,
      reason,
    });

    return updated;
  });
}

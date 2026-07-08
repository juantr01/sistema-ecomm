import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateSaleInput, ListSalesQuery } from "../schemas/sale.schema";
import { recordStockMovement } from "./stock.service";
import { parseDateRange } from "../utils/dateRange";

export async function listSales(query: ListSalesQuery) {
  const { from, to } = parseDateRange(query.from, query.to);
  const where: Prisma.SaleWhereInput = {};

  if (query.productId) where.productId = query.productId;
  if (from || to) {
    where.saleDate = {};
    if (from) where.saleDate.gte = from;
    if (to) where.saleDate.lte = to;
  }
  if (query.search) {
    where.product = {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ],
    };
  }

  return prisma.sale.findMany({
    where,
    include: { product: true },
    orderBy: { saleDate: "desc" },
  });
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { product: true } });
  if (!sale) {
    throw new AppError("Venda não encontrada", 404);
  }
  return sale;
}

export async function createSale(input: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) {
      throw new AppError("Produto não encontrado", 404);
    }
    const tracksStock = product.sourceType === "OWN_STOCK";
    if (tracksStock && product.stockQuantity < input.quantity) {
      throw new AppError(
        `Estoque insuficiente: disponível ${product.stockQuantity}, solicitado ${input.quantity}`,
        422
      );
    }

    const unitCostAtSale = input.unitCost;
    const profit = input.totalAmount - unitCostAtSale * input.quantity;

    const sale = await tx.sale.create({
      data: {
        productId: input.productId,
        quantity: input.quantity,
        totalAmount: input.totalAmount,
        unitCostAtSale,
        profit,
        saleDate: input.saleDate,
      },
      include: { product: true },
    });

    if (tracksStock) {
      await tx.product.update({
        where: { id: input.productId },
        data: { stockQuantity: product.stockQuantity - input.quantity },
      });

      await recordStockMovement(tx, {
        productId: input.productId,
        type: "SALE",
        quantityDelta: -input.quantity,
        referenceId: sale.id,
      });
    }

    return sale;
  });
}

export async function deleteSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    throw new AppError("Venda não encontrada", 404);
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: sale.productId } });
    if (product && product.sourceType === "OWN_STOCK") {
      await tx.product.update({
        where: { id: sale.productId },
        data: { stockQuantity: product.stockQuantity + sale.quantity },
      });

      await recordStockMovement(tx, {
        productId: sale.productId,
        type: "ADJUSTMENT",
        quantityDelta: sale.quantity,
        referenceId: sale.id,
        reason: "Estorno de venda excluída",
      });
    }

    await tx.sale.delete({ where: { id } });
  });
}

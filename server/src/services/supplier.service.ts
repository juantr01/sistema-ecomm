import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateSupplierInput, UpdateSupplierInput } from "../schemas/supplier.schema";

export async function listSuppliers(search?: string) {
  const where: Prisma.SupplierWhereInput = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  return prisma.supplier.findMany({ where, orderBy: { name: "asc" } });
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchases: {
        include: { items: { include: { product: true } } },
        orderBy: { purchaseDate: "desc" },
      },
    },
  });

  if (!supplier) {
    throw new AppError("Fornecedor não encontrado", 404);
  }

  let totalItemsPurchased = 0;
  let totalSpent = 0;

  for (const purchase of supplier.purchases) {
    totalSpent += Number(purchase.freight);
    for (const item of purchase.items) {
      totalItemsPurchased += item.quantity;
      totalSpent += Number(item.subtotal);
    }
  }

  return {
    ...supplier,
    totalItemsPurchased,
    totalSpent,
  };
}

export async function createSupplier(data: CreateSupplierInput) {
  return prisma.supplier.create({ data });
}

export async function updateSupplier(id: string, data: UpdateSupplierInput) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Fornecedor não encontrado", 404);
  }
  return prisma.supplier.update({ where: { id }, data });
}

export async function deleteSupplier(id: string) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Fornecedor não encontrado", 404);
  }
  const purchasesCount = await prisma.purchase.count({ where: { supplierId: id } });
  if (purchasesCount > 0) {
    throw new AppError("Não é possível excluir: existem compras vinculadas a este fornecedor", 409);
  }
  await prisma.supplier.delete({ where: { id } });
}

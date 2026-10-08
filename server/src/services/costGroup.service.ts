import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { AddCostGroupProductsInput, CreateCostGroupInput, UpdateCostGroupInput } from "../schemas/costGroup.schema";

type Tx = Prisma.TransactionClient;

export async function listCostGroups() {
  const [groups, ungroupedCount] = await Promise.all([
    prisma.costGroup.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    prisma.product.count({ where: { active: true, costGroupId: null } }),
  ]);

  return {
    groups: groups.map(({ _count, ...g }) => ({ ...g, productCount: _count.products })),
    ungroupedCount,
  };
}

async function requireCostGroup(id: string, tx: Tx = prisma) {
  const group = await tx.costGroup.findUnique({ where: { id } });
  if (!group) {
    throw new AppError("Grupo de custo não encontrado", 404);
  }
  return group;
}

// Usa o custo atual do produto nas vendas dele (custo unitário e lucro)
async function recalculateSalesOf(tx: Tx, productIds: string[]) {
  if (!productIds.length) return;
  await tx.$executeRaw`
    UPDATE "sales" s
    SET "unitCostAtSale" = p."costPrice",
        "profit" = s."totalAmount" - p."costPrice" * s."quantity"
    FROM "products" p
    WHERE p."id" = s."productId" AND p."id" = ANY(${productIds})
  `;
}

export async function createCostGroup(data: CreateCostGroupInput) {
  return prisma.costGroup.create({ data });
}

export async function updateCostGroup(id: string, { recalculateSales, ...data }: UpdateCostGroupInput) {
  return prisma.$transaction(async (tx) => {
    const group = await requireCostGroup(id, tx);
    const updated = await tx.costGroup.update({ where: { id }, data });

    if (data.cost !== undefined && !group.cost.equals(updated.cost)) {
      await tx.product.updateMany({ where: { costGroupId: id }, data: { costPrice: updated.cost } });
      if (recalculateSales) {
        const products = await tx.product.findMany({ where: { costGroupId: id }, select: { id: true } });
        await recalculateSalesOf(
          tx,
          products.map((p) => p.id)
        );
      }
    }
    return updated;
  });
}

// Os produtos saem do grupo e mantêm o último custo
export async function deleteCostGroup(id: string) {
  await requireCostGroup(id);
  await prisma.costGroup.delete({ where: { id } });
}

// Produto que entra no grupo recebe o custo dele, inclusive nas vendas já registradas
export async function addProducts(id: string, { productIds }: AddCostGroupProductsInput) {
  return prisma.$transaction(async (tx) => {
    const group = await requireCostGroup(id, tx);
    const result = await tx.product.updateMany({
      where: { id: { in: productIds } },
      data: { costGroupId: id, costPrice: group.cost },
    });
    await recalculateSalesOf(tx, productIds);
    return { added: result.count };
  });
}

export async function removeProduct(id: string, productId: string) {
  await requireCostGroup(id);
  await prisma.product.updateMany({ where: { id: productId, costGroupId: id }, data: { costGroupId: null } });
}

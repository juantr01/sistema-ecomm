import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  AddCostGroupVariationsInput,
  CreateCostGroupInput,
  ListCostVariationsQuery,
  UpdateCostGroupInput,
} from "../schemas/costGroup.schema";

type Tx = Prisma.TransactionClient;

// Só contam variações em uso: ativas e de produtos ativos
const activeVariation: Prisma.ProductVariationWhereInput = { active: true, product: { active: true } };

export async function listCostGroups() {
  const [groups, ungroupedCount] = await Promise.all([
    prisma.costGroup.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { variations: { where: activeVariation } } } },
    }),
    prisma.productVariation.count({ where: { ...activeVariation, costGroupId: null } }),
  ]);

  return {
    groups: groups.map(({ _count, ...g }) => ({ ...g, variationCount: _count.variations })),
    ungroupedCount,
  };
}

// Lista para escolher/conferir variações: busca no anúncio e na variação separadamente
export async function listVariations(query: ListCostVariationsQuery) {
  const where: Prisma.ProductVariationWhereInput = { ...activeVariation };
  if (query.groupId) where.costGroupId = query.groupId;
  if (query.withoutGroup === "true") where.costGroupId = null;
  if (query.search) {
    where.product = {
      active: true,
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { shopeeSku: { contains: query.search, mode: "insensitive" } },
      ],
    };
  }
  if (query.variationSearch) {
    where.OR = [
      { name: { contains: query.variationSearch, mode: "insensitive" } },
      { shopeeSku: { contains: query.variationSearch, mode: "insensitive" } },
    ];
  }

  return prisma.productVariation.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, imageUrl: true, shopeeShopId: true } },
      costGroup: { select: { id: true, name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
  });
}

async function requireCostGroup(id: string, tx: Tx = prisma) {
  const group = await tx.costGroup.findUnique({ where: { id } });
  if (!group) {
    throw new AppError("Grupo de custo não encontrado", 404);
  }
  return group;
}

// Usa o custo atual da variação nas vendas dela (custo unitário e lucro)
async function recalculateSalesOf(tx: Tx, variationIds: string[]) {
  if (!variationIds.length) return;
  await tx.$executeRaw`
    UPDATE "sales" s
    SET "unitCostAtSale" = v."costPrice",
        "profit" = s."totalAmount" - v."costPrice" * s."quantity"
    FROM "product_variations" v
    WHERE v."id" = s."variationId" AND v."id" = ANY(${variationIds})
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
      await tx.productVariation.updateMany({ where: { costGroupId: id }, data: { costPrice: updated.cost } });
      if (recalculateSales) {
        const variations = await tx.productVariation.findMany({ where: { costGroupId: id }, select: { id: true } });
        await recalculateSalesOf(
          tx,
          variations.map((v) => v.id)
        );
      }
    }
    return updated;
  });
}

// As variações saem do grupo e mantêm o último custo
export async function deleteCostGroup(id: string) {
  await requireCostGroup(id);
  await prisma.costGroup.delete({ where: { id } });
}

// Variação que entra no grupo recebe o custo dele, inclusive nas vendas já registradas
export async function addVariations(id: string, { variationIds }: AddCostGroupVariationsInput) {
  return prisma.$transaction(async (tx) => {
    const group = await requireCostGroup(id, tx);
    const result = await tx.productVariation.updateMany({
      where: { id: { in: variationIds } },
      data: { costGroupId: id, costPrice: group.cost },
    });
    await recalculateSalesOf(tx, variationIds);
    return { added: result.count };
  });
}

export async function removeVariation(id: string, variationId: string) {
  await requireCostGroup(id);
  await prisma.productVariation.updateMany({ where: { id: variationId, costGroupId: id }, data: { costGroupId: null } });
}

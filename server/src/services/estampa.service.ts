import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateEstampaInput, UpdateEstampaInput } from "../schemas/estampa.schema";

export async function listEstampas() {
  const estampas = await prisma.estampa.findMany({ orderBy: { name: "asc" } });
  return estampas.map((e) => ({
    ...e,
    lowStock: e.quantity <= e.minStock,
  }));
}

export async function createEstampa(data: CreateEstampaInput) {
  return prisma.estampa.create({ data });
}

export async function updateEstampa(id: string, data: UpdateEstampaInput) {
  const existing = await prisma.estampa.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Estampa não encontrada", 404);
  }
  return prisma.estampa.update({ where: { id }, data });
}

export async function deleteEstampa(id: string) {
  const existing = await prisma.estampa.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Estampa não encontrada", 404);
  }
  await prisma.estampa.delete({ where: { id } });
}

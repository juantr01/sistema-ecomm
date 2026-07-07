import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";

export function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(data: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError("Já existe uma categoria com esse nome", 409);
  }
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    throw new AppError("Não é possível excluir: existem produtos vinculados a esta categoria", 409);
  }
  await prisma.category.delete({ where: { id } });
}

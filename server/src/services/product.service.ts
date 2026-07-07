import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateProductInput, UpdateProductInput, ListProductsQuery } from "../schemas/product.schema";

export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {};

  if (query.active !== undefined) {
    where.active = query.active;
  }
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
    ];
  }

  let products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  if (query.lowStock) {
    products = products.filter((p) => p.stockQuantity <= p.minStock);
  }

  return products;
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) {
    throw new AppError("Produto não encontrado", 404);
  }
  return product;
}

export async function createProduct(data: CreateProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new AppError("Já existe um produto com esse SKU", 409);
  }
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  await getProduct(id);

  if (data.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing && existing.id !== id) {
      throw new AppError("Já existe um produto com esse SKU", 409);
    }
  }

  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  await getProduct(id);
  await prisma.product.update({ where: { id }, data: { active: false } });
}

export async function updateProductImage(id: string, imageUrl: string) {
  await getProduct(id);
  return prisma.product.update({ where: { id }, data: { imageUrl } });
}

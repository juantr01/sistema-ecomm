import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateProductGroupInput, UpdateProductGroupInput, AddVariationsInput } from "../schemas/productGroup.schema";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g"), "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSku(base: string): Promise<string> {
  let sku = base;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { sku } })) {
    suffix += 1;
    sku = `${base}-${suffix}`;
  }
  return sku;
}

export async function listProductGroups() {
  const groups = await prisma.productGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { active: true },
        orderBy: [{ size: "asc" }, { name: "asc" }],
      },
    },
  });

  return groups.map((g) => ({
    ...g,
    products: g.products.map((p) => ({ ...p, lowStock: p.stockQuantity <= p.minStock })),
  }));
}

export async function createProductGroup(data: CreateProductGroupInput) {
  const count = await prisma.productGroup.count();
  return prisma.productGroup.create({ data: { name: data.name, sortOrder: count } });
}

export async function updateProductGroup(id: string, data: UpdateProductGroupInput) {
  const existing = await prisma.productGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Grupo não encontrado", 404);
  }
  return prisma.productGroup.update({ where: { id }, data });
}

export async function deleteProductGroup(id: string) {
  const existing = await prisma.productGroup.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Grupo não encontrado", 404);
  }
  await prisma.productGroup.delete({ where: { id } });
}

export async function reorderProductGroups(order: string[]) {
  await prisma.$transaction(
    order.map((id, index) => prisma.productGroup.update({ where: { id }, data: { sortOrder: index } }))
  );
}

export async function addVariations(groupId: string, data: AddVariationsInput) {
  const group = await prisma.productGroup.findUnique({
    where: { id: groupId },
    include: { products: { where: { active: true } } },
  });
  if (!group) {
    throw new AppError("Grupo não encontrado", 404);
  }

  const existingSizes = new Set(group.products.map((p) => (p.size ?? "").trim().toUpperCase()));
  const sizes = [...new Set(data.sizes.map((s) => s.trim()).filter(Boolean))];

  const duplicates = sizes.filter((s) => existingSizes.has(s.toUpperCase()));
  if (duplicates.length > 0) {
    throw new AppError(`Já existe variação com o tamanho: ${duplicates.join(", ")}`, 409);
  }

  const created = [];
  for (const size of sizes) {
    const baseSku = slugify(`${group.name}-${size}`);
    const sku = await generateUniqueSku(baseSku);
    const product = await prisma.product.create({
      data: {
        name: `${group.name} - ${size}`,
        sku,
        size,
        sourceType: "OWN_STOCK",
        stockQuantity: 0,
        minStock: 0,
        groupId: group.id,
      },
    });
    created.push(product);
  }

  return created;
}

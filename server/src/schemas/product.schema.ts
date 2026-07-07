import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  sku: z.string().min(1, "SKU obrigatório"),
  categoryId: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  trackStock: z.coerce.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  active: z.coerce.boolean().optional(),
});

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

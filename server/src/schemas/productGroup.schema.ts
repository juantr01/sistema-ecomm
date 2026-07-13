import { z } from "zod";

export const createProductGroupSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

export const updateProductGroupSchema = createProductGroupSchema.partial();

export const addVariationsSchema = z.object({
  sizes: z.array(z.string().min(1)).min(1, "Informe ao menos um tamanho"),
});

export const reorderProductGroupsSchema = z.object({
  order: z.array(z.string()).min(1),
});

export type CreateProductGroupInput = z.infer<typeof createProductGroupSchema>;
export type UpdateProductGroupInput = z.infer<typeof updateProductGroupSchema>;
export type AddVariationsInput = z.infer<typeof addVariationsSchema>;

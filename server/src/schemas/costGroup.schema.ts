import { z } from "zod";

export const createCostGroupSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  cost: z.coerce.number().min(0, "Custo inválido"),
});

export const updateCostGroupSchema = createCostGroupSchema.partial().extend({
  // Ao mudar o custo, também recalcula o lucro das vendas já registradas dos produtos do grupo
  recalculateSales: z.boolean().optional(),
});

export const addCostGroupProductsSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um produto"),
});

export type CreateCostGroupInput = z.infer<typeof createCostGroupSchema>;
export type UpdateCostGroupInput = z.infer<typeof updateCostGroupSchema>;
export type AddCostGroupProductsInput = z.infer<typeof addCostGroupProductsSchema>;

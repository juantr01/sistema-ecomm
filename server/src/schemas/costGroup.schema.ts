import { z } from "zod";

export const createCostGroupSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  cost: z.coerce.number().min(0, "Custo inválido"),
});

export const updateCostGroupSchema = createCostGroupSchema.partial().extend({
  // Ao mudar o custo, também recalcula o lucro das vendas já registradas dos produtos do grupo
  recalculateSales: z.boolean().optional(),
});

export const addCostGroupVariationsSchema = z.object({
  variationIds: z.array(z.string().min(1)).min(1, "Selecione ao menos uma variação"),
});

export const listCostVariationsQuerySchema = z.object({
  search: z.string().optional(),
  variationSearch: z.string().optional(),
  groupId: z.string().optional(),
  // "true" lista só variações que ainda não estão em nenhum grupo
  withoutGroup: z.enum(["true", "false"]).optional(),
});

export type CreateCostGroupInput = z.infer<typeof createCostGroupSchema>;
export type UpdateCostGroupInput = z.infer<typeof updateCostGroupSchema>;
export type AddCostGroupVariationsInput = z.infer<typeof addCostGroupVariationsSchema>;
export type ListCostVariationsQuery = z.infer<typeof listCostVariationsQuerySchema>;

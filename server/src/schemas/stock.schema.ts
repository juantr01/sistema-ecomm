import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  quantityDelta: z.coerce.number().int().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().min(1, "Informe o motivo do ajuste"),
});

export const updateStockDisplayNameSchema = z.object({
  stockDisplayName: z.string().min(1, "Informe um nome").max(120, "Nome muito longo"),
});

export const reorderStockSchema = z.object({
  order: z.array(z.string().min(1)).min(1, "Lista de ordenação vazia"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type UpdateStockDisplayNameInput = z.infer<typeof updateStockDisplayNameSchema>;
export type ReorderStockInput = z.infer<typeof reorderStockSchema>;

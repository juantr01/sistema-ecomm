import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  quantityDelta: z.coerce.number().int().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().min(1, "Informe o motivo do ajuste"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

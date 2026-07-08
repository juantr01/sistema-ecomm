import { z } from "zod";

export const createEstampaSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  quantity: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const updateEstampaSchema = createEstampaSchema.partial();

export type CreateEstampaInput = z.infer<typeof createEstampaSchema>;
export type UpdateEstampaInput = z.infer<typeof updateEstampaSchema>;

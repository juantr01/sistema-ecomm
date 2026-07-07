import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  unitCost: z.coerce.number().min(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor obrigatório"),
  purchaseDate: z.coerce.date(),
  freight: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "Adicione ao menos um item"),
});

export const listPurchasesQuerySchema = z.object({
  supplierId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;

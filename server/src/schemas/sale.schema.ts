import { z } from "zod";

export const createSaleSchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  unitCost: z.coerce.number().min(0, "Custo do produto inválido"),
  totalAmount: z.coerce.number().min(0, "Valor recebido inválido"),
  saleDate: z.coerce.date().optional().default(() => new Date()),
});

export const listSalesQuerySchema = z.object({
  productId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;

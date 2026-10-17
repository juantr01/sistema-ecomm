import { z } from "zod";

export const shopeeCallbackSchema = z.object({
  code: z.string().min(1, "Código de autorização ausente"),
  shopId: z.string().min(1, "ID da loja ausente"),
});

// "all" é usado pelas Configurações e pelo sync automático da 00:00
export const shopeeSyncSchema = z.object({
  scope: z.enum(["all", "orders", "products"]).default("all"),
});

export type ShopeeCallbackInput = z.infer<typeof shopeeCallbackSchema>;

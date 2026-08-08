import { z } from "zod";

export const shopeeCallbackSchema = z.object({
  code: z.string().min(1, "Código de autorização ausente"),
  shopId: z.string().min(1, "ID da loja ausente"),
});

export type ShopeeCallbackInput = z.infer<typeof shopeeCallbackSchema>;

import { z } from "zod";

export const expenseCategoryEnum = z.enum([
  "EMBALAGEM",
  "FRETE",
  "MARKETING",
  "TRANSPORTE",
  "COMPRA_PRODUTOS",
  "OUTROS",
]);

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  category: expenseCategoryEnum,
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  category: expenseCategoryEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

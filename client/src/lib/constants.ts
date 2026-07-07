import { ExpenseCategory } from "@/types";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  EMBALAGEM: "Embalagem",
  FRETE: "Frete",
  MARKETING: "Marketing",
  TRANSPORTE: "Transporte",
  COMPRA_PRODUTOS: "Compra de produtos",
  OUTROS: "Outros",
};

export const MANUAL_EXPENSE_CATEGORIES: ExpenseCategory[] = ["EMBALAGEM", "FRETE", "MARKETING", "TRANSPORTE", "OUTROS"];

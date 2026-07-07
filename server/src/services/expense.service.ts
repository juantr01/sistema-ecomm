import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateExpenseInput, UpdateExpenseInput, ListExpensesQuery } from "../schemas/expense.schema";
import { parseDateRange } from "../utils/dateRange";

export async function listExpenses(query: ListExpensesQuery) {
  const { from, to } = parseDateRange(query.from, query.to);
  const where: Prisma.ExpenseWhereInput = {};

  if (query.category) where.category = query.category;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  return prisma.expense.findMany({ where, orderBy: { date: "desc" } });
}

export async function createExpense(data: CreateExpenseInput) {
  return prisma.expense.create({ data: { ...data, source: "MANUAL" } });
}

export async function updateExpense(id: string, data: UpdateExpenseInput) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new AppError("Despesa não encontrada", 404);
  }
  if (expense.source === "PURCHASE") {
    throw new AppError("Despesas geradas automaticamente por compras não podem ser editadas diretamente", 409);
  }
  return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense(id: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new AppError("Despesa não encontrada", 404);
  }
  if (expense.source === "PURCHASE") {
    throw new AppError("Exclua a compra correspondente para remover esta despesa", 409);
  }
  await prisma.expense.delete({ where: { id } });
}

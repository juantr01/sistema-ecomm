import { Request, Response, NextFunction } from "express";
import * as expenseService from "../services/expense.service";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await expenseService.listExpenses(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await expenseService.createExpense(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await expenseService.updateExpense(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await expenseService.deleteExpense(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

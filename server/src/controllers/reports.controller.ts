import { Request, Response, NextFunction } from "express";
import * as reportsService from "../services/reports.service";

export async function salesSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await reportsService.getSalesSummary(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function topProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, ...rest } = req.query as any;
    res.json(await reportsService.getTopProducts({ ...rest, limit: limit ? Number(limit) : undefined }));
  } catch (err) {
    next(err);
  }
}

export async function expensesBySupplierHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await reportsService.getExpensesBySupplier(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function lowStockHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await reportsService.getLowStock());
  } catch (err) {
    next(err);
  }
}

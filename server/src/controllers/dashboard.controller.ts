import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function summaryHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await dashboardService.getDashboardSummary());
  } catch (err) {
    next(err);
  }
}

export async function revenueTrendHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? Number(req.query.days) : undefined;
    res.json(await dashboardService.getRevenueTrend(days));
  } catch (err) {
    next(err);
  }
}

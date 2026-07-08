import { Request, Response, NextFunction } from "express";
import * as stockService from "../services/stock.service";

export async function levelsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await stockService.getStockLevels());
  } catch (err) {
    next(err);
  }
}

export async function movementsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await stockService.listMovements(req.query.productId as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function adjustHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await stockService.adjustStock(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateDisplayNameHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await stockService.updateStockDisplayName(req.params.id, req.body.stockDisplayName));
  } catch (err) {
    next(err);
  }
}

export async function reorderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await stockService.reorderStock(req.body.order);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

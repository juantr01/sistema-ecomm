import { Request, Response, NextFunction } from "express";
import * as saleService from "../services/sale.service";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await saleService.listSales(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await saleService.getSale(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await saleService.createSale(req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await saleService.deleteSale(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

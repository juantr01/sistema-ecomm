import { Request, Response, NextFunction } from "express";
import * as purchaseService from "../services/purchase.service";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await purchaseService.listPurchases(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await purchaseService.getPurchase(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await purchaseService.createPurchase(req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await purchaseService.deletePurchase(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

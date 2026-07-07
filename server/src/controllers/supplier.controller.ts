import { Request, Response, NextFunction } from "express";
import * as supplierService from "../services/supplier.service";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supplierService.listSuppliers(req.query.search as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supplierService.getSupplier(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await supplierService.createSupplier(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supplierService.updateSupplier(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

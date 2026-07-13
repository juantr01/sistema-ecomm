import { Request, Response, NextFunction } from "express";
import * as productGroupService from "../services/productGroup.service";

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await productGroupService.listProductGroups());
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await productGroupService.createProductGroup(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await productGroupService.updateProductGroup(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await productGroupService.deleteProductGroup(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reorderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await productGroupService.reorderProductGroups(req.body.order);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addVariationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await productGroupService.addVariations(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

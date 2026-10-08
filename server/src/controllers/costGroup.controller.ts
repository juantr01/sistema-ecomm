import { Request, Response, NextFunction } from "express";
import * as costGroupService from "../services/costGroup.service";

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await costGroupService.listCostGroups());
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await costGroupService.createCostGroup(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await costGroupService.updateCostGroup(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await costGroupService.deleteCostGroup(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listVariationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await costGroupService.listVariations(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function addVariationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await costGroupService.addVariations(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function removeVariationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await costGroupService.removeVariation(req.params.id, req.params.variationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

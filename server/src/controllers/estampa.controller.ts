import { Request, Response, NextFunction } from "express";
import * as estampaService from "../services/estampa.service";

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await estampaService.listEstampas());
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await estampaService.createEstampa(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await estampaService.updateEstampa(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await estampaService.deleteEstampa(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

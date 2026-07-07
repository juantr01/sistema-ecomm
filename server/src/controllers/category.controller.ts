import { Request, Response, NextFunction } from "express";
import * as categoryService from "../services/category.service";

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await categoryService.listCategories());
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await categoryService.createCategory(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await categoryService.updateCategory(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

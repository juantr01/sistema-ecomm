import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { uploadImageToR2 } from "../utils/r2";
import * as productService from "../services/product.service";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await productService.listProducts(req.query as any));
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await productService.getProduct(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await productService.createProduct(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await productService.updateProduct(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function uploadImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError("Nenhum arquivo enviado", 400);
    }
    const imageUrl = await uploadImageToR2(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json(await productService.updateProductImage(req.params.id, imageUrl));
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import * as shopeeService from "../services/shopee.service";

export async function statusHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await shopeeService.getStatus());
  } catch (err) {
    next(err);
  }
}

export async function authUrlHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ url: await shopeeService.getAuthorizationUrl() });
  } catch (err) {
    next(err);
  }
}

export async function callbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, shopId } = req.body;
    await shopeeService.handleOAuthCallback(code, shopId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function syncHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await shopeeService.syncProducts();
    const orders = await shopeeService.syncOrders();
    res.json({ products, orders });
  } catch (err) {
    next(err);
  }
}

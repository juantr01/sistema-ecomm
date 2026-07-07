import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
};

export function notFoundHandler(_req: import("express").Request, res: import("express").Response) {
  res.status(404).json({ error: "Rota não encontrada" });
}

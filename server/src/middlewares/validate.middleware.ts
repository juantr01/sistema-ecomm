import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: AnyZodObject, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as any)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({ error: "Dados inválidos", details: err.flatten() });
        return;
      }
      next(err);
    }
  };
}

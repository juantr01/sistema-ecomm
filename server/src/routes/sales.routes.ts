import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createSaleSchema, listSalesQuerySchema } from "../schemas/sale.schema";
import { listHandler, getHandler, createHandler, deleteHandler } from "../controllers/sale.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listSalesQuerySchema, "query"), listHandler);
router.get("/:id", getHandler);
router.post("/", validate(createSaleSchema), createHandler);
router.delete("/:id", deleteHandler);

export default router;

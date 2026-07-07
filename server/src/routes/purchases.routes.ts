import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createPurchaseSchema, listPurchasesQuerySchema } from "../schemas/purchase.schema";
import { listHandler, getHandler, createHandler, deleteHandler } from "../controllers/purchase.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listPurchasesQuerySchema, "query"), listHandler);
router.get("/:id", getHandler);
router.post("/", validate(createPurchaseSchema), createHandler);
router.delete("/:id", deleteHandler);

export default router;

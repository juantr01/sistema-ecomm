import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createSupplierSchema, updateSupplierSchema } from "../schemas/supplier.schema";
import { listHandler, getHandler, createHandler, updateHandler, deleteHandler } from "../controllers/supplier.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.get("/:id", getHandler);
router.post("/", validate(createSupplierSchema), createHandler);
router.put("/:id", validate(updateSupplierSchema), updateHandler);
router.delete("/:id", deleteHandler);

export default router;

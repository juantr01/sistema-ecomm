import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { listHandler, createHandler, updateHandler, deleteHandler } from "../controllers/category.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.post("/", validate(createCategorySchema), createHandler);
router.put("/:id", validate(updateCategorySchema), updateHandler);
router.delete("/:id", deleteHandler);

export default router;

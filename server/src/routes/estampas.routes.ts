import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createEstampaSchema, updateEstampaSchema } from "../schemas/estampa.schema";
import { listHandler, createHandler, updateHandler, deleteHandler } from "../controllers/estampa.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.post("/", validate(createEstampaSchema), createHandler);
router.put("/:id", validate(updateEstampaSchema), updateHandler);
router.delete("/:id", deleteHandler);

export default router;

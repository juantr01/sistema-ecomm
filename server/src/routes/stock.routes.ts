import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { stockAdjustmentSchema } from "../schemas/stock.schema";
import { levelsHandler, movementsHandler, adjustHandler } from "../controllers/stock.controller";

const router = Router();

router.use(requireAuth);

router.get("/", levelsHandler);
router.get("/movements", movementsHandler);
router.post("/adjustments", validate(stockAdjustmentSchema), adjustHandler);

export default router;

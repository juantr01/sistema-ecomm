import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { stockAdjustmentSchema, updateStockDisplayNameSchema, reorderStockSchema } from "../schemas/stock.schema";
import {
  levelsHandler,
  movementsHandler,
  adjustHandler,
  updateDisplayNameHandler,
  reorderHandler,
} from "../controllers/stock.controller";

const router = Router();

router.use(requireAuth);

router.get("/", levelsHandler);
router.get("/movements", movementsHandler);
router.post("/adjustments", validate(stockAdjustmentSchema), adjustHandler);
router.post("/reorder", validate(reorderStockSchema), reorderHandler);
router.post("/:id/display-name", validate(updateStockDisplayNameSchema), updateDisplayNameHandler);

export default router;

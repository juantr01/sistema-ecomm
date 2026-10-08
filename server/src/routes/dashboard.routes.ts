import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { summaryHandler, revenueTrendHandler, dayOrdersHandler } from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth);

router.get("/summary", summaryHandler);
router.get("/revenue-trend", revenueTrendHandler);
router.get("/day-orders", dayOrdersHandler);

export default router;

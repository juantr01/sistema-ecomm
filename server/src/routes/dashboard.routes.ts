import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { summaryHandler, revenueTrendHandler } from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth);

router.get("/summary", summaryHandler);
router.get("/revenue-trend", revenueTrendHandler);

export default router;

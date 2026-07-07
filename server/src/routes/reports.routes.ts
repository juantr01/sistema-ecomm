import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  salesSummaryHandler,
  topProductsHandler,
  expensesBySupplierHandler,
  lowStockHandler,
} from "../controllers/reports.controller";

const router = Router();

router.use(requireAuth);

router.get("/sales-summary", salesSummaryHandler);
router.get("/top-products", topProductsHandler);
router.get("/expenses-by-supplier", expensesBySupplierHandler);
router.get("/low-stock", lowStockHandler);

export default router;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

import authRoutes from "./routes/auth.routes";
import categoriesRoutes from "./routes/categories.routes";
import productsRoutes from "./routes/products.routes";
import suppliersRoutes from "./routes/suppliers.routes";
import purchasesRoutes from "./routes/purchases.routes";
import salesRoutes from "./routes/sales.routes";
import expensesRoutes from "./routes/expenses.routes";
import stockRoutes from "./routes/stock.routes";
import productGroupsRoutes from "./routes/productGroups.routes";
import estampasRoutes from "./routes/estampas.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportsRoutes from "./routes/reports.routes";
import shopeeRoutes from "./routes/shopee.routes";

export const app = express();

app.set("trust proxy", 1);

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/product-groups", productGroupsRoutes);
app.use("/api/estampas", estampasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/shopee", shopeeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

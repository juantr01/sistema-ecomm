import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema } from "../schemas/expense.schema";
import { listHandler, createHandler, updateHandler, deleteHandler } from "../controllers/expense.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listExpensesQuerySchema, "query"), listHandler);
router.post("/", validate(createExpenseSchema), createHandler);
router.put("/:id", validate(updateExpenseSchema), updateHandler);
router.delete("/:id", deleteHandler);

export default router;

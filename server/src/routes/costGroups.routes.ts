import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { addCostGroupProductsSchema, createCostGroupSchema, updateCostGroupSchema } from "../schemas/costGroup.schema";
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  addProductsHandler,
  removeProductHandler,
} from "../controllers/costGroup.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.post("/", validate(createCostGroupSchema), createHandler);
router.put("/:id", validate(updateCostGroupSchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/products", validate(addCostGroupProductsSchema), addProductsHandler);
router.delete("/:id/products/:productId", removeProductHandler);

export default router;

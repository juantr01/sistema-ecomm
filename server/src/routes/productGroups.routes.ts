import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createProductGroupSchema,
  updateProductGroupSchema,
  addVariationsSchema,
  reorderProductGroupsSchema,
} from "../schemas/productGroup.schema";
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  reorderHandler,
  addVariationsHandler,
} from "../controllers/productGroup.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.post("/", validate(createProductGroupSchema), createHandler);
router.put("/:id", validate(updateProductGroupSchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/reorder", validate(reorderProductGroupsSchema), reorderHandler);
router.post("/:id/variations", validate(addVariationsSchema), addVariationsHandler);

export default router;

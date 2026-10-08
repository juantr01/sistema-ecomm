import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { addCostGroupVariationsSchema, createCostGroupSchema, listCostVariationsQuerySchema, updateCostGroupSchema } from "../schemas/costGroup.schema";
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  listVariationsHandler,
  addVariationsHandler,
  removeVariationHandler,
} from "../controllers/costGroup.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listHandler);
router.get("/variations", validate(listCostVariationsQuerySchema, "query"), listVariationsHandler);
router.post("/", validate(createCostGroupSchema), createHandler);
router.put("/:id", validate(updateCostGroupSchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/variations", validate(addCostGroupVariationsSchema), addVariationsHandler);
router.delete("/:id/variations/:variationId", removeVariationHandler);

export default router;

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { upload } from "../utils/upload";
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from "../schemas/product.schema";
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  uploadImageHandler,
} from "../controllers/product.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listProductsQuerySchema, "query"), listHandler);
router.get("/:id", getHandler);
router.post("/", validate(createProductSchema), createHandler);
router.put("/:id", validate(updateProductSchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/image", upload.single("image"), uploadImageHandler);

export default router;

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { shopeeCallbackSchema } from "../schemas/shopee.schema";
import { statusHandler, authUrlHandler, callbackHandler, syncHandler, disconnectHandler } from "../controllers/shopee.controller";

const router = Router();

router.use(requireAuth);

router.get("/status", statusHandler);
router.get("/auth-url", authUrlHandler);
router.post("/callback", validate(shopeeCallbackSchema), callbackHandler);
router.post("/sync", syncHandler);
router.delete("/connection", disconnectHandler);

export default router;

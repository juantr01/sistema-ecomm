import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { loginSchema, changePasswordSchema } from "../schemas/auth.schema";
import { loginHandler, logoutHandler, meHandler, changePasswordHandler } from "../controllers/auth.controller";

const router = Router();

router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", requireAuth, meHandler);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePasswordHandler);

export default router;

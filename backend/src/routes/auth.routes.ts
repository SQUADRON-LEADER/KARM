import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post("/login", authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post("/refresh", authRateLimiter, AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);

export default router;

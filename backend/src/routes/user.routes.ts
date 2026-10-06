import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { updateProfileSchema } from "../validators/user.validator.js";

const router = Router();

router.put("/me", authenticate, validateBody(updateProfileSchema), UserController.updateMe);

export default router;

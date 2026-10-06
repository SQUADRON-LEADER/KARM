import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", ActivityController.list);

export default router;

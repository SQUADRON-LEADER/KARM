import { Router } from "express";
import { TaskController } from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery, validateObjectId } from "../middleware/validation.middleware.js";
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from "../validators/task.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createTaskSchema), TaskController.create);
router.get("/", validateQuery(taskQuerySchema), TaskController.list);
router.get("/:id", validateObjectId("id"), TaskController.getById);
router.put("/:id", validateObjectId("id"), validateBody(updateTaskSchema), TaskController.update);
router.patch("/:id/complete", validateObjectId("id"), TaskController.complete);
router.delete("/:id", validateObjectId("id"), TaskController.delete);

export default router;

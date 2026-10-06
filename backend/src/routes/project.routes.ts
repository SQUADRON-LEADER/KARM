import { Router } from "express";
import { ProjectController } from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery, validateObjectId } from "../middleware/validation.middleware.js";
import { createProjectSchema, updateProjectSchema, projectQuerySchema } from "../validators/project.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createProjectSchema), ProjectController.create);
router.get("/", validateQuery(projectQuerySchema), ProjectController.list);
router.get("/:id", validateObjectId("id"), ProjectController.getById);
router.put("/:id", validateObjectId("id"), validateBody(updateProjectSchema), ProjectController.update);
router.delete("/:id", validateObjectId("id"), ProjectController.delete);

export default router;

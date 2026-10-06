import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export class ProjectController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const project = await ProjectService.create(userId, req.body);
      sendSuccess(res, project, "Project created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await ProjectService.list(userId, req.query as any);
      sendSuccess(res, result.data, "Projects retrieved successfully", 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const projectId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const project = await ProjectService.getById(userId, projectId);
      sendSuccess(res, project, "Project retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const projectId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const project = await ProjectService.update(userId, projectId, req.body);
      sendSuccess(res, project, "Project updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const projectId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const deleted = await ProjectService.delete(userId, projectId);
      sendSuccess(res, deleted, "Project and related tasks deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

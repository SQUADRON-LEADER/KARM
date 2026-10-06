import { Request, Response, NextFunction } from "express";
import { TaskService } from "../services/task.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export class TaskController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const task = await TaskService.create(userId, req.body);
      sendSuccess(res, task, "Task created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await TaskService.list(userId, req.query as any);
      sendSuccess(res, result.data, "Tasks retrieved successfully", 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const taskId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const task = await TaskService.getById(userId, taskId);
      sendSuccess(res, task, "Task retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const taskId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const task = await TaskService.update(userId, taskId, req.body);
      sendSuccess(res, task, "Task updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const taskId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const task = await TaskService.complete(userId, taskId);
      sendSuccess(res, task, "Task marked as completed", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const taskId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
      const deleted = await TaskService.delete(userId, taskId);
      sendSuccess(res, deleted, "Task deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

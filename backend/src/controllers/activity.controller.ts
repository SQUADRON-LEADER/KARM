import { Request, Response, NextFunction } from "express";
import { ActivityService } from "../services/activity.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export class ActivityController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

      const result = await ActivityService.listByUser(userId, page, limit);
      sendSuccess(res, result.data, "Activities retrieved successfully", 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}

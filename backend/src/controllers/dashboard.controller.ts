import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export class DashboardController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await DashboardService.getDashboardData(userId);
      sendSuccess(res, data, "Dashboard data retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

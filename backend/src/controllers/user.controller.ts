import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export class UserController {
  public static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updatedUser = await UserService.updateProfile(userId, req.body);
      sendSuccess(res, updatedUser, "Profile updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

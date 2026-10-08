import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, password } = req.body;
      const result = await AuthService.register(fullName, email, password);
      const isMobileClient = req.get("X-Client") === "mobile";

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          ...(isMobileClient ? { refreshToken: result.refreshToken } : {}),
        },
        "User registered successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      const isMobileClient = req.get("X-Client") === "mobile";

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          ...(isMobileClient ? { refreshToken: result.refreshToken } : {}),
        },
        "Login successful",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const isMobileClient = req.get("X-Client") === "mobile";
      if (!token) {
        sendError(res, "Refresh token missing. Please sign in.", 401);
        return;
      }

      const result = await AuthService.refreshToken(token);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          ...(isMobileClient ? { refreshToken: result.refreshToken } : {}),
        },
        "Session refreshed successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
        path: "/",
      });

      sendSuccess(res, null, "Logged out successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getMe(userId);

      sendSuccess(res, user, "Current user profile retrieved", 200);
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt.js";
import { sendError } from "../utils/apiResponse.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "Authentication required. Please log in.", 401);
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    sendError(res, "Authentication token missing.", 401);
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      sendError(res, "Authentication token expired. Please refresh your session.", 401);
      return;
    }
    sendError(res, "Invalid authentication token.", 401);
  }
}

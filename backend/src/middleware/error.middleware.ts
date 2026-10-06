import { Request, Response, NextFunction } from "express";
import { AppError, sendError } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error details on server
  console.error("[Unhandled Error]:", err);

  // Custom Application Errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    sendError(res, `A record with this ${field} already exists.`, 409);
    return;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, "Database validation failed.", 400, errors);
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    sendError(res, `Invalid format for resource ID '${err.value}'.`, 400);
    return;
  }

  // JSON Web Token Errors
  if (err.name === "JsonWebTokenError") {
    sendError(res, "Invalid token.", 401);
    return;
  }

  if (err.name === "TokenExpiredError") {
    sendError(res, "Token expired.", 401);
    return;
  }

  // Generic 500 Internal Server Error
  const message = env.NODE_ENV === "production"
    ? "An unexpected internal server error occurred."
    : err.message || "Internal server error";

  sendError(res, message, 500);
}

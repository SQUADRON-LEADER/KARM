import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import mongoose from "mongoose";
import { sendError } from "../utils/apiResponse.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        sendError(res, "Validation failed", 400, errors);
        return;
      }
      sendError(res, "Invalid request payload", 400);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        sendError(res, "Invalid query parameters", 400, errors);
        return;
      }
      sendError(res, "Invalid query parameters", 400);
    }
  };
}

export function validateObjectId(paramName = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawId = req.params[paramName];
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, `Invalid ID format for parameter '${paramName}'`, 400);
      return;
    }
    next();
  };
}

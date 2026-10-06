import { Response } from "express";

export interface ApiResponseSuccess<T = unknown> {
  success: true;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponseError {
  success: false;
  message: string;
  errors?: unknown[];
}

export class AppError extends Error {
  public statusCode: number;
  public errors?: unknown[];

  constructor(message: string, statusCode = 500, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
  pagination?: { page: number; limit: number; total: number; totalPages: number }
): Response {
  const response: ApiResponseSuccess<T> = {
    success: true,
    message,
    data,
  };
  if (pagination) {
    response.pagination = pagination;
  }
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  errors?: unknown[]
): Response {
  const response: ApiResponseError = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

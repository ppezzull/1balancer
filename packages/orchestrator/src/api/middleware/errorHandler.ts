import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../utils/logger';
import { config } from '../../config';

const logger = createLogger('error-handler');

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode,
    code: err.code,
  });

  // Default to 500 if no status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse: any = {
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
  };

  // Add details in development mode
  if (config.env === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

// Helper to create API errors
export class ApiErrorFactory {
  static badRequest(message: string, details?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    error.details = details;
    return error;
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return error;
  }

  static forbidden(message = 'Forbidden'): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return error;
  }

  static notFound(resource: string): ApiError {
    const error = new Error(`${resource} not found`) as ApiError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
  }

  static conflict(message: string): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 409;
    error.code = 'CONFLICT';
    return error;
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 429;
    error.code = 'TOO_MANY_REQUESTS';
    return error;
  }

  static internal(message = 'Internal server error'): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
    return error;
  }

  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = 503;
    error.code = 'SERVICE_UNAVAILABLE';
    return error;
  }
}
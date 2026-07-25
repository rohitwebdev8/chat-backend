import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { ApiResponse } from '../types/notification.types.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  console.error('[Unhandled Error]:', err.message);

  res.status(500).json({
    success: false,
    message: config.isDevelopment ? err.message : 'Internal server error',
  });
}

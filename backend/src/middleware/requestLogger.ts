import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Express middleware that intercepts and logs incoming HTTP client requests,
 * prominently recording the client's IP address, HTTP method, target endpoint,
 * response status, and duration in milliseconds.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Handle standard HTTP completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req, res, duration);
  });

  // Handle client disconnect or aborted request before response finishes
  res.on('close', () => {
    if (!res.writableEnded) {
      const duration = Date.now() - start;
      logger.http(req, res, duration);
    }
  });

  next();
}

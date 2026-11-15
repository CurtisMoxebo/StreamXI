import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { matchesRouter } from './routes/matches.js';
import { streamsRouter } from './routes/streams.js';
import { liveTvRouter } from './routes/liveTv.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy headers (X-Forwarded-For) for client IP detection
  app.set('trust proxy', true);

  // Core Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Backend Logging Middleware - logs method, URL, status, latency and client IP address
  app.use(requestLogger);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'StreamXI API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  app.use('/api/matches', matchesRouter);
  app.use('/api/streams', streamsRouter);
  app.use('/api/livetv', liveTvRouter);

  // 404 Handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found on this server.',
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('[StreamXI Server Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
  });

  return app;
}

export const app = createApp();

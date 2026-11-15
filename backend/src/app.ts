import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'StreamXI API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 404 Handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found on this server.',
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[StreamXI Server Error]:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
  });

  return app;
}

export const app = createApp();

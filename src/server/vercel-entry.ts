import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './api.ts';

dotenv.config();

const app = express();

// Parse JSON bodies up to 15mb for avatars and images
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS headers for all responses
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Mount the API router at both '/api' and '/' to ensure compatibility
// with all Vercel URL rewrite configurations
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 404 Fallback for unmatched API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global error handler to prevent unhandled serverless invocation crashes
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('API Server Error:', err);
  const statusCode = typeof err?.status === 'number' ? err.status : 500;
  res.status(statusCode).json({
    error: err?.message || 'Internal Server Error',
    code: err?.code || 'SERVER_ERROR',
  });
});

export default app;

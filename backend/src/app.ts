import express, { Express } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health';
import authTestRouter from './routes/auth-test';
import notesRouter from './routes/notes';
import aiRouter from './routes/ai';
import userRouter from './routes/user';


export function createApp(): Express {
  const app = express();

  // Middleware
  // Supports a single origin or a comma-separated list in FRONTEND_ORIGIN
  // (e.g. "https://khatera-ai.vercel.app,http://localhost:5173")
  const allowedOrigins = (config.frontendOrigin || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile apps)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  }));
  app.use(express.json());
  
  // Clerk authentication middleware
  app.use(clerkMiddleware());

  // Routes
  app.use('/', healthRouter);
  app.use('/api/auth', authTestRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/user', userRouter);

  app.use(errorHandler);

  return app;
}
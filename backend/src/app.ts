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

  const allowedOrigins = [
    'https://khatera-ai.vercel.app',
    'http://localhost:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin
        // (curl, server-to-server, mobile apps, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Not allowed by CORS: ${origin}`));
      },

      credentials: true,

      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'Authorization',
      ],
    })
  );

  // Handle preflight requests
  app.options('*', cors());

  // =========================
  // Body parser
  // =========================

  app.use(express.json());

  // =========================
  // Clerk
  // =========================

  app.use(clerkMiddleware());

  // =========================
  // Routes
  // =========================

  app.use('/', healthRouter);

  app.use('/api/auth', authTestRouter);

  app.use('/api/notes', notesRouter);

  app.use('/api/ai', aiRouter);

  app.use('/api/user', userRouter);

  // =========================
  // Error handler
  // =========================

  app.use(errorHandler);

  return app;
}


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

  // =========================
  // CORS
  // =========================

  const allowedOrigins = [
    'https://khatera-ai.vercel.app',
    'http://localhost:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests without an Origin header
        // such as server-to-server requests.
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new Error(`Not allowed by CORS: ${origin}`)
        );
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

      optionsSuccessStatus: 204,
    })
  );

  // =========================
  // Body parser
  // =========================

  app.use(express.json());

  // =========================
  // Clerk authentication
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


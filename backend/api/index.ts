import { createApp } from '../src/app';
import { initializeDatabase } from '../src/db/sequelize';

const app = createApp();

let dbReady: Promise<unknown> | null = null;

const allowedOrigins = [
  'https://khatera-ai.vercel.app',
  'http://localhost:5173',
];

function setCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: any, res: any) {
  // --------------------------------------------------
  // CORS
  // --------------------------------------------------

  setCorsHeaders(req, res);

  // --------------------------------------------------
  // Handle browser preflight request BEFORE database
  // initialization and BEFORE Express.
  // --------------------------------------------------

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --------------------------------------------------
  // Database initialization
  // --------------------------------------------------

  try {
    if (!dbReady) {
      dbReady = initializeDatabase().catch((err) => {
        dbReady = null;
        throw err;
      });
    }

    await dbReady;
  } catch (error) {
    console.error('Database initialization failed:', error);

    // CORS headers were already added above.
    return res.status(500).json({
      error: 'Database connection failed',
    });
  }

  // --------------------------------------------------
  // Express application
  // --------------------------------------------------

  return app(req, res);
}


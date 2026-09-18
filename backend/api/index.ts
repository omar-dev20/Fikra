import { createApp } from '../src/app';
import { initializeDatabase } from '../src/db/sequelize';

const app = createApp();
let dbReady: Promise<unknown> | null = null;

export default async function handler(req: any, res: any) {
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
    return res.status(500).json({ error: 'Database connection failed' });
  }
  return app(req, res);
}
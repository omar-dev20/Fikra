import { Sequelize } from 'sequelize';
import { config } from '../config/env';
import path from 'path';
import fs from 'fs';

const isProduction = config.nodeEnv === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Use Postgres in production OR whenever DATABASE_URL is provided
// (e.g. on Vercel, even if NODE_ENV is not set to "production").
const usePostgres = isProduction || Boolean(databaseUrl);

if (usePostgres && !databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to the environment variables.');
}

// Ensure local data directory exists (only needed for SQLite/dev)
if (!usePostgres) {
  const dataDir = path.dirname(config.sqlitePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export const sequelize = usePostgres
  ? new Sequelize(databaseUrl as string, {
      dialect: 'postgres',
      // Makes sure the pg driver is bundled in serverless environments
      dialectModule: require('pg'),
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: config.sqlitePath,
      logging: config.nodeEnv === 'development' ? console.log : false,
    });

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Create tables if they don't exist (safe: alter is false, nothing is changed or dropped)
    if (config.nodeEnv === 'development' || usePostgres) {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}
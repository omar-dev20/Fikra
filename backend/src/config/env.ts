import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
  },
  sqlitePath: process.env.SQLITE_PATH || path.join(__dirname, '../../data/maswada.db'),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    organization: process.env.OPENAI_ORGANIZATION_ID || '',
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },
};

// Validate required config
if (!config.clerk.secretKey && config.nodeEnv !== 'test') {
  console.warn('⚠️  CLERK_SECRET_KEY is not set. Authentication will fail.');
}
if (!config.clerk.publishableKey && config.nodeEnv !== 'test') {
  console.warn('⚠️  CLERK_PUBLISHABLE_KEY is not set.');
}
if (!config.groq.apiKey && config.nodeEnv !== 'test') {
  console.warn('⚠️  GROQ_API_KEY is not set. AI features will fail.');
}
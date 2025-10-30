import 'dotenv/config';

export const env = {
  PORT: Number(process.env.SERVER_PORT) || 6001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://made-in-china.lk',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',

  // Updated variable names (no FIREBASE_ prefix)
  PROJECT_ID: process.env.PROJECT_ID || '',
  CLIENT_EMAIL: process.env.CLIENT_EMAIL || '',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || '',
  SERVICE_ACCOUNT_KEY: process.env.SERVICE_ACCOUNT_KEY || '',
  DATABASE_ID: process.env.DATABASE_ID || '',
};

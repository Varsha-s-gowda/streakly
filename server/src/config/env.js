import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/streakly'),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowSignup: String(process.env.ALLOW_SIGNUP || 'false').toLowerCase() === 'true',
  isProduction: process.env.NODE_ENV === 'production',
};

if (env.isProduction && env.jwtSecret.includes('dev-only')) {
  console.warn('[env] WARNING: JWT_SECRET is using the insecure development fallback.');
}

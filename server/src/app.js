import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import dayRoutes from './routes/day.routes.js';
import statsRoutes from './routes/stats.routes.js';
import habitRoutes from './routes/habit.routes.js';
import journalRoutes from './routes/journal.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import taskRoutes from './routes/task.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import accountRoutes from './routes/account.routes.js';
import { requireAuth } from './middleware/auth.js';
import { HttpError } from './utils/httpError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
const indexHtml = path.join(clientDist, 'index.html');

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'tiny' : 'dev'));
  }

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/day', requireAuth, dayRoutes);
  app.use('/api/stats', requireAuth, statsRoutes);
  app.use('/api/habits', requireAuth, habitRoutes);
  app.use('/api/journal', requireAuth, journalRoutes);
  app.use('/api/interview', requireAuth, interviewRoutes);
  app.use('/api/tasks', requireAuth, taskRoutes);
  app.use('/api/reminders', requireAuth, reminderRoutes);
  app.use('/api/account', requireAuth, accountRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found.' });
  });

  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist, { index: false, maxAge: env.isProduction ? '7d' : 0 }));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api')) return next();
      return res.sendFile(indexHtml);
    });
  }

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
      const details = Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message]),
      );
      return res.status(400).json({ message: 'Some fields are invalid.', details });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid identifier.' });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That record already exists.' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON body.' });
    }

    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) {
      console.error('[error]', err);
    }
    res.status(status).json({
      message:
        status >= 500 && env.isProduction
          ? 'Something went wrong. Please try again.'
          : err.message || 'Something went wrong.',
      details: err.details,
    });
  });

  return app;
}

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { env } from './config/env';
import './config/firebase';
import router from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED REJECTION:', e);
});

const app = express();

// CORS setup
const rawOrigins = (
  env.CORS_ORIGIN ||
  env.FRONTEND_URL ||
  'https://made-in-china-c44be.web.app',
  'https://made-in-china.lk'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsMw = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (rawOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(corsMw);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/', (_req, res) => res.redirect('/api/health'));
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'api', time: Date.now(), env: env.NODE_ENV })
);

// Mount routes
app.use('/api', router);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// ✅ Export only, don't call app.listen()
export default app;

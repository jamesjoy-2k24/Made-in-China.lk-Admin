import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env';

const r = Router();

// Select DB instance (named or default)
const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

r.get('/ping', async (_req, res) => {
  try {
    await db.listCollections(); // sanity check
    res.json({
      ok: true,
      projectId: process.env.PROJECT_ID || 'inline',
      databaseId: env.DATABASE_ID || '(default)',
      firestore: 'ready',
    });
  } catch (err: any) {
    res.status(503).json({
      ok: false,
      reason: 'firestore_not_ready',
      message: err?.message || String(err),
      code: err?.code || err?.status,
    });
  }
});

export default r;

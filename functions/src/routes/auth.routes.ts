import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { admin as AdminSDK } from '../config/firebase';
import { isBootstrapAdmin } from '../middleware/rbac';

const r = Router();

// --- DEBUG: show Firebase environment ---
r.get('/debug/env', (_req, res) => {
  const app = AdminSDK.app();
  return res.json({
    projectId:
      (app.options as any)?.projectId || process.env.PROJECT_ID || null,
    storageBucket:
      (app.options as any)?.storageBucket || process.env.STORAGE_BUCKET || null,
    hasWebApiKey: !!process.env.API_KEY,
  });
});

// --- Check if email exists in this Firebase project ---
r.get(
  '/debug/user-exists',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const email = String(req.query.email || '')
        .trim()
        .toLowerCase();
      if (!email) {
        res.status(400).json({ message: 'email is required' });
        return;
      }
      const user = await AdminSDK.auth().getUserByEmail(email);
      res.json({ exists: !!user, uid: user.uid, email: user.email });
      return;
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') {
        res.json({ exists: false });
        return;
      }
      res.status(500).json({ message: e?.message || 'lookup failed' });
    }
  }
);

// --- Login with Firebase Identity Toolkit ---
r.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    let { email, password } = (req.body || {}) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    email = email.trim().toLowerCase();
    const key = process.env.API_KEY;
    if (!key) {
      res
        .status(500)
        .json({ message: 'FIREBASE_WEB_API_KEY missing in backend env' });
      return;
    }

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await resp.json();
    const json: Record<string, unknown> =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    if (!resp.ok) {
      res.status(resp.status).json({
        ...(json as object),
        _hint:
          'If Postman works but this fails, check API base URL and Firebase key match.',
        _projectCheck: {
          projectId:
            (AdminSDK.app().options as any)?.projectId ||
            process.env.PROJECT_ID ||
            null,
        },
      });
      return;
    }

    res.json(json);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'login failed' });
  }
});

// --- Current user ---
r.get('/me', requireAuth, (req: AuthedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// --- Logout ---
r.post(
  '/logout',
  requireAuth,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const uid = req.user!.uid;
      await AdminSDK.auth().revokeRefreshTokens(uid);
      res.json({ ok: true, message: 'Logged out (refresh tokens revoked)' });
    } catch (e: any) {
      res
        .status(500)
        .json({ ok: false, message: e?.message || 'logout failed' });
    }
  }
);

// --- Admin-only: set custom claims ---
r.post(
  '/set-claims',
  requireAuth,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const requesterIsAdmin = req.user?.role === 'admin';
      const requesterIsBootstrap = isBootstrapAdmin(req.user?.email);

      if (!requesterIsAdmin && !requesterIsBootstrap) {
        res.status(403).json({ message: 'Forbidden: Admin role required' });
        return;
      }

      const { uid, role } = req.body;
      if (!uid) {
        res.status(400).json({ message: 'Missing user UID' });
        return;
      }

      // default role if none provided
      const assignedRole = role || 'admin';

      await AdminSDK.auth().setCustomUserClaims(uid, {
        permissions: [
          'catalog:list',
          'catalog:create',
          'catalog:update',
          'catalog:delete',
        ],
        role: assignedRole,
      });

      res.json({
        message: `Custom claims set for user ${uid} as ${assignedRole}`,
      });
    } catch (e: any) {
      console.error('Error setting custom claims:', e);
      res.status(500).json({
        message: 'Failed to set custom claims',
        error: e?.message || 'Unknown error',
      });
    }
  }
);

// --- Admin-only sample: list one user ---
r.get(
  '/stats',
  requireAuth,
  async (_req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const list = await AdminSDK.auth().listUsers(1);
      res.json({ sampleUserCount: list.users.length });
    } catch (e: any) {
      res.status(500).json({
        message: e?.message || 'Failed to list users',
      });
    }
  }
);

export default r;

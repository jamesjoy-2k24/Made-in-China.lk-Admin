// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

export interface AuthedRequest extends Request {
  user?: admin.auth.DecodedIdToken & {
    permissions?: string[];
    role?: string;
  };
}

export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';

  if (!token) {
    return;
  }

  try {
    // Verify token (checkRevoked=true)
    const decoded = await admin.auth().verifyIdToken(token, true);

    // Fetch freshest custom claims from Admin SDK
    const userRec = await admin.auth().getUser(decoded.uid);
    const custom = (userRec.customClaims || {}) as Partial<{
      permissions: string[];
      role: string;
    }>;

    // Merge decoded + custom claims (server is source of truth)
    req.user = {
      ...(decoded as any),
      ...custom,
    };

    next();
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/id-token-revoked') {
      return err;
    }
    return err;
  }
};

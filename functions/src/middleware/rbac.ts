// middleware/rbac.ts
import { Response, NextFunction } from 'express';
import type { AuthedRequest } from './auth';

/** Match a required permission against a list that may include wildcards, e.g. "catalog:*" */
const hasPermission = (perms: string[], needed: string) => {
  if (!Array.isArray(perms)) return false;
  if (perms.includes(needed)) return true;

  // wildcard match: "domain:*"
  const [needDomain] = needed.split(':');
  for (const p of perms) {
    const [dom, act] = String(p).split(':');
    // exact domain + wildcard action
    if (dom === needDomain && act === '*') return true;
    // full wildcard (rare, but supported)
    if (dom === '*' && act === '*') return true;
  }
  return false;
};

/**
 * requirePerm("catalog:list")
 * - allows if role === "admin"
 * - allows if permissions include "catalog:list" or "catalog:*"
 * - gives detailed 403 explaining what's missing
 */
export const requirePerm =
  (perm: string) => (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user: any = req.user || {};

    // 1) Admin role bypass
    const role = user.role || user.claims?.role;
    if (role === 'admin') return next();

    // 2) Collect permissions from common locations
    const perms: string[] =
      (user.permissions as string[]) ||
      (user.claims?.permissions as string[]) ||
      [];

    // 3) Check with wildcard support
    const ok = hasPermission(perms, perm);

    // Helpful debug log
    console.log(
      '[RBAC] email/uid:',
      user.email || user.uid,
      '| role:',
      role,
      '| perms:',
      perms,
      '| required:',
      perm,
      '| allowed:',
      ok
    );

    if (!ok) {
      return res.status(403).json({
        message: 'Forbidden',
        reason: 'missing_permission',
        required: perm,
        role: role || null,
        user: user.email || user.uid,
        userPermissions: perms,
        tips: [
          'Ensure this user has the needed permission in customClaims.',
          'If you just set claims, refresh the ID token (getIdToken(true) or sign out/in).',
          'Admins (role="admin") bypass checks.',
        ],
      });
    }

    next();
  };

/**
 * permit("a:b", "c:d")
 * - allows if role === "admin"
 * - requires ALL listed permissions (with wildcard support)
 */
export const permit =
  (...need: string[]) =>
  (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user: any = req.user || {};

    // Admin bypass
    const role = user.role || user.claims?.role;
    if (role === 'admin') return next();

    const perms: string[] =
      (user.permissions as string[]) ||
      (user.claims?.permissions as string[]) ||
      [];

    const ok = need.every((p) => hasPermission(perms, p));

    console.log(
      '[RBAC.permit] email/uid:',
      user.email || user.uid,
      '| role:',
      role,
      '| perms:',
      perms,
      '| requiredAll:',
      need,
      '| allowed:',
      ok
    );

    if (!ok) {
      return res.status(403).json({
        message: 'Forbidden',
        reason: 'missing_permissions',
        requiredAll: need,
        role: role || null,
        user: user.email || user.uid,
        userPermissions: perms,
      });
    }
    next();
  };


  export const isBootstrapAdmin = (email?: string | null) => {
  const allowed = process.env.BOOTSTRAP_ADMIN_EMAIL;
  return !!email && !!allowed && email.toLowerCase() === allowed.toLowerCase();
};
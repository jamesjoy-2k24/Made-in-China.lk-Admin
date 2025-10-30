import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { can, type Permission } from "@/lib/rbac";

interface AuthGuardProps {
  children: React.ReactNode;
  permissions?: Permission[];
  requireAll?: boolean;
}

/**
 * Usage:
 * <Route
 *   path="/users"
 *   element={
 *     <AuthGuard permissions={['users:list']}>
 *       <UsersPage />
 *     </AuthGuard>
 *   }
 * />
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  permissions = [],
  requireAll = false,
}) => {
  const location = useLocation();
  const { isAuthenticated, role } = useSelector((s: RootState) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permissions.length > 0) {
    const allowed = requireAll
      ? permissions.every((p) => can(role, p))
      : permissions.some((p) => can(role, p));

    if (!allowed) return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;

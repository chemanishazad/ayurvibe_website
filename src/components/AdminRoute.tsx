import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthUser, isAdminAuthenticated } from '@/pages/Login';
import { userMayAccessRoute } from '@/lib/nav-access';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protects admin routes. Redirects to /admin (login) if not authenticated.
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Routes that are admin-only by default; staff may access if their `allowedNavPaths` includes the route.
 */
export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const user = getAuthUser();
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (
    userMayAccessRoute(
      user
        ? { role: user.role, allowedNavPaths: user.allowedNavPaths ?? null, staffRole: user.staffRole ?? null }
        : null,
      path,
    )
  ) {
    return <>{children}</>;
  }
  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminRoute;

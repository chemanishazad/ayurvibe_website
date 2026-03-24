import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthUser, isAdminAuthenticated } from '@/pages/Login';

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
 * Renders children only for administrators. Clinic staff are redirected to the dashboard.
 */
export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getAuthUser();
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

export default AdminRoute;

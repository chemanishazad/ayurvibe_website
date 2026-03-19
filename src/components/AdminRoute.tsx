import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '@/pages/Login';

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

export default AdminRoute;

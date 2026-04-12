import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { cn } from '@/lib/utils';
import { getAuthUser } from '@/pages/Login';
import { userMayAccessRoute } from '@/lib/nav-access';

const AdminShell = () => {
  const { pathname } = useLocation();
  const user = getAuthUser();
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (user && user.role !== 'admin') {
    const session = {
      role: user.role,
      allowedNavPaths: user.allowedNavPaths ?? null,
      staffRole: user.staffRole ?? null,
    };
    if (!userMayAccessRoute(session, normalized)) {
      if ((user.role === 'nurse' || (user.role === 'user' && user.staffRole === 'nurse')) && normalized.startsWith('/admin/consultations')) {
        return <Navigate to="/admin/op" replace />;
      }
      const fallback = (user.allowedNavPaths && user.allowedNavPaths[0]) || '/admin/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }
  /** Same flex + min-h-0 chain as patients so inner scroll + pagination work. */
  const isAdminFullBleed =
    normalized === '/admin/patients' ||
    normalized === '/admin/pharmacy' ||
    normalized.startsWith('/admin/pharmacy/') ||
    normalized === '/admin/consultations' ||
    normalized === '/admin/op';

  return (
    <AdminLayout>
      <div
        className={cn(
          isAdminFullBleed
            ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
            : 'w-full min-w-0',
        )}
      >
        <Outlet />
      </div>
    </AdminLayout>
  );
};

export default AdminShell;

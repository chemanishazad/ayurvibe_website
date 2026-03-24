import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { cn } from '@/lib/utils';

const AdminShell = () => {
  const { pathname } = useLocation();
  const normalized = pathname.replace(/\/$/, '') || '/';
  /** Same flex + min-h-0 chain as patients so inner scroll + pagination work. */
  const isAdminFullBleed =
    normalized === '/admin/patients' ||
    normalized === '/admin/pharmacy' ||
    normalized.startsWith('/admin/pharmacy/');

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

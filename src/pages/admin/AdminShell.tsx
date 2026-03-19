import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { cn } from '@/lib/utils';

const AdminShell = () => {
  const { pathname } = useLocation();
  const normalized = pathname.replace(/\/$/, '') || '/';
  const isPatientsList = normalized === '/admin/patients';

  return (
    <AdminLayout>
      <div
        className={cn(
          'min-h-0 flex-1',
          isPatientsList ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-y-auto overscroll-y-contain pb-1',
        )}
      >
        <Outlet />
      </div>
    </AdminLayout>
  );
};

export default AdminShell;

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { AdminClinicProvider } from '@/contexts/AdminClinicContext';
import { cn } from '@/lib/utils';

const AdminShell = () => {
  const { pathname } = useLocation();
  const normalized = pathname.replace(/\/$/, '') || '/';
  const isPatientsList = normalized === '/admin/patients';

  return (
    <AdminClinicProvider>
    <AdminLayout>
      <div
        className={cn(
          isPatientsList
            ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
            : 'w-full min-w-0',
        )}
      >
        <Outlet />
      </div>
    </AdminLayout>
    </AdminClinicProvider>
  );
};

export default AdminShell;

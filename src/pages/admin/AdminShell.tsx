import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';

const AdminShell = () => {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminShell;

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { getAuthUser } from '@/pages/Login';

const AdminShell = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const [filterClinicId, setFilterClinicId] = useState(() =>
    isAdmin ? '__all__' : (user?.clinicId ?? '__all__')
  );

  useEffect(() => {
    if (!isAdmin && user?.clinicId && filterClinicId === '__all__') {
      setFilterClinicId(user.clinicId);
    }
  }, [isAdmin, user?.clinicId]);

  return (
    <AdminLayout filterClinicId={filterClinicId} onFilterClinicChange={setFilterClinicId}>
      <Outlet context={{ filterClinicId }} />
    </AdminLayout>
  );
};

export default AdminShell;

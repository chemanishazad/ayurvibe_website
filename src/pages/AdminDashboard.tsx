import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import { LogOut, LayoutDashboard, Building2 } from 'lucide-react';
import { getAuthToken, getAuthUser, setAdminAuthenticated } from './Login';
import { api } from '@/lib/api';

interface Clinic {
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filterClinicId, setFilterClinicId] = useState<string>('__all__');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!getAuthToken()) return;
    api.clinics
      .list()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setClinics(list);
        if (!isAdmin && list.length === 1) setFilterClinicId(list[0].id);
      })
      .catch(() => setClinics([]))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleLogout = () => {
    setAdminAuthenticated(false);
    navigate('/admin', { replace: true });
  };

  const filteredClinics =
    isAdmin && filterClinicId !== '__all__'
      ? clinics.filter((c) => c.id === filterClinicId)
      : clinics;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Logo withText />
          <div className="flex items-center gap-4">
            {isAdmin && clinics.length > 0 && (
              <Select value={filterClinicId} onValueChange={setFilterClinicId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by clinic" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="__all__">All clinics</SelectItem>
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              <CardTitle>Admin Dashboard</CardTitle>
            </div>
            <CardDescription>
              {isAdmin
                ? 'All clinic details. Use the filter above to view a specific clinic.'
                : `Clinic: ${clinics[0]?.name ?? 'Loading...'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading clinics...</p>
            ) : filteredClinics.length === 0 ? (
              <p className="text-muted-foreground">No clinics to display.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClinics.map((clinic) => (
                  <Card key={clinic.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{clinic.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Clinic details will appear here.</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;

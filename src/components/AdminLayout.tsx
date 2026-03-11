import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import {
  LogOut,
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Package,
  FileText,
  Building2,
} from 'lucide-react';
import { getAuthToken, getAuthUser, setAdminAuthenticated, setAuthUser } from '@/pages/Login';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Clinic {
  id: string;
  name: string;
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/patients', label: 'Patients', icon: Users },
  { path: '/admin/consultations', label: 'Consultations', icon: Stethoscope },
  { path: '/admin/medicines', label: 'Medicines', icon: Pill },
  { path: '/admin/inventory', label: 'Inventory', icon: Package },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  filterClinicId?: string;
  onFilterClinicChange?: (id: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, filterClinicId = '__all__', onFilterClinicChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const [clinics, setClinics] = React.useState<Clinic[]>([]);

  const isAdmin = user?.role === 'admin';
  const staffClinicCount = !isAdmin ? clinics.length : 0;
  const currentClinicName = clinics.find((c) => c.id === (filterClinicId !== '__all__' ? filterClinicId : user?.clinicId))?.name;

  React.useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API_URL}/api/clinics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: Clinic[]) => setClinics(Array.isArray(data) ? data : []))
      .catch(() => setClinics([]));
  }, [isAdmin, user?.clinicId]);

  const handleClinicChange = async (newClinicId: string) => {
    if (isAdmin) {
      onFilterClinicChange?.(newClinicId);
      return;
    }
    if (staffClinicCount > 1 && newClinicId !== user?.clinicId) {
      try {
        const { token, user: updatedUser } = await api.auth.switchClinic(newClinicId);
        sessionStorage.setItem('auth_token', token);
        setAuthUser(updatedUser);
        onFilterClinicChange?.(newClinicId);
      } catch {
        // Keep current selection on error
      }
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Logo withText />
          <div className="flex items-center gap-4">
            {isAdmin && clinics.length > 0 && onFilterClinicChange && (
              <Select value={filterClinicId} onValueChange={handleClinicChange}>
                <SelectTrigger className="w-[180px]">
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
            {!isAdmin && staffClinicCount === 1 && currentClinicName && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {currentClinicName}
              </div>
            )}
            {!isAdmin && staffClinicCount > 1 && onFilterClinicChange && (
              <Select value={filterClinicId} onValueChange={handleClinicChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="text-sm text-muted-foreground">{user?.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto flex gap-6 py-6 px-4">
        <aside className="w-56 shrink-0">
          <nav className="sticky top-24 space-y-1 rounded-lg border bg-white p-2 shadow-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

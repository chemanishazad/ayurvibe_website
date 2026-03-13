import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LogOut,
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Package,
  FileText,
  Building2,
  ClipboardList,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { getAuthToken, getAuthUser, setAdminAuthenticated, setAuthUser } from '@/pages/Login';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Clinic {
  id: string;
  name: string;
}

const navGroups = [
  {
    label: 'Overview',
    items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Clinical',
    items: [
      { path: '/admin/patients', label: 'Patients', icon: Users },
      { path: '/admin/consultations', label: 'Consultations', icon: Stethoscope },
      { path: '/admin/pharmacy', label: 'Pharmacy', icon: Pill },
      { path: '/admin/treatment-plans', label: 'Treatment Plans', icon: ClipboardList },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { path: '/admin/medicines', label: 'Medicines', icon: Pill },
      { path: '/admin/inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    label: 'Reports',
    items: [{ path: '/admin/reports', label: 'Reports', icon: FileText }],
  },
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
    fetch(`${API_URL}/api/clinics`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
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
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Ayurvibe</span>
              <span className="text-xs text-sidebar-foreground/70">Clinic Admin</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.path}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70">
            <span className="truncate">{user?.username}</span>
            <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium">
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isAdmin && clinics.length > 0 && onFilterClinicChange && (
                <Select value={filterClinicId} onValueChange={handleClinicChange}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {(user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline-block">{user?.username}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.username}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {isAdmin ? 'Administrator' : 'Clinic Staff'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-auto p-3">
          <div className="mx-auto w-full max-w-[1600px] flex-1 flex flex-col min-h-0">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;

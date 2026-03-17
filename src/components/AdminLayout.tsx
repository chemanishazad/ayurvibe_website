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
  Truck,
  CalendarClock,
} from 'lucide-react';
import { getAuthUser, setAdminAuthenticated } from '@/pages/Login';

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
      { path: '/admin/upcoming-follow-ups', label: 'Upcoming Follow Ups', icon: CalendarClock },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { path: '/admin/medicines', label: 'Medicines', icon: Pill },
      { path: '/admin/suppliers', label: 'Suppliers', icon: Truck },
      { path: '/admin/inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    label: 'Reports',
    items: [{ path: '/admin/reports', label: 'Reports', icon: FileText }],
  },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const currentClinicName = !isAdmin ? user?.clinicId : undefined;

  const handleLogout = () => {
    setAdminAuthenticated(false);
    navigate('/admin', { replace: true });
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r bg-sidebar">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shadow-sm">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
                Sri Vinayaga Ayurvibe
              </span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-sidebar-foreground/60">
                Clinic Admin
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-1 py-2">
          {navGroups.map((group, groupIdx) => (
            <SidebarGroup key={group.label} className={groupIdx > 0 ? 'mt-1 pt-1 border-t border-sidebar-border/60' : ''}>
              <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.16em] text-sidebar-foreground/60">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/');
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="px-3 py-2.5 rounded-lg text-sm transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm hover:bg-sidebar-accent/60"
                        >
                          <Link to={item.path} className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
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
        <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-1.5 text-xs text-sidebar-foreground/80">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-medium">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-medium">{user?.username}</p>
              <p className="text-[11px] text-sidebar-foreground/70">
                {isAdmin ? 'Administrator' : 'Clinic staff'}
              </p>
            </div>
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
            <div className="flex items-center gap-2" />
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

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogOut, Menu, ChevronDown, Stethoscope } from 'lucide-react';
import { getAuthUser, setAdminAuthenticated } from '@/pages/Login';
import { ADMIN_ALL_CLINICS_VALUE, AdminClinicProvider, useAdminClinic } from '@/contexts/AdminClinicContext';
import { getNavGroupsForSession } from '@/lib/nav-access';
import { useToast } from '@/hooks/use-toast';

/** Longest nav path match so e.g. /admin/patients/new still shows "Patients". */
function getAdminPageTitle(pathname: string, user: ReturnType<typeof getAuthUser>): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/admin/pharmacy/new') {
    return 'New invoice';
  }
  const items = getNavGroupsForSession(
    user
      ? { role: user.role, allowedNavPaths: user.allowedNavPaths ?? null, staffRole: user.staffRole ?? null }
      : null,
  ).flatMap((g) => g.items);
  const sorted = [...items].sort((a, b) => b.path.length - a.path.length);
  for (const item of sorted) {
    if (normalized === item.path || normalized.startsWith(`${item.path}/`)) {
      return item.label;
    }
  }
  return null;
}

const AdminLayoutInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
  /** List pages use full-height inner scroll; other pages scroll the main column only. */
  const isPatientsFullBleed =
    normalizedPath === '/admin/patients' ||
    normalizedPath === '/admin/pharmacy' ||
    normalizedPath === '/admin/consultations' ||
    normalizedPath === '/admin/op';
  const user = getAuthUser();
  const isAdminUser = user?.role === 'admin';
  const pageTitle = getAdminPageTitle(location.pathname, user);
  const visibleNavGroups = getNavGroupsForSession(
    user
      ? { role: user.role, allowedNavPaths: user.allowedNavPaths ?? null, staffRole: user.staffRole ?? null }
      : null,
  );
  const {
    clinics,
    selectedClinicId,
    setSelectedClinicId,
    isAdmin: ctxAdmin,
    effectiveClinicId,
    switchStaffClinic,
    staffClinicSwitching,
  } = useAdminClinic();
  const { toast } = useToast();
  const adminClinicFilterValue = selectedClinicId || ADMIN_ALL_CLINICS_VALUE;
  const onAdminClinicFilterChange = (v: string) => {
    setSelectedClinicId(v === ADMIN_ALL_CLINICS_VALUE ? '' : v);
  };
  const staffClinicName =
    !ctxAdmin && effectiveClinicId
      ? clinics.find((c) => c.id === effectiveClinicId)?.name ?? null
      : null;

  const handleLogout = () => {
    setAdminAuthenticated(false);
    navigate('/admin', { replace: true });
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r bg-sidebar">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <Link
            to="/admin/dashboard"
            className="group flex items-center gap-3 rounded-lg outline-offset-2 transition-[opacity,transform] duration-200 ease-out hover:opacity-95 active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shadow-sm transition-colors duration-200 group-hover:bg-primary/25">
              <Stethoscope className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-105" />
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
          {visibleNavGroups.map((group, groupIdx) => (
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
                          className="px-3 py-2.5 rounded-lg text-sm transition-[background-color,color,transform,box-shadow] duration-200 ease-out data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm hover:bg-sidebar-accent/80 hover:translate-x-0.5"
                        >
                          <Link to={item.path} className="group/link flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover/link:scale-110" />
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
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-1.5 text-xs text-sidebar-foreground/80 transition-colors duration-200 hover:bg-sidebar-accent/80">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-medium">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-medium">{user?.username}</p>
              <p className="text-[11px] text-sidebar-foreground/70">
                {isAdminUser ? 'Administrator' : user?.allowedNavPaths?.length ? 'Staff (custom access)' : 'Clinic staff'}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1 transition-colors duration-200 hover:bg-muted/80 hover:text-foreground">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <Separator orientation="vertical" className="h-6" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              {pageTitle ? (
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground transition-colors duration-200">
                  {pageTitle}
                </h1>
              ) : (
                <span className="sr-only">Clinic admin</span>
              )}
            </div>
            {ctxAdmin && clinics.length > 0 && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Clinic filter</span>
                <Select value={adminClinicFilterValue} onValueChange={onAdminClinicFilterChange}>
                  <SelectTrigger className="h-9 w-[min(52vw,220px)]">
                    <SelectValue placeholder="All clinics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ADMIN_ALL_CLINICS_VALUE}>All clinics</SelectItem>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!ctxAdmin && clinics.length > 1 && effectiveClinicId && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Clinic</span>
                <Select
                  value={effectiveClinicId}
                  disabled={staffClinicSwitching}
                  onValueChange={async (v) => {
                    try {
                      await switchStaffClinic(v);
                    } catch {
                      toast({
                        title: 'Could not switch clinic',
                        description: 'Try again or sign out and back in.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[min(52vw,240px)]">
                    <SelectValue placeholder="Clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!ctxAdmin && clinics.length === 1 && staffClinicName && (
              <span className="hidden max-w-[220px] truncate text-sm text-muted-foreground sm:inline">
                {staffClinicName}
              </span>
            )}
            {/* Mobile clinic selector for admin */}
            {ctxAdmin && clinics.length > 0 && (
              <div className="flex shrink-0 sm:hidden">
                <Select value={adminClinicFilterValue} onValueChange={onAdminClinicFilterChange}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ADMIN_ALL_CLINICS_VALUE}>All clinics</SelectItem>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!ctxAdmin && clinics.length > 1 && effectiveClinicId && (
              <div className="flex shrink-0 sm:hidden">
                <Select
                  value={effectiveClinicId}
                  disabled={staffClinicSwitching}
                  onValueChange={async (v) => {
                    try {
                      await switchStaffClinic(v);
                    } catch {
                      toast({
                        title: 'Could not switch clinic',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="Clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 pl-2 pr-3 transition-[background-color,box-shadow] duration-200 ease-out hover:bg-muted/90 hover:shadow-sm"
                >
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
                      {isAdminUser ? 'Administrator' : user?.allowedNavPaths?.length ? 'Staff (custom access)' : 'Clinic Staff'}
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
        <main
          className={
            isPatientsFullBleed
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4'
              : 'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain p-3 sm:p-4'
          }
        >
          <div
            className={
              isPatientsFullBleed
                ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
                : 'flex w-full min-w-0 flex-col pb-6'
            }
          >
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

/** Provider must wrap this layout so useAdminClinic() is always valid for shell + Outlet pages. */
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AdminClinicProvider>
    <AdminLayoutInner>{children}</AdminLayoutInner>
  </AdminClinicProvider>
);

export default AdminLayout;

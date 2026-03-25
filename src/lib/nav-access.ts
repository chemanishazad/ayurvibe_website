import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Package,
  FileText,
  ClipboardList,
  Truck,
  CalendarClock,
  UsersRound,
  ShoppingCart,
  Building2,
  UserCog,
  Scale,
} from 'lucide-react';

/** Single source for admin “Users & access” checkboxes and sidebar filtering. */
export const ADMIN_NAV_CATALOG: {
  path: string;
  label: string;
  group: string;
  icon: LucideIcon;
}[] = [
  { path: '/admin/dashboard', label: 'Dashboard', group: 'Overview', icon: LayoutDashboard },
  { path: '/admin/patients', label: 'Patients', group: 'Clinical', icon: Users },
  { path: '/admin/doctors', label: 'Doctors', group: 'Clinical', icon: UsersRound },
  { path: '/admin/consultations', label: 'Consultations', group: 'Clinical', icon: Stethoscope },
  { path: '/admin/pharmacy', label: 'Pharmacy', group: 'Clinical', icon: Pill },
  { path: '/admin/treatment-plans', label: 'Treatment Plans', group: 'Clinical', icon: ClipboardList },
  { path: '/admin/upcoming-follow-ups', label: 'Upcoming Follow Ups', group: 'Clinical', icon: CalendarClock },
  { path: '/admin/medicines', label: 'Medicines', group: 'Commerce', icon: Pill },
  { path: '/admin/suppliers', label: 'Suppliers', group: 'Commerce', icon: Truck },
  { path: '/admin/inventory', label: 'Inventory', group: 'Commerce', icon: Package },
  { path: '/admin/direct-sales', label: 'Direct sales', group: 'Commerce', icon: ShoppingCart },
  { path: '/admin/reports', label: 'Reports', group: 'Reports', icon: FileText },
  { path: '/admin/clinics', label: 'Clinics', group: 'Administration', icon: Building2 },
  { path: '/admin/users', label: 'Users & access', group: 'Administration', icon: UserCog },
  { path: '/admin/uom', label: 'Units (UOM)', group: 'Administration', icon: Scale },
];

const GROUP_ORDER = ['Overview', 'Clinical', 'Commerce', 'Reports', 'Administration'];

export type NavGroup = { label: string; items: { path: string; label: string; icon: LucideIcon }[] };

export function getFullNavGroups(): NavGroup[] {
  const byGroup = new Map<string, NavGroup['items']>();
  for (const entry of ADMIN_NAV_CATALOG) {
    const list = byGroup.get(entry.group) ?? [];
    list.push({ path: entry.path, label: entry.label, icon: entry.icon });
    byGroup.set(entry.group, list);
  }
  return GROUP_ORDER.filter((g) => byGroup.has(g)).map((label) => ({
    label,
    items: byGroup.get(label)!,
  }));
}

/** Default staff menu (no explicit `allowedNavPaths`): hide these. */
export const STAFF_HIDDEN_NAV_PATHS = new Set([
  '/admin/doctors',
  '/admin/medicines',
  '/admin/suppliers',
  '/admin/direct-sales',
]);

export type AuthUserSession = {
  role: string;
  allowedNavPaths?: string[] | null;
};

function pathMatchesAllowed(pathname: string, allowedPrefix: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  const a = allowedPrefix.replace(/\/$/, '') || '/';
  return p === a || p.startsWith(`${a}/`);
}

/** Whether the user may open this route (admin: always; staff: default rules or explicit list). */
export function userMayAccessRoute(user: AuthUserSession | null, pathname: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const allowed = user.allowedNavPaths;
  const p = pathname.replace(/\/$/, '') || '/';
  if (allowed && allowed.length > 0) {
    return allowed.some((prefix) => pathMatchesAllowed(p, prefix));
  }
  for (const hidden of STAFF_HIDDEN_NAV_PATHS) {
    if (pathMatchesAllowed(p, hidden)) return false;
  }
  if (p.startsWith('/admin/clinics') || p.startsWith('/admin/users') || p.startsWith('/admin/uom')) {
    return false;
  }
  return true;
}

export function getNavGroupsForSession(user: AuthUserSession | null): NavGroup[] {
  const full = getFullNavGroups();
  if (!user || user.role === 'admin') return full;
  const allowed = user.allowedNavPaths;
  if (allowed && allowed.length > 0) {
    return full
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => allowed.some((prefix) => pathMatchesAllowed(item.path, prefix))),
      }))
      .filter((g) => g.items.length > 0);
  }
  return full
    .filter((g) => g.label !== 'Administration')
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !STAFF_HIDDEN_NAV_PATHS.has(item.path)),
    }))
    .filter((g) => g.items.length > 0);
}

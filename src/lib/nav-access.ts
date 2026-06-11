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
  ShoppingCart,
  Building2,
  UserCog,
  Scale,
  HeartPulse,
  ContactRound,
  ReceiptText,
  ShieldCheck,
  Layers,
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
  { path: '/admin/op', label: 'OP', group: 'Clinical', icon: HeartPulse },
  { path: '/admin/consultations', label: 'Consultations', group: 'Clinical', icon: Stethoscope },
  { path: '/admin/pharmacy', label: 'Pharmacy', group: 'Clinical', icon: Pill },
  { path: '/admin/treatment-plans', label: 'Treatment Plans', group: 'Clinical', icon: ClipboardList },
  { path: '/admin/upcoming-follow-ups', label: 'Upcoming Follow Ups', group: 'Clinical', icon: CalendarClock },
  { path: '/admin/medicines', label: 'Medicines', group: 'Commerce', icon: Pill },
  { path: '/admin/suppliers', label: 'Suppliers', group: 'Commerce', icon: Truck },
  { path: '/admin/inventory', label: 'Inventory', group: 'Commerce', icon: Package },
  { path: '/admin/batches', label: 'Batches & Costing', group: 'Commerce', icon: Layers },
  { path: '/admin/purchase-bills', label: 'Purchases & Bills', group: 'Commerce', icon: ReceiptText },
  { path: '/admin/direct-sales', label: 'Direct sales', group: 'Commerce', icon: ShoppingCart },
  { path: '/admin/reports', label: 'Reports', group: 'Reports', icon: FileText },
  { path: '/admin/clinics', label: 'Clinics', group: 'Administration', icon: Building2 },
  { path: '/admin/therapists-rooms', label: 'Therapists & rooms', group: 'Administration', icon: ContactRound },
  { path: '/admin/users', label: 'Users & access', group: 'Administration', icon: UserCog },
  { path: '/admin/roles', label: 'Roles & permissions', group: 'Administration', icon: ShieldCheck },
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
  '/admin/medicines',
  '/admin/suppliers',
  '/admin/direct-sales',
  '/admin/purchase-bills',
]);

/**
 * Role presets for the Users & access editor — one click swaps the entire `allowedNavPaths`
 * checklist to a sensible default for the chosen role. Keep these in sync with the
 * "access matrix" in PLAN.md §2.4.
 */
export type AllowedNavPreset = 'doctor' | 'reception' | 'doctor_full' | 'reception_full';

export const NAV_PRESETS: Record<AllowedNavPreset, { label: string; description: string; paths: string[] }> = {
  doctor: {
    label: 'Doctor (default)',
    description: 'Clinical work: dashboard, patients, OP, consultations, treatment plans, follow-ups, pharmacy ledger.',
    paths: [
      '/admin/dashboard',
      '/admin/patients',
      '/admin/op',
      '/admin/consultations',
      '/admin/treatment-plans',
      '/admin/upcoming-follow-ups',
      '/admin/pharmacy',
      '/admin/inventory',
      '/admin/reports',
    ],
  },
  doctor_full: {
    label: 'Doctor (with reports & inventory)',
    description: 'Same as Doctor plus access to reports and inventory views.',
    paths: [
      '/admin/dashboard',
      '/admin/patients',
      '/admin/op',
      '/admin/consultations',
      '/admin/treatment-plans',
      '/admin/upcoming-follow-ups',
      '/admin/pharmacy',
      '/admin/inventory',
      '/admin/reports',
    ],
  },
  reception: {
    label: 'Receptionist (default)',
    description: 'Front desk: patients, OP vitals, pharmacy sales & ledger, follow-ups call list.',
    paths: [
      '/admin/dashboard',
      '/admin/patients',
      '/admin/op',
      '/admin/pharmacy',
      '/admin/upcoming-follow-ups',
      '/admin/inventory',
    ],
  },
  reception_full: {
    label: 'Receptionist (with treatment scheduling)',
    description: 'Adds treatment plans (read + schedule) on top of the default receptionist menu.',
    paths: [
      '/admin/dashboard',
      '/admin/patients',
      '/admin/op',
      '/admin/pharmacy',
      '/admin/treatment-plans',
      '/admin/upcoming-follow-ups',
      '/admin/inventory',
    ],
  },
};

export type AuthUserSession = {
  role: string;
  allowedNavPaths?: string[] | null;
  /** Legacy compatibility (older token format). */
  staffRole?: string | null;
  /** Phase 2: effective permission keys. When present, drives sidebar + route access. */
  permissions?: string[] | null;
};

/** Admin nav path → its `view` permission key. Mirror of backend permission catalog navPaths. */
export const NAV_PATH_TO_VIEW_PERMISSION: Record<string, string> = {
  '/admin/dashboard': 'dashboard.view',
  '/admin/patients': 'patients.view',
  '/admin/op': 'op.view',
  '/admin/consultations': 'consultations.view',
  '/admin/pharmacy': 'pharmacy.view',
  '/admin/treatment-plans': 'treatment_plans.view',
  '/admin/upcoming-follow-ups': 'follow_ups.view',
  '/admin/medicines': 'medicines.view',
  '/admin/suppliers': 'suppliers.view',
  '/admin/inventory': 'inventory.view',
  '/admin/batches': 'inventory.view',
  '/admin/purchase-bills': 'purchase_bills.view',
  '/admin/direct-sales': 'direct_sales.view',
  '/admin/reports': 'reports.view',
  '/admin/clinics': 'clinics.view',
  '/admin/therapists-rooms': 'therapists_rooms.view',
  '/admin/users': 'users.view',
  '/admin/roles': 'roles.view',
  '/admin/uom': 'uom.view',
};

function viewPermissionForPath(path: string): string | null {
  const clean = path.replace(/\/$/, '') || '/';
  for (const [navPath, perm] of Object.entries(NAV_PATH_TO_VIEW_PERMISSION)) {
    if (clean === navPath || clean.startsWith(`${navPath}/`)) return perm;
  }
  return null;
}

function pathMatchesAllowed(pathname: string, allowedPrefix: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  const a = allowedPrefix.replace(/\/$/, '') || '/';
  return p === a || p.startsWith(`${a}/`);
}

/** Whether the user may open this route (admin: always; staff: permissions, then legacy rules). */
export function userMayAccessRoute(user: AuthUserSession | null, pathname: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const p = pathname.replace(/\/$/, '') || '/';

  // Phase 2: permission-driven access when the session carries permission keys.
  if (user.permissions && user.permissions.length > 0) {
    const required = viewPermissionForPath(p);
    // Routes not in the catalog (e.g. nested sub-routes) inherit their prefix's decision;
    // if no permission maps, allow (non-gated helper pages).
    if (!required) return true;
    if (!user.permissions.includes(required)) return false;
    // Honor an extra per-user nav restriction layered on top of the role, if present.
    const allowed = user.allowedNavPaths;
    if (allowed && allowed.length > 0) {
      return allowed.some((prefix) => pathMatchesAllowed(p, prefix));
    }
    return true;
  }
  /** Nurses record vitals under OP only; consultation charts are for doctors. */
  const isNurse = user.role === 'nurse' || (user.role === 'user' && user.staffRole === 'nurse');
  if (isNurse && pathMatchesAllowed(p, '/admin/consultations')) {
    return false;
  }
  const allowed = user.allowedNavPaths;
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

function stripConsultationsForNurse(items: NavGroup['items'], isNurse: boolean): NavGroup['items'] {
  if (!isNurse) return items;
  return items.filter((item) => item.path !== '/admin/consultations');
}

export function getNavGroupsForSession(user: AuthUserSession | null): NavGroup[] {
  const full = getFullNavGroups();
  if (!user || user.role === 'admin') return full;
  const isNurse = user.role === 'nurse' || (user.role === 'user' && user.staffRole === 'nurse');

  // Phase 2: build the sidebar from the permission set when present.
  if (user.permissions && user.permissions.length > 0) {
    const perms = new Set(user.permissions);
    const allowed = user.allowedNavPaths;
    return full
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const required = viewPermissionForPath(item.path);
          if (required && !perms.has(required)) return false;
          if (allowed && allowed.length > 0) {
            return allowed.some((prefix) => pathMatchesAllowed(item.path, prefix));
          }
          return true;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }

  const allowed = user.allowedNavPaths;
  if (allowed && allowed.length > 0) {
    return full
      .map((g) => ({
        ...g,
        items: stripConsultationsForNurse(
          g.items.filter((item) => allowed.some((prefix) => pathMatchesAllowed(item.path, prefix))),
          isNurse,
        ),
      }))
      .filter((g) => g.items.length > 0);
  }
  return full
    .filter((g) => g.label !== 'Administration')
    .map((g) => ({
      ...g,
      items: stripConsultationsForNurse(
        g.items.filter((item) => !STAFF_HIDDEN_NAV_PATHS.has(item.path)),
        isNurse,
      ),
    }))
    .filter((g) => g.items.length > 0);
}

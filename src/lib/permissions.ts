/**
 * Frontend mirror of the backend permission catalog (backend/src/shared/permissions.ts).
 * Used for the role matrix UI and for client-side route/sidebar gating. The backend is the
 * authority — these helpers only decide what to *show*; the API still enforces on every call.
 */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface PermissionModule {
  key: string;
  label: string;
  group: string;
  navPath: string | null;
  actions: PermissionAction[];
}

export const PERMISSION_GROUP_ORDER = ['Overview', 'Clinical', 'Commerce', 'Reports', 'Administration'];

export function permKey(moduleKey: string, action: PermissionAction): string {
  return `${moduleKey}.${action}`;
}

/** Map an admin route to its `view` permission key, given the module catalog. */
export function navPathToViewPermission(modules: PermissionModule[], path: string): string | null {
  const clean = path.replace(/\/$/, '') || '/';
  const mod = modules.find((m) => m.navPath && (clean === m.navPath || clean.startsWith(`${m.navPath}/`)));
  return mod ? permKey(mod.key, 'view') : null;
}

/** Group modules in display order. */
export function groupModules(modules: PermissionModule[]): { group: string; modules: PermissionModule[] }[] {
  const byGroup = new Map<string, PermissionModule[]>();
  for (const m of modules) {
    const arr = byGroup.get(m.group) ?? [];
    arr.push(m);
    byGroup.set(m.group, arr);
  }
  const ordered = PERMISSION_GROUP_ORDER.filter((g) => byGroup.has(g));
  for (const g of byGroup.keys()) if (!ordered.includes(g)) ordered.push(g);
  return ordered.map((group) => ({ group, modules: byGroup.get(group)! }));
}

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};

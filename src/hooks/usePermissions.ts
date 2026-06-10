import { useMemo } from 'react';
import { getAuthUser } from '@/pages/Login';

/**
 * Reads the current user's effective permission keys from the session.
 * Admin implies all permissions (returns `has` that is always true).
 *
 * Note: the session snapshot is captured at login / clinic-switch. For live updates after
 * an admin edits a role, call `api.authz.permissions()` and re-persist — the route guard
 * tolerates a slightly stale snapshot because the backend still enforces on every request.
 */
export function usePermissions() {
  const user = getAuthUser();
  return useMemo(() => {
    const isAdmin = user?.role === 'admin';
    const set = new Set(user?.permissions ?? []);
    return {
      isAdmin,
      permissions: set,
      /** True if the user may perform this permission key. Admin: always. */
      has: (key: string) => isAdmin || set.has(key),
      /** True if the user has any of the keys. */
      hasAny: (...keys: string[]) => isAdmin || keys.some((k) => set.has(k)),
    };
    // Re-derive only when identity / role / permission set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, (user?.permissions ?? []).join(',')]);
}

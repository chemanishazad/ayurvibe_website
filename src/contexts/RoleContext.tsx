import React, { createContext, useContext, useMemo } from 'react';
import { getAuthUser, type AuthUser } from '@/pages/Login';

/**
 * 3-role frontend model. The backend may emit `roleV2` directly on the session;
 * for older tokens we derive it from the legacy `role` column.
 */
export type RoleV2 = 'admin' | 'doctor' | 'reception';

export function deriveRoleV2(user: AuthUser | null | undefined): RoleV2 | null {
  if (!user) return null;
  if (user.roleV2) return user.roleV2;
  if (user.role === 'admin') return 'admin';
  if (user.role === 'doctor') return 'doctor';
  // 'nurse' and any legacy generic 'user' staff role → reception.
  return 'reception';
}

interface RoleContextValue {
  user: AuthUser | null;
  role: RoleV2 | null;
  is: (...roles: RoleV2[]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getAuthUser();
  const value = useMemo<RoleContextValue>(() => {
    const role = deriveRoleV2(user);
    return {
      user,
      role,
      is: (...roles: RoleV2[]) => (role ? roles.includes(role) : false),
    };
    // user is read once per render from sessionStorage; re-derive only when this provider remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, user?.roleV2, user?.clinicId]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

/** Throws if used outside <RoleProvider>; safe to call inside any admin page. */
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

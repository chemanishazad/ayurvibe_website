import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import { getAuthToken, getAuthUser, persistAuthSession, type AuthUser } from '@/pages/Login';

const STORAGE_KEY = 'ayurvibe_admin_clinic_id';

/** Use in Select `value` / `onValueChange` because Radix Select rejects empty string. Maps to “all clinics”. */
export const ADMIN_ALL_CLINICS_VALUE = '__all_clinics__';

export type AdminClinicContextValue = {
  clinics: { id: string; name: string }[];
  clinicsLoading: boolean;
  /** Admin filter: empty = all clinics; otherwise one clinic id (persisted when set). */
  selectedClinicId: string;
  setSelectedClinicId: (id: string) => void;
  /** Admin: null = all clinics (no filter); else active clinic id. Staff: JWT clinicId (source of truth). */
  effectiveClinicId: string | null;
  isAdmin: boolean;
  /** Staff with multiple clinics: switch workspace (new JWT, full reload). */
  switchStaffClinic: (clinicId: string) => Promise<void>;
  staffClinicSwitching: boolean;
  /** Call after creating/renaming/deleting clinics so the header list updates. */
  refreshClinics: () => void;
};

const AdminClinicContext = createContext<AdminClinicContextValue | null>(null);

export function AdminClinicProvider({ children }: { children: React.ReactNode }) {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [clinicRefreshKey, setClinicRefreshKey] = useState(0);
  const [staffClinicSwitching, setStaffClinicSwitching] = useState(false);
  const [selectedClinicId, setSelectedClinicIdState] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const refreshClinics = useCallback(() => {
    setClinicRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setClinicsLoading(true);
    api.clinics
      .list()
      .then(setClinics)
      .catch(() => setClinics([]))
      .finally(() => setClinicsLoading(false));
  }, [clinicRefreshKey]);

  const setSelectedClinicId = useCallback((id: string) => {
    setSelectedClinicIdState(id);
    try {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /** Drop stale persisted id if that clinic was deleted; do not auto-pick a clinic (default = all). */
  useEffect(() => {
    if (!isAdmin || clinicsLoading || clinics.length === 0) return;
    if (!selectedClinicId) return;
    if (clinics.some((c) => c.id === selectedClinicId)) return;
    setSelectedClinicId('');
  }, [isAdmin, clinicsLoading, clinics, selectedClinicId, setSelectedClinicId]);

  /** Staff: always use clinicId from JWT so UI matches API scope (session user can be repaired in effects). */
  const effectiveClinicId = useMemo(() => {
    if (isAdmin) return selectedClinicId || null;
    const token = getAuthToken();
    const payload = decodeJwtPayload<{ clinicId?: string | null }>(token);
    return payload?.clinicId ?? user?.clinicId ?? null;
  }, [isAdmin, selectedClinicId, user?.clinicId, clinicRefreshKey]);

  /** Keep stored user.clinicId aligned with JWT after refresh or tab restore. */
  useEffect(() => {
    if (isAdmin || !user || user.role !== 'user') return;
    const token = getAuthToken();
    if (!token) return;
    const payload = decodeJwtPayload<{ clinicId?: string | null }>(token);
    const cid = payload?.clinicId;
    if (cid && user.clinicId !== cid) {
      const next: AuthUser = { ...user, clinicId: cid };
      persistAuthSession(token, next);
    }
  }, [isAdmin, user]);

  /** If JWT names a clinic no longer mapped to this user, switch to first mapped clinic. */
  useEffect(() => {
    if (isAdmin || !user || user.role !== 'user' || clinicsLoading || clinics.length === 0) return;
    const token = getAuthToken();
    const payload = decodeJwtPayload<{ clinicId?: string | null }>(token);
    const cid = payload?.clinicId;
    if (!cid) return;
    if (clinics.some((c) => c.id === cid)) return;
    const fallback = clinics[0].id;
    setStaffClinicSwitching(true);
    api.auth
      .switchClinic(fallback)
      .then((r) => {
        const u = getAuthUser();
        if (u) {
          persistAuthSession(r.token, {
            ...u,
            clinicId: r.user.clinicId,
            allowedNavPaths: r.user.allowedNavPaths ?? u.allowedNavPaths ?? null,
            staffRole: (r.user as AuthUser).staffRole ?? u.staffRole ?? null,
          });
        } else {
          persistAuthSession(r.token, r.user as AuthUser);
        }
        window.location.reload();
      })
      .catch(() => setStaffClinicSwitching(false));
  }, [isAdmin, user, clinicsLoading, clinics, clinicRefreshKey]);

  const switchStaffClinic = useCallback(async (clinicId: string) => {
    const u = getAuthUser();
    if (!u || u.role !== 'user') return;
    const cur = decodeJwtPayload<{ clinicId?: string | null }>(getAuthToken())?.clinicId;
    if (clinicId === cur) return;
    if (!clinics.some((c) => c.id === clinicId)) return;
    setStaffClinicSwitching(true);
    try {
      const r = await api.auth.switchClinic(clinicId);
      persistAuthSession(r.token, {
        ...u,
        clinicId: r.user.clinicId,
        allowedNavPaths: r.user.allowedNavPaths ?? u.allowedNavPaths ?? null,
        staffRole: (r.user as AuthUser).staffRole ?? u.staffRole ?? null,
      });
      window.location.reload();
    } catch (e) {
      setStaffClinicSwitching(false);
      throw e;
    }
  }, [clinics]);

  const value = useMemo(
    () => ({
      clinics,
      clinicsLoading,
      selectedClinicId,
      setSelectedClinicId,
      effectiveClinicId,
      isAdmin: !!isAdmin,
      switchStaffClinic,
      staffClinicSwitching,
      refreshClinics,
    }),
    [
      clinics,
      clinicsLoading,
      selectedClinicId,
      setSelectedClinicId,
      effectiveClinicId,
      isAdmin,
      switchStaffClinic,
      staffClinicSwitching,
      refreshClinics,
    ],
  );

  return <AdminClinicContext.Provider value={value}>{children}</AdminClinicContext.Provider>;
}

export function useAdminClinic(): AdminClinicContextValue {
  const ctx = useContext(AdminClinicContext);
  if (!ctx) {
    throw new Error('useAdminClinic must be used within AdminClinicProvider');
  }
  return ctx;
}

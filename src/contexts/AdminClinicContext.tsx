import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';

const STORAGE_KEY = 'ayurvibe_admin_clinic_id';

/** Use in Select `value` / `onValueChange` because Radix Select rejects empty string. Maps to “all clinics”. */
export const ADMIN_ALL_CLINICS_VALUE = '__all_clinics__';

export type AdminClinicContextValue = {
  clinics: { id: string; name: string }[];
  clinicsLoading: boolean;
  /** Admin filter: empty = all clinics; otherwise one clinic id (persisted when set). */
  selectedClinicId: string;
  setSelectedClinicId: (id: string) => void;
  /** Admin: null = all clinics (no filter); else active clinic id. Staff: JWT clinic. */
  effectiveClinicId: string | null;
  isAdmin: boolean;
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

  const effectiveClinicId = useMemo(() => {
    if (isAdmin) return selectedClinicId || null;
    return user?.clinicId ?? null;
  }, [isAdmin, selectedClinicId, user?.clinicId]);

  const value = useMemo(
    () => ({
      clinics,
      clinicsLoading,
      selectedClinicId,
      setSelectedClinicId,
      effectiveClinicId,
      isAdmin: !!isAdmin,
      refreshClinics,
    }),
    [clinics, clinicsLoading, selectedClinicId, setSelectedClinicId, effectiveClinicId, isAdmin, refreshClinics],
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

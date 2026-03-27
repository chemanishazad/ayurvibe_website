import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type PatientSearchRow = { id: string; name: string; mobile: string };

export function useConsultationPatientSearch(targetClinicId?: string) {
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchRow[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const scopedParams = useCallback(
    (params: { name?: string }) => ({
      ...params,
      ...(targetClinicId ? { clinicId: targetClinicId } : {}),
    }),
    [targetClinicId]
  );

  const searchPatients = useCallback(
    (term: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (!targetClinicId || !term || term.length < 2) {
        setPatientSearchResults([]);
        return;
      }
      searchDebounceRef.current = setTimeout(() => {
        setPatientSearching(true);
        api.patients
          .list(scopedParams({ name: term }))
          .then((data) => setPatientSearchResults((data as PatientSearchRow[]).slice(0, 15)))
          .catch(() => setPatientSearchResults([]))
          .finally(() => setPatientSearching(false));
      }, 300);
    },
    [scopedParams, targetClinicId]
  );

  const loadRecentPatients = useCallback(() => {
    if (!targetClinicId) {
      setPatientSearchResults([]);
      setPatientSearching(false);
      return;
    }
    setPatientSearching(true);
    api.patients
      .list(scopedParams({}))
      .then((data) => setPatientSearchResults((data as PatientSearchRow[]).slice(0, 10)))
      .catch(() => setPatientSearchResults([]))
      .finally(() => setPatientSearching(false));
  }, [scopedParams, targetClinicId]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  return { patientSearchResults, patientSearching, searchPatients, loadRecentPatients };
}

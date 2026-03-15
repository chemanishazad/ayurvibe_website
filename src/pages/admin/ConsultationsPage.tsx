import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Trash2, Printer, RotateCcw, CalendarIcon, Search, User, X, Loader2, Stethoscope, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BmiDisplay } from '@/components/BmiDisplay';


type ConsultationRow = Record<string, unknown> & {
  id: string;
  patientName: string;
  consultationDate: string;
  consultationTime?: string | null;
  totalAmount: string;
  parentConsultationId?: string | null;
};

const fmtDateWithTime = (date: string, time?: string | null) =>
  time ? `${format(new Date(date + 'T00:00:00'), 'dd-MM-yyyy')} ${time}` : format(new Date(date + 'T00:00:00'), 'dd-MM-yyyy');

/** Restrict numeric input: max N digits whole part, optional decimal places. */
const restrictVital = (v: string, maxWhole = 3, maxDecimal = 2): string => {
  if (!v) return '';
  const parts = v.replace(/[^\d.]/g, '').split('.');
  const whole = parts[0]?.slice(0, maxWhole) ?? '';
  if (parts.length === 1) return whole;
  const dec = parts[1]?.slice(0, maxDecimal) ?? '';
  return maxDecimal ? `${whole}.${dec}` : whole;
};

const diagnosisDisplay = (d: unknown): string => {
  if (d == null || d === '') return '';
  try {
    const parsed = typeof d === 'string' ? JSON.parse(d) : d;
    if (Array.isArray(parsed)) return parsed.map((x: { name?: string }) => x?.name).filter(Boolean).join(', ');
  } catch {}
  return String(d);
};

const ConsultationsPage = () => {
  const user = getAuthUser();
  const location = useLocation();
  const state = location.state as { patientId?: string; parentConsultationId?: string; isReview?: boolean } | null;
  const patientIdFromState = state?.patientId;
  const parentConsultationIdFromState = state?.parentConsultationId;
  const isReview = state?.isReview;

  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [medicinesMaster, setMedicinesMaster] = useState<{ id: string; name: string }[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeConsId, setActiveConsId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState('');
  const defaultPersonalHistory = () => ({
    diet: [] as string[],
    exercise: [] as string[],
    habits: [] as string[],
    bowelMovement: [] as string[],
    appetite: [] as string[],
    micturition: [] as string[],
    sleepPattern: [] as string[],
  });
  const defaultMenstrualHistory = () => ({
    menstrualCycle: '' as '' | 'Regular' | 'Irregular',
    lmp: '',
    padsPerDay: '' as string | number,
    cycleLengthDays: '' as string | number,
    cycleCountOnVisit: '' as string | number,
    clots: '' as '' | 'Yes' | 'No',
    menstrualFlow: '' as '' | 'Normal' | 'Heavy' | 'Scanty',
    dysmenorrhea: false,
    leucorrhea: false,
    menopause: false,
    menopauseAge: '' as string | number,
    gravida: '' as string | number,
    para: '' as string | number,
    abortions: '' as string | number,
  });
  const defaultAyurvedaExamination = () => ({
    naadi: '' as '' | 'V' | 'P' | 'K' | 'VP' | 'VK' | 'PK',
    malam: '' as '' | 'Regular' | 'Constipated',
    mootram: '' as '' | 'Regular' | 'Irregular',
    mootramColour: '' as '' | 'Clear' | 'White' | 'Yellow'| 'Red' ,
    jihwa: '' as '' | 'Lipta' | 'Alipta',
    shabda: '' as '' | 'Normal' | 'Abnormal',
    sparsha: [] as string[],
    drik: '' as '' | 'Normal' | 'Abnormal',
    drikColour: '' as '' | 'White' | 'Pink' | 'Red' | 'Yellow',
    aakriti: '' as '' | 'Heena' | 'Madhyama' | 'Sthula',
  });
  const [form, setForm] = useState({
    patientId: patientIdFromState || '',
    patientName: '',
    patientMedicalHistory: '',
    patientGender: '',
    doctorId: '',
    consultationDate: format(new Date(), 'yyyy-MM-dd'),
    consultationTime: format(new Date(), 'HH:mm'),
    followUpDate: '',
    symptoms: '',
    personalHistory: defaultPersonalHistory(),
    diagnosis: '',
    notes: '',
    followUpRequired: false,
    parentConsultationId: '',
    weight: '' as string | number,
    height: '' as string | number,
    bpSystolic: '' as string | number,
    bpDiastolic: '' as string | number,
    temperature: '' as string | number,
    pulse: '' as string | number,
    spo2: '' as string | number,
    cbg: '' as string | number,
    dietLifestyleAdvice: '',
    menstrualHistory: defaultMenstrualHistory(),
    ayurvedaExamination: defaultAyurvedaExamination(),
    prescription: [] as { medicineId: string; medicineName: string; dosage: string; durationDays: string | number }[],
  });
  const [prescriptionOpen, setPrescriptionOpen] = useState<number | null>(null);
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<{ id: string; name: string; mobile: string }[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [consultationErrors, setConsultationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const consultationFormErrors = (): string[] => {
    const errs: string[] = [];
    if (!form.patientId?.trim()) errs.push('Beneficiary is required');
    if (!form.doctorId?.trim()) errs.push('Doctor is required');
    if (!targetClinicId) errs.push('Clinic is required');
    if (!form.consultationDate?.trim()) errs.push('Consultation date is required');
    return errs;
  };

  const targetClinicId = user?.role === 'admin' ? clinicId : user?.clinicId;

  useEffect(() => {
    if (patientIdFromState) setForm((f) => ({ ...f, patientId: patientIdFromState }));
  }, [patientIdFromState]);

  useEffect(() => {
    if (form.patientId) {
      api.patients.get(form.patientId).then((p) => setForm((f) => ({
        ...f,
        patientName: (p.name as string) || '',
        patientMedicalHistory: (p.medicalHistory as string) || '',
        patientGender: (p.gender as string) || '',
      }))).catch(() => {});
    }
  }, [form.patientId]);


  useEffect(() => {
    if (!parentConsultationIdFromState || !isReview) return;
    api.consultations.get(parentConsultationIdFromState).then((cons) => {
      const presc = (cons.prescription as { medicineId?: string; medicineName?: string; dosage?: string; durationDays?: number }[]) || [];
      if (user?.role === 'admin' && cons.clinicId) setClinicId(cons.clinicId as string);
      let ph = defaultPersonalHistory();
      try {
        const raw = cons.personalHistory as string;
        if (raw) ph = { ...defaultPersonalHistory(), ...JSON.parse(raw) };
      } catch {}
      let mh = defaultMenstrualHistory();
      try {
        const rawMh = cons.menstrualHistory as string;
        if (rawMh) mh = { ...defaultMenstrualHistory(), ...JSON.parse(rawMh) };
      } catch {}
      let ae = defaultAyurvedaExamination();
      try {
        const rawAe = cons.ayurvedaExamination as string;
        if (rawAe) {
          const parsed = JSON.parse(rawAe) as Record<string, unknown>;
          ae = { ...defaultAyurvedaExamination(), ...parsed };
          if (parsed.sparsha != null && !Array.isArray(parsed.sparsha)) ae.sparsha = [String(parsed.sparsha)];
        }
      } catch {}
      let diagnosisText = '';
      try {
        const d = cons.diagnosis as string;
        if (d?.startsWith('[')) {
          const arr = JSON.parse(d) as { name?: string }[];
          diagnosisText = arr.map((x) => x?.name).filter(Boolean).join('\n');
        } else if (d) diagnosisText = d;
      } catch { diagnosisText = (cons.diagnosis as string) || ''; }
      setForm((f) => ({
        ...f,
        parentConsultationId: parentConsultationIdFromState,
        patientId: cons.patientId as string,
        patientGender: (cons.patientGender as string) || '',
        patientMedicalHistory: (cons.patientMedicalHistory as string) || (f.patientMedicalHistory || ''),
        doctorId: cons.doctorId as string,
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        consultationTime: format(new Date(), 'HH:mm'),
        symptoms: (cons.symptoms as string) || '',
        personalHistory: ph,
        menstrualHistory: mh,
        ayurvedaExamination: ae,
        diagnosis: diagnosisText,
        notes: (cons.notes as string) || '',
        followUpRequired: true,
        followUpDate: (cons.followUpDate as string) || '',
        weight: cons.weight != null ? String(cons.weight) : '',
        height: cons.height != null ? String(cons.height) : '',
        bpSystolic: cons.bpSystolic != null ? String(cons.bpSystolic) : '',
        bpDiastolic: cons.bpDiastolic != null ? String(cons.bpDiastolic) : '',
        temperature: cons.temperature != null ? String(cons.temperature) : '',
        pulse: cons.pulse != null ? String(cons.pulse) : '',
        spo2: cons.spo2 != null ? String(cons.spo2) : '',
        cbg: cons.cbg != null ? String(cons.cbg) : '',
        dietLifestyleAdvice: (cons.dietLifestyleAdvice as string) || '',
        prescription: presc.filter((p) => p.medicineId).map((p) => ({
          medicineId: p.medicineId!,
          medicineName: p.medicineName || 'Medicine',
          dosage: p.dosage || '',
          durationDays: p.durationDays ?? '',
        })),
      }));
    }).catch((err) => {
      // 403 = consultation from another clinic (staff can't access)
      const isAccessDenied = err?.message?.includes('Access denied') || err?.message?.includes('403');
      setForm((f) => ({ ...f, patientId: patientIdFromState || f.patientId, parentConsultationId: '' }));
      toast({
        title: isAccessDenied ? 'Previous consultation not available for your clinic' : 'Failed to load previous consultation',
        description: isAccessDenied ? 'Patient ID pre-filled. Create new consultation.' : undefined,
        variant: isAccessDenied ? 'default' : 'destructive',
      });
    });
  }, [parentConsultationIdFromState, isReview, patientIdFromState]);

  useEffect(() => {
    api.clinics.list().then((data) => {
      setClinics(data);
      if (user?.role === 'admin' && data.length > 0) setClinicId((c) => c || data[0].id);
    }).catch(() => setClinics([]));
    api.doctors.list().then(setDoctors).catch(() => setDoctors([]));
    api.medicines.list().then((data) => setMedicinesMaster((data as { id: string; name: string }[]).map((m) => ({ id: m.id, name: m.name })))).catch(() => setMedicinesMaster([]));
  }, [user?.role]);

  const loadConsultations = () => {
    setListLoading(true);
    const params: Record<string, string> = {};
    if (user?.role === 'admin' && targetClinicId) params.clinicId = targetClinicId;
    if (form.patientId?.trim()) params.patientId = form.patientId.trim();
    api.consultations.list(params)
      .then((data) => setConsultations(data as ConsultationRow[]))
      .catch(() => setConsultations([]))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadConsultations();
  }, [targetClinicId, user?.role, form.patientId]);

  const addPrescription = () => {
    const first = medicinesMaster[0];
    if (!first) return;
    setForm((f) => ({
      ...f,
      prescription: [...f.prescription, { medicineId: first.id, medicineName: first.name, dosage: '', durationDays: '' }],
    }));
    setPrescriptionOpen(form.prescription.length);
  };

  const selectPrescription = (idx: number, med: { id: string; name: string }) => {
    setForm((f) => ({
      ...f,
      prescription: f.prescription.map((p, i) =>
        i === idx ? { ...p, medicineId: med.id, medicineName: med.name } : p
      ),
    }));
    setPrescriptionOpen(null);
  };

  const removePrescription = (idx: number) => {
    setForm((f) => ({ ...f, prescription: f.prescription.filter((_, i) => i !== idx) }));
  };

  const updatePrescription = (idx: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      prescription: f.prescription.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    }));
  };

  const toNum = (v: string | number) => (v === '' || v == null ? undefined : Number(v));

  const handleSubmit = async () => {
    const errs = consultationFormErrors();
    setConsultationErrors(errs);
    if (errs.length > 0) {
      toast({ title: 'Validation error', description: errs[0], variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const created = await api.consultations.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        clinicId: targetClinicId,
        consultationDate: form.consultationDate,
        consultationTime: form.consultationTime || undefined,
        patientMedicalHistory: form.patientMedicalHistory,
        symptoms: form.symptoms || undefined,
        personalHistory: form.personalHistory,
        diagnosis: form.diagnosis?.trim() || undefined,
        notes: form.notes || undefined,
        consultationFee: 0,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpDate || undefined,
        parentConsultationId: form.parentConsultationId || undefined,
        weight: toNum(form.weight),
        height: toNum(form.height),
        bpSystolic: toNum(form.bpSystolic),
        bpDiastolic: toNum(form.bpDiastolic),
        temperature: toNum(form.temperature),
        pulse: toNum(form.pulse),
        spo2: toNum(form.spo2),
        cbg: toNum(form.cbg),
        dietLifestyleAdvice: form.dietLifestyleAdvice || undefined,
        menstrualHistory: form.patientGender?.toLowerCase() === 'female' ? form.menstrualHistory : undefined,
        ayurvedaExamination: form.ayurvedaExamination,
        prescription: form.prescription.filter((p) => p.medicineId).map((p) => ({
          medicineId: p.medicineId,
          dosage: p.dosage || undefined,
          durationDays: toNum(p.durationDays),
        })),
      }) as { id?: string };
      setConsultationErrors([]);
      toast({ title: 'Consultation saved', description: 'Prescription recorded. Add fee & medicines at Pharmacy.' });
      const savedPatientId = form.patientId;
      const savedPatientName = form.patientName;
      setForm({
        patientId: savedPatientId,
        patientName: savedPatientName,
        patientMedicalHistory: form.patientMedicalHistory,
        patientGender: form.patientGender,
        doctorId: '',
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        consultationTime: format(new Date(), 'HH:mm'),
        followUpDate: '',
        symptoms: '',
        personalHistory: defaultPersonalHistory(),
        menstrualHistory: defaultMenstrualHistory(),
        ayurvedaExamination: defaultAyurvedaExamination(),
        diagnosis: '',
        notes: '',
        followUpRequired: false,
        parentConsultationId: '',
        weight: '',
        height: '',
        bpSystolic: '',
        bpDiastolic: '',
        temperature: '',
        pulse: '',
        spo2: '',
        cbg: '',
        dietLifestyleAdvice: '',
        prescription: [],
      });
      loadConsultations();
      if (created?.id) {
        api.consultations.get(created.id).then((data) => {
          try { localStorage.setItem(`print_consult_${created.id}`, JSON.stringify(data)); } catch {}
          window.open(`${window.location.origin}/print/consultation/${created.id}`, '_blank', 'noopener,noreferrer');
        }).catch(() => {
          window.open(`${window.location.origin}/print/consultation/${created.id}`, '_blank', 'noopener,noreferrer');
        });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    api.consultations.get(id).then((data) => {
      try { localStorage.setItem(`print_consult_${id}`, JSON.stringify(data)); } catch {}
      window.open(`${window.location.origin}/print/consultation/${id}`, '_blank', 'noopener,noreferrer');
    }).catch(() => toast({ title: 'Failed to load', variant: 'destructive' }));
  };

  const openNewConsultation = () => {
    setActiveConsId(null);
    setConsultationErrors([]);
    setForm({
      patientId: '',
      patientName: '',
      patientMedicalHistory: '',
      patientGender: '',
      doctorId: '',
      consultationDate: format(new Date(), 'yyyy-MM-dd'),
      consultationTime: format(new Date(), 'HH:mm'),
      followUpDate: '',
      symptoms: '',
      personalHistory: defaultPersonalHistory(),
      menstrualHistory: defaultMenstrualHistory(),
      ayurvedaExamination: defaultAyurvedaExamination(),
      diagnosis: '',
      notes: '',
      followUpRequired: false,
      parentConsultationId: '',
      weight: '',
      height: '',
      bpSystolic: '',
      bpDiastolic: '',
      temperature: '',
      pulse: '',
      spo2: '',
      cbg: '',
      dietLifestyleAdvice: '',
      prescription: [],
    });
  };

  const loadConsultationForFollowUp = (consultationId: string) => {
    api.consultations.get(consultationId).then((data) => {
      const presc = (data.prescription as { medicineId?: string; medicineName?: string; dosage?: string; durationDays?: number }[]) || [];
      const d = data as Record<string, unknown>;
      let ph = defaultPersonalHistory();
      try {
        const raw = d.personalHistory as string;
        if (raw) ph = { ...defaultPersonalHistory(), ...JSON.parse(raw) };
      } catch {}
      let mh = defaultMenstrualHistory();
      try {
        const rawMh = d.menstrualHistory as string;
        if (rawMh) mh = { ...defaultMenstrualHistory(), ...JSON.parse(rawMh) };
      } catch {}
      let ae = defaultAyurvedaExamination();
      try {
        const rawAe = d.ayurvedaExamination as string;
        if (rawAe) {
          const parsed = JSON.parse(rawAe) as Record<string, unknown>;
          ae = { ...defaultAyurvedaExamination(), ...parsed };
          if (parsed.sparsha != null && !Array.isArray(parsed.sparsha)) ae.sparsha = [String(parsed.sparsha)];
        }
      } catch {}
      let diagnosisText = '';
      try {
        const diag = d.diagnosis as string;
        if (diag?.startsWith('[')) {
          const arr = JSON.parse(diag) as { name?: string }[];
          diagnosisText = arr.map((x) => x?.name).filter(Boolean).join('\n');
        } else if (diag) diagnosisText = diag;
      } catch { diagnosisText = (d.diagnosis as string) || ''; }
      setForm((f) => ({
        ...f,
        patientId: data.patientId as string,
        patientName: data.patientName as string,
        patientMedicalHistory: (d.patientMedicalHistory as string) || f.patientMedicalHistory || '',
        patientGender: (d.patientGender as string) || '',
        menstrualHistory: mh,
        ayurvedaExamination: ae,
        doctorId: data.doctorId as string,
        parentConsultationId: consultationId,
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        consultationTime: format(new Date(), 'HH:mm'),
        followUpRequired: true,
        symptoms: (data.symptoms as string) || '',
        personalHistory: ph,
        diagnosis: diagnosisText,
        notes: (data.notes as string) || '',
        weight: d.weight != null ? String(d.weight) : '',
        height: d.height != null ? String(d.height) : '',
        bpSystolic: d.bpSystolic != null ? String(d.bpSystolic) : '',
        bpDiastolic: d.bpDiastolic != null ? String(d.bpDiastolic) : '',
        temperature: d.temperature != null ? String(d.temperature) : '',
        pulse: d.pulse != null ? String(d.pulse) : '',
        spo2: d.spo2 != null ? String(d.spo2) : '',
        cbg: d.cbg != null ? String(d.cbg) : '',
        dietLifestyleAdvice: (d.dietLifestyleAdvice as string) || '',
        prescription: presc.filter((p) => p.medicineId).map((p) => ({
          medicineId: p.medicineId!,
          medicineName: p.medicineName || 'Medicine',
          dosage: p.dosage || '',
          durationDays: p.durationDays ?? '',
        })),
      }));
    }).catch(() => toast({ title: 'Failed to load details', variant: 'destructive' }));
  };

  const viewConsultationDetails = (cons: ConsultationRow) => {
    setActiveConsId(cons.id);
    loadConsultationForFollowUp(cons.id);
  };

  const openFollowUp = (cons: ConsultationRow) => {
    viewConsultationDetails(cons);
  };

  /** Group consultations: initial visits with follow-ups nested. Orphan follow-ups shown separately. */
  const { consultationGroups, orphanFollowUps } = React.useMemo(() => {
    const initials = consultations.filter((c) => !c.parentConsultationId).sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    const initialIds = new Set(initials.map((i) => i.id));
    const byParent = new Map<string, ConsultationRow[]>();
    const orphans: ConsultationRow[] = [];
    for (const c of consultations) {
      if (c.parentConsultationId) {
        if (initialIds.has(c.parentConsultationId as string)) {
          const list = byParent.get(c.parentConsultationId as string) || [];
          list.push(c);
          byParent.set(c.parentConsultationId as string, list);
        } else {
          orphans.push(c);
        }
      }
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    }
    orphans.sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    const groups = initials.map((init) => ({ initial: init, followUps: byParent.get(init.id) || [] }));
    return { consultationGroups: groups, orphanFollowUps: orphans };
  }, [consultations]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchPatients = (term: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!term || term.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      setPatientSearching(true);
      api.patients.list({ name: term })
        .then((data) => setPatientSearchResults((data as { id: string; name: string; mobile: string }[]).slice(0, 15)))
        .catch(() => setPatientSearchResults([]))
        .finally(() => setPatientSearching(false));
    }, 300);
  };

  const loadRecentPatients = () => {
    setPatientSearching(true);
    api.patients.list({})
      .then((data) => setPatientSearchResults((data as { id: string; name: string; mobile: string }[]).slice(0, 10)))
      .catch(() => setPatientSearchResults([]))
      .finally(() => setPatientSearching(false));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
        <PageHeader title="Consultations" />
        {user?.role === 'admin' && clinics.length > 0 && (
          <Select value={clinicId || undefined} onValueChange={(v) => { setClinicId(v); setConsultationErrors((e) => e.filter((x) => !x.includes('Clinic'))); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(400px,1.5fr)] gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left: Old records — select for follow-up or new consult */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">
                  {form.patientId ? form.patientName || 'Beneficiary' : 'Consultation Records'}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {form.patientId ? 'This patient only. ' : ''}Click a record to view, add follow-up, or start new consult.
                </CardDescription>
              </div>
              {form.patientId && (
                <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, patientId: '', patientName: '' }))} className="shrink-0">
                  Show all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading records...</p>
              </div>
            ) : consultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">No consultations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Select a beneficiary to filter or create a new consultation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orphanFollowUps.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-1 mb-1">Other follow-ups</p>
                    {orphanFollowUps.map((f) => (
                      <div
                        key={f.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => viewConsultationDetails(f)}
                        onKeyDown={(e) => e.key === 'Enter' && viewConsultationDetails(f)}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 border-l-4 border-l-amber-400',
                          activeConsId === f.id ? 'ring-2 ring-primary border-primary/30 bg-primary/5 shadow-sm' : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{form.patientId ? fmtDateWithTime(f.consultationDate as string, f.consultationTime) : f.patientName}</p>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                              <FileText className="h-3 w-3" /> Follow-up
                            </span>
                          </div>
                          {f.diagnosis && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{diagnosisDisplay(f.diagnosis)}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openFollowUp(f)} title="Add follow-up">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrint(f.id)} title="Print">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {consultationGroups.map(({ initial, followUps }) => (
                  <div key={initial.id} className="space-y-1">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => viewConsultationDetails(initial)}
                      onKeyDown={(e) => e.key === 'Enter' && viewConsultationDetails(initial)}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-lg border-2 border-l-4 border-l-primary p-3.5 cursor-pointer transition-all duration-200 bg-primary/5',
                        activeConsId === initial.id ? 'ring-2 ring-primary border-primary/50 shadow-sm' : 'hover:bg-primary/10 hover:border-primary/30'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{form.patientId ? fmtDateWithTime(initial.consultationDate as string, initial.consultationTime) : initial.patientName}</p>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold border border-primary/30">
                            <Stethoscope className="h-3.5 w-3.5" /> Initial Visit
                          </span>
                        </div>
                        {initial.diagnosis && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{diagnosisDisplay(initial.diagnosis)}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openFollowUp(initial)} title="Add follow-up">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(initial.id)} title="Print">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {followUps.length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-amber-200 dark:border-amber-800 space-y-1">
                        {followUps.map((f) => (
                          <div
                            key={f.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => viewConsultationDetails(f)}
                            onKeyDown={(e) => e.key === 'Enter' && viewConsultationDetails(f)}
                            className={cn(
                              'flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 border-l-4 border-l-amber-400',
                              activeConsId === f.id ? 'ring-2 ring-primary border-primary/30 bg-primary/5 shadow-sm' : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{form.patientId ? fmtDateWithTime(f.consultationDate as string, f.consultationTime) : f.patientName}</p>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-semibold border border-amber-200/60">
                                  <FileText className="h-3 w-3" /> Follow-up
                                </span>
                              </div>
                              {f.diagnosis && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{diagnosisDisplay(f.diagnosis)}</p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openFollowUp(f)} title="Add follow-up">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrint(f.id)} title="Print">
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: New/Edit form */}
        <Card className="flex flex-col min-h-0 overflow-hidden border-l-0 lg:border-l">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 shrink-0">
            <div>
              <CardTitle className="text-lg">
                {form.parentConsultationId ? 'Add Follow-up' : 'New Initial Visit'}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {form.parentConsultationId
                  ? 'Data copied from previous visit. Edit and save as follow-up.'
                  : 'Select patient, doctor, date and prescription (medicine, dose, duration).'}
              </CardDescription>
            </div>
            <Button onClick={openNewConsultation} disabled={!targetClinicId} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> New Initial Visit
            </Button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0">
          <div className="space-y-4">
            {consultationErrors.length > 0 && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <ul className="list-disc list-inside space-y-0.5">
                  {consultationErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Beneficiary <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Popover open={patientSearchOpen} onOpenChange={(open) => { setPatientSearchOpen(open); if (open) loadRecentPatients(); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className={cn('flex-1 justify-between font-normal h-10', !form.patientName && 'text-muted-foreground', consultationErrors.some((e) => e.includes('Beneficiary')) && 'border-destructive')}>
                      <span className="truncate">{form.patientName || 'Search beneficiary by name...'}</span>
                      <Search className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type to search (2+ chars)..."
                      onValueChange={(v) => searchPatients(v)}
                    />
                    <CommandList>
                      {patientSearching && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {!patientSearching && (
                        <>
                          <CommandEmpty>No beneficiary found. Try different search.</CommandEmpty>
                          <CommandGroup>
                            {patientSearchResults.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.id}
                                onSelect={() => {
                                  setForm((f) => ({ ...f, patientId: p.id, patientName: p.name }));
                                  setPatientSearchOpen(false);
                                  setConsultationErrors((e) => e.filter((x) => !x.includes('Beneficiary')));
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-xs text-muted-foreground">{p.mobile}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.patientName && (
                <Button size="icon" variant="ghost" className="shrink-0 h-10 w-10" onClick={() => { setForm((f) => ({ ...f, patientId: '', patientName: '', patientMedicalHistory: '', patientGender: '', menstrualHistory: defaultMenstrualHistory(), ayurvedaExamination: defaultAyurvedaExamination() })); setConsultationErrors((e) => e.filter((x) => !x.includes('Beneficiary'))); }} title="Clear beneficiary">
                  <X className="h-4 w-4" />
                </Button>
              )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Doctor <span className="text-destructive">*</span></Label>
                <Select value={form.doctorId} onValueChange={(v) => { setForm((f) => ({ ...f, doctorId: v })); setConsultationErrors((e) => e.filter((x) => !x.includes('Doctor'))); }}>
                  <SelectTrigger className={cn('h-10', consultationErrors.some((e) => e.includes('Doctor')) && 'border-destructive')}><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  className={cn('h-10', consultationErrors.some((e) => e.includes('date')) && 'border-destructive')}
                  value={form.consultationDate}
                  onChange={(e) => { setForm((f) => ({ ...f, consultationDate: e.target.value })); setConsultationErrors((e) => e.filter((x) => !x.includes('date'))); }}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  className="h-10"
                  value={form.consultationTime}
                  onChange={(e) => setForm((f) => ({ ...f, consultationTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div>
                <Label className="text-xs">Weight (kgs)</Label>
                <Input type="text" inputMode="decimal" className="h-9" placeholder="—" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: restrictVital(e.target.value, 3, 2) }))} />
              </div>
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input type="text" inputMode="decimal" className="h-9" placeholder="—" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: restrictVital(e.target.value, 3, 2) }))} />
              </div>
              <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                <BmiDisplay weight={toNum(form.weight)} height={toNum(form.height)} compact />
              </div>
              <div>
                <Label className="text-xs">BP (mmHg)</Label>
                <div className="flex gap-1 items-center">
                  <Input type="text" inputMode="numeric" className="h-9 w-14" placeholder="—" value={form.bpSystolic} onChange={(e) => setForm((f) => ({ ...f, bpSystolic: restrictVital(e.target.value, 3, 0) }))} />
                  <span className="text-muted-foreground">/</span>
                  <Input type="text" inputMode="numeric" className="h-9 w-14" placeholder="—" value={form.bpDiastolic} onChange={(e) => setForm((f) => ({ ...f, bpDiastolic: restrictVital(e.target.value, 3, 0) }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Temperature</Label>
                <Input type="text" inputMode="decimal" className="h-9" placeholder="—" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: restrictVital(e.target.value, 3, 2) }))} />
              </div>
              <div>
                <Label className="text-xs">Pulse (bpm)</Label>
                <Input type="text" inputMode="numeric" className="h-9" placeholder="—" value={form.pulse} onChange={(e) => setForm((f) => ({ ...f, pulse: restrictVital(e.target.value, 3, 0) }))} />
              </div>
              <div>
                <Label className="text-xs">SpO2 (%)</Label>
                <Input type="text" inputMode="numeric" className="h-9" placeholder="—" value={form.spo2} onChange={(e) => setForm((f) => ({ ...f, spo2: restrictVital(e.target.value, 3, 0) }))} />
              </div>
              <div>
                <Label className="text-xs">CBG (mg/dL)</Label>
                <Input type="text" inputMode="decimal" className="h-9" placeholder="—" value={form.cbg} onChange={(e) => setForm((f) => ({ ...f, cbg: restrictVital(e.target.value, 3, 2) }))} />
              </div>
            </div>
            <div className="pt-4 border-t space-y-4">
            <div>
              <Label>Present Complaint with duration</Label>
              <Textarea value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} placeholder="Describe complaint and duration (e.g. Headache for 3 days)" rows={2} className="resize-none" />
            </div>
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <Label className="text-sm font-semibold">Personal History</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Diet</p>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.diet.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              diet: e.target.checked ? [...f.personalHistory.diet, opt] : f.personalHistory.diet.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Exercise / Physical Activity</p>
                  <div className="flex flex-wrap gap-2">
                    {['Regular', 'Moderate', 'Minimal', 'None'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.exercise.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              exercise: e.target.checked ? [...f.personalHistory.exercise, opt] : f.personalHistory.exercise.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Habits / Addictions</p>
                  <div className="flex flex-wrap gap-2">
                    {['Alcohol', 'Smoking', 'Tobacco', 'None'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.habits.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              habits: e.target.checked ? [...f.personalHistory.habits, opt] : f.personalHistory.habits.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Bowel Movement</p>
                  <div className="flex flex-wrap gap-2">
                    {['Regular', 'Irregular', 'Constipation'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.bowelMovement.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              bowelMovement: e.target.checked ? [...f.personalHistory.bowelMovement, opt] : f.personalHistory.bowelMovement.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Appetite</p>
                  <div className="flex flex-wrap gap-2">
                    {['Good', 'Moderate', 'Poor'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.appetite.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              appetite: e.target.checked ? [...f.personalHistory.appetite, opt] : f.personalHistory.appetite.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Micturition (Urination)</p>
                  <div className="flex flex-wrap gap-2">
                    {['Regular', 'Irregular', 'Burning', 'Frequent'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.micturition.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              micturition: e.target.checked ? [...f.personalHistory.micturition, opt] : f.personalHistory.micturition.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Sleep Pattern</p>
                  <div className="flex flex-wrap gap-2">
                    {['Sound', 'Disturbed', 'Insomnia'].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.personalHistory.sleepPattern.includes(opt)} onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            personalHistory: {
                              ...f.personalHistory,
                              sleepPattern: e.target.checked ? [...f.personalHistory.sleepPattern, opt] : f.personalHistory.sleepPattern.filter((x) => x !== opt),
                            },
                          }));
                        }} className="rounded border-input" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {form.patientGender?.toLowerCase() === 'female' && (
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30 border-rose-200">
                <Label className="text-sm font-semibold">Menstrual History</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Menstrual Cycle</p>
                    <div className="flex gap-4">
                      {(['Regular', 'Irregular'] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="menstrualCycle" checked={form.menstrualHistory.menstrualCycle === opt} onChange={() => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, menstrualCycle: opt } }))} className="rounded border-input" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Last Menstrual Period (LMP)</Label>
                    <Input type="date" className="h-9 mt-0.5" value={form.menstrualHistory.lmp} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, lmp: e.target.value } }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Per day pads count (During Period)</Label>
                    <Input type="number" className="h-9 mt-0.5" min={0} placeholder="—" value={form.menstrualHistory.padsPerDay} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, padsPerDay: e.target.value } }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Cycle Length (days)</Label>
                    <Input type="number" className="h-9 mt-0.5 w-20" min={1} max={99} placeholder="—" value={form.menstrualHistory.cycleLengthDays} onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') return setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, cycleLengthDays: '' } }));
                      const n = parseInt(v, 10);
                      if (isNaN(n) || n < 1) return;
                      setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, cycleLengthDays: n > 99 ? 99 : v } }));
                    }} />
                  </div>
                  <div>
                    <Label className="text-xs">Day's of Cycle</Label>
                    <Input type="number" className="h-9 mt-0.5 w-20" min={1} max={99} placeholder="—" value={form.menstrualHistory.cycleCountOnVisit} onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') return setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, cycleCountOnVisit: '' } }));
                      const n = parseInt(v, 10);
                      if (isNaN(n) || n < 1) return;
                      setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, cycleCountOnVisit: n > 99 ? 99 : v } }));
                    }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Clots</p>
                    <div className="flex gap-4">
                      {(['Yes', 'No'] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="clots" checked={form.menstrualHistory.clots === opt} onChange={() => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, clots: opt } }))} className="rounded border-input" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Menstrual Flow</p>
                    <div className="flex gap-3 flex-wrap">
                      {(['Normal', 'Heavy', 'Scanty'] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="menstrualFlow" checked={form.menstrualHistory.menstrualFlow === opt} onChange={() => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, menstrualFlow: opt } }))} className="rounded border-input" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.menstrualHistory.dysmenorrhea} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, dysmenorrhea: e.target.checked } }))} className="rounded border-input" />
                      <span>Dysmenorrhea (Pain During Periods)</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.menstrualHistory.leucorrhea} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, leucorrhea: e.target.checked } }))} className="rounded border-input" />
                      <span>Leucorrhea (White Discharge)</span>
                    </label>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Menopause</p>
                    <div className="flex gap-4">
                      {(['No', 'Yes'] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="menopause" checked={(opt === 'Yes') === form.menstrualHistory.menopause} onChange={() => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, menopause: opt === 'Yes' } }))} className="rounded border-input" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {form.menstrualHistory.menopause && (
                    <div>
                      <Label className="text-xs">Age at Menopause</Label>
                      <Input type="number" className="h-9 mt-0.5" min={0} placeholder="—" value={form.menstrualHistory.menopauseAge} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, menopauseAge: e.target.value } }))} />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Pregnancy History (if applicable)</p>
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Gravida:</Label>
                        <Input type="number" className="h-9 w-16" min={0} value={form.menstrualHistory.gravida} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, gravida: e.target.value } }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Para:</Label>
                        <Input type="number" className="h-9 w-16" min={0} value={form.menstrualHistory.para} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, para: e.target.value } }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Abortions:</Label>
                        <Input type="number" className="h-9 w-16" min={0} value={form.menstrualHistory.abortions} onChange={(e) => setForm((f) => ({ ...f, menstrualHistory: { ...f.menstrualHistory, abortions: e.target.value } }))} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <Label className="text-sm font-semibold">Ayurvedic Examinations</Label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium">Parameter</th>
                      <th className="text-left py-2 px-2 font-medium">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Naadi (Pulse)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex flex-wrap gap-2">
                          {(['V', 'P', 'K', 'VP', 'VK', 'PK'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="naadi" checked={form.ayurvedaExamination.naadi === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, naadi: opt } }))} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Malam (Stool)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex gap-3">
                          {(['Regular', 'Constipated'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="malam" checked={form.ayurvedaExamination.malam === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, malam: opt } }))} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Mootram (Urine)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <div className="flex gap-3 items-center">
                            <span className="text-xs text-muted-foreground">Flow:</span>
                            {(['Regular', 'Irregular'] as const).map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="mootram" checked={form.ayurvedaExamination.mootram === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, mootram: opt } }))} className="rounded border-input" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-3 items-center">
                            <span className="text-xs text-muted-foreground">Colour:</span>
                            {(['Clear', 'White', 'Yellow', 'Red'] as const).map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="mootramColour" checked={form.ayurvedaExamination.mootramColour === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, mootramColour: opt } }))} className="rounded border-input" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Jihwa (Tongue)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex gap-3">
                          {(['Lipta', 'Alipta'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="jihwa" checked={form.ayurvedaExamination.jihwa === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, jihwa: opt } }))} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Shabda (Voice)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex gap-3">
                          {(['Normal', 'Abnormal'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="shabda" checked={form.ayurvedaExamination.shabda === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, shabda: opt } }))} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Sparsha (Touch)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex flex-wrap gap-2">
                          {(['Ushna', 'Sheeta', 'Ruksha', 'Mrudu'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={(Array.isArray(form.ayurvedaExamination.sparsha) ? form.ayurvedaExamination.sparsha : []).includes(opt)} onChange={(e) => {
                                const arr = Array.isArray(form.ayurvedaExamination.sparsha) ? form.ayurvedaExamination.sparsha : [];
                                setForm((f) => ({
                                  ...f,
                                  ayurvedaExamination: {
                                    ...f.ayurvedaExamination,
                                    sparsha: e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt),
                                  },
                                }));
                              }} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Drik (Eyes)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <div className="flex gap-3 items-center">
                            <span className="text-xs text-muted-foreground">Status:</span>
                            {(['Normal', 'Abnormal'] as const).map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="drik" checked={form.ayurvedaExamination.drik === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, drik: opt } }))} className="rounded border-input" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-3 items-center">
                            <span className="text-xs text-muted-foreground">Colour:</span>
                            {(['White', 'Pink', 'Red', 'Yellow'] as const).map((opt) => (
                              <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="drikColour" checked={form.ayurvedaExamination.drikColour === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, drikColour: opt } }))} className="rounded border-input" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 px-2 font-medium">Aakriti (Physique)</td>
                      <td className="py-1.5 px-2">
                        <div className="flex gap-3">
                          {(['Heena', 'Madhyama', 'Sthula'] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                              <input type="radio" name="aakriti" checked={form.ayurvedaExamination.aakriti === opt} onChange={() => setForm((f) => ({ ...f, ayurvedaExamination: { ...f.ayurvedaExamination, aakriti: opt } }))} className="rounded border-input" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <Label>Medical History</Label>
              <Textarea value={form.patientMedicalHistory} onChange={(e) => setForm((f) => ({ ...f, patientMedicalHistory: e.target.value }))} placeholder="From beneficiary record" rows={2} className="resize-none" />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnosis (one or more lines)" rows={3} className="resize-none" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
            </div>
            <div>
              <Label>Diet / Lifestyle Advice</Label>
              <Textarea value={form.dietLifestyleAdvice} onChange={(e) => setForm((f) => ({ ...f, dietLifestyleAdvice: e.target.value }))} placeholder="Diet advice, lifestyle recommendations..." rows={2} className="resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUp"
                checked={form.followUpRequired}
                onChange={(e) => setForm((f) => ({ ...f, followUpRequired: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="followUp" className="font-normal cursor-pointer">Follow-up required</Label>
            </div>
            {form.followUpRequired && (
              <div>
                <Label>Follow-up date (return by)</Label>
                <Popover open={followUpDateOpen} onOpenChange={setFollowUpDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !form.followUpDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.followUpDate ? format(new Date(form.followUpDate), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.followUpDate ? new Date(form.followUpDate) : undefined}
                      onSelect={(d) => {
                        setForm((f) => ({ ...f, followUpDate: d ? format(d, 'yyyy-MM-dd') : '' }));
                        setFollowUpDateOpen(false);
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {consultations.length > 0 && !form.parentConsultationId && (
              <div>
                <Label>Link to previous (follow-up)</Label>
                <Select value={form.parentConsultationId || '__none__'} onValueChange={(v) => {
                  const id = v === '__none__' ? '' : v;
                  setForm((f) => ({ ...f, parentConsultationId: id }));
                  if (id) loadConsultationForFollowUp(id);
                }}>
                  <SelectTrigger><SelectValue placeholder="None (new consultation)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None – new consultation</SelectItem>
                    {consultations.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.patientName} – {fmtDateWithTime(c.consultationDate as string, c.consultationTime)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">Section 1 — Prescription (what doctor prescribes)</Label>
                <Button size="sm" variant="outline" onClick={addPrescription} disabled={medicinesMaster.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {form.prescription.length > 0 && (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-2 px-3 font-medium">Medicine</th>
                        <th className="text-left py-2 px-3 font-medium">Dosage</th>
                        <th className="text-left py-2 px-3 font-medium w-20">Duration</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.prescription.map((p, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 px-3">
                            <Popover open={prescriptionOpen === i} onOpenChange={(o) => setPrescriptionOpen(o ? i : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" size="sm" className="w-full justify-between font-normal">
                                  {p.medicineName || 'Select medicine'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search medicine..." />
                                  <CommandList>
                                    <CommandEmpty>No medicine found</CommandEmpty>
                                    <CommandGroup>
                                      {medicinesMaster.map((med) => (
                                        <CommandItem key={med.id} value={med.name} onSelect={() => selectPrescription(i, med)}>
                                          {med.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="py-2 px-3">
                            <Input className="h-8 w-28" placeholder="e.g. 1 tab BD" value={p.dosage} onChange={(e) => updatePrescription(i, 'dosage', e.target.value)} />
                          </td>
                          <td className="py-2 px-3">
                            <Input type="number" className="h-8 w-16" placeholder="days" value={p.durationDays} onChange={(e) => updatePrescription(i, 'durationDays', e.target.value)} min={0} />
                          </td>
                          <td className="py-2 px-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removePrescription(i)}><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={loading || !targetClinicId} className="w-full h-11 font-medium" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save & Print'}
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsultationsPage;

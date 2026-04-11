import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import FullScreenLoader from '@/components/FullScreenLoader';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import {
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  CalendarIcon,
  Search,
  User,
  X,
  Loader2,
  Stethoscope,
  FileText,
  Link2,
  HeartPulse,
  Scale,
  Ruler,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Pill,
  ClipboardList,
  History,
  StickyNote,
  UtensilsCrossed,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatAppDate, formatHhmmToAmPm } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { BmiDisplay } from '@/components/BmiDisplay';
import { ConsultationListTable } from '@/pages/admin/ConsultationListTable';
import { useConsultationPatientSearch } from '@/pages/admin/hooks/useConsultationPatientSearch';
import { openConsultationPrint, saveConsultationPrintPayload } from '@/lib/print-handoff';
import ConsultationsTopBar from '@/pages/admin/consultations/ConsultationsTopBar';
import ClinicSelectionNotice from '@/pages/admin/consultations/ClinicSelectionNotice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ConsultationRow = Record<string, unknown> & {
  id: string;
  patientName: string;
  patientMobile?: string | null;
  patientAge?: number | null;
  patientAgeUnit?: string | null;
  patientGender?: string | null;
  consultationDate: string;
  consultationTime?: string | null;
  totalAmount: string;
  parentConsultationId?: string | null;
  parentConsultationDate?: string | null;
  parentConsultationTime?: string | null;
  parentDiagnosis?: string | null;
  followUpRequired?: number;
  followUpDate?: string | null;
  weight?: unknown;
  height?: unknown;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  temperature?: unknown;
  pulse?: number | null;
  spo2?: number | null;
  cbg?: unknown;
};

type PrescriptionItem = {
  /** Empty when the row is a new medicine name (created on save). */
  medicineId: string;
  medicineName: string;
  dosage: string;
  durationDays: string | number;
  timeMorning: boolean;
  timeAfternoon: boolean;
  timeNight: boolean;
  foodRelation: '' | 'before_food' | 'after_food';
  quantity: string;
  withHotWater: boolean;
  withMilk: boolean;
  withHoney: boolean;
  withGhee: boolean;
  withGingerJuice: boolean;
  withLemonJuice: boolean;
};

const fmtDateWithTime = (date: string, time?: string | null) =>
  time
    ? `${formatAppDate(date + 'T12:00:00')} ${formatHhmmToAmPm(time)}`
    : formatAppDate(date + 'T12:00:00');

/** Restrict numeric input: max N digits whole part, optional decimal places. */
const restrictVital = (v: string, maxWhole = 3, maxDecimal = 2): string => {
  if (!v) return '';
  const parts = v.replace(/[^\d.]/g, '').split('.');
  const whole = parts[0]?.slice(0, maxWhole) ?? '';
  if (parts.length === 1) return whole;
  const dec = parts[1]?.slice(0, maxDecimal) ?? '';
  return maxDecimal ? `${whole}.${dec}` : whole;
};

/** Weight / height: whole number only, max 3 digits (0–999), for load from API. */
const wholeVitalFromApi = (v: unknown): string => {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const w = Math.round(Math.abs(n));
  return String(Math.min(999, w));
};

const diagnosisDisplay = (d: unknown): string => {
  if (d == null || d === '') return '';
  try {
    const parsed = typeof d === 'string' ? JSON.parse(d) : d;
    if (Array.isArray(parsed)) return parsed.map((x: { name?: string }) => x?.name).filter(Boolean).join(', ');
  } catch {}
  return String(d);
};

const patientInitials = (name: string) => {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ConsultationsPage = () => {
  const user = getAuthUser();
  const isNurseStaff = user?.role === 'nurse' || (user?.role === 'user' && user?.staffRole === 'nurse');
  const { effectiveClinicId, setSelectedClinicId } = useAdminClinic();
  const targetClinicId = effectiveClinicId ?? undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const consultationIdFromRoute = params.id;
  const path = location.pathname.replace(/\/$/, '') || '/';
  const isOpSection = path.startsWith('/admin/op');
  const isConsultationsNew = path.endsWith('/consultations/new');
  const isOpNew = path.endsWith('/op/new');
  const isNewRoute = isConsultationsNew || isOpNew;
  const isConsultationViewRoute =
    /^\/admin\/consultations\/[^/]+$/.test(path) && !path.endsWith('/consultations/new');
  const isOpDoctorCompleteRoute =
    Boolean(isOpSection && consultationIdFromRoute && /^\/admin\/op\/[^/]+$/.test(path) && !path.endsWith('/op/new'));
  const isFormRoute = isNewRoute || isOpDoctorCompleteRoute;
  const isListRoute = !isConsultationViewRoute && !isFormRoute;
  const isViewRoute = isConsultationViewRoute;
  const isOpListView = isOpSection && isListRoute;
  const state = location.state as { patientId?: string; parentConsultationId?: string; isReview?: boolean } | null;
  const patientIdFromState = state?.patientId;
  const parentConsultationIdFromState = state?.parentConsultationId;
  const isReview = state?.isReview;

  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const linkedDoctorId = (user?.linkedDoctorId ?? '').trim();
  const isDoctorLogin = user?.role === 'doctor';
  const defaultDoctorIdForUser = useMemo(() => {
    if (linkedDoctorId && doctors.some((d) => d.id === linkedDoctorId)) {
      return linkedDoctorId;
    }
    if (isDoctorLogin) {
      return linkedDoctorId;
    }
    // Legacy fallback for old "user" role.
    if (user?.role === 'user' && doctors.length > 0) {
      return doctors[0].id;
    }
    return '';
  }, [doctors, linkedDoctorId, isDoctorLogin, user?.role]);
  const forceMappedDoctorReadOnly = Boolean(isDoctorLogin && linkedDoctorId);
  const [medicinesMaster, setMedicinesMaster] = useState<{ id: string; name: string }[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeConsId, setActiveConsId] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [opFormLoading, setOpFormLoading] = useState(false);
  const [viewConsultation, setViewConsultation] = useState<Record<string, unknown> | null>(null);
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
    prescription: [] as PrescriptionItem[],
  });
  const [prescriptionOpen, setPrescriptionOpen] = useState<number | null>(null);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');

  useEffect(() => {
    if (prescriptionOpen == null) setPrescriptionSearch('');
  }, [prescriptionOpen]);
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [consultationErrors, setConsultationErrors] = useState<string[]>([]);
  const [patientHistory, setPatientHistory] = useState<ConsultationRow[]>([]);
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  const { toast } = useToast();
  const clinicSelectionRequired = !!(user?.role === 'admin' && !targetClinicId);
  const { patientSearchResults, patientSearching, searchPatients, loadRecentPatients } =
    useConsultationPatientSearch(targetClinicId);

  const consultationFormErrors = (): string[] => {
    const errs: string[] = [];
    if (!form.patientId?.trim()) errs.push('Beneficiary is required');
    if (!targetClinicId) errs.push('Clinic is required');
    if (!form.consultationDate?.trim()) errs.push('Consultation date is required');
    if (isNurseStaff) return errs;
    if (!form.doctorId?.trim()) errs.push('Doctor is required');
    return errs;
  };

  /** Nurse must not land on /admin/op/:id (completion is doctor-only). */
  useEffect(() => {
    if (!isNurseStaff || !isOpDoctorCompleteRoute) return;
    navigate('/admin/op', { replace: true });
  }, [isNurseStaff, isOpDoctorCompleteRoute, navigate]);

  /** Non-nurse on /admin/op/new → redirect to /admin/consultations/new. */
  useEffect(() => {
    if (!isOpNew || isNurseStaff) return;
    navigate('/admin/consultations/new', { replace: true });
  }, [isOpNew, isNurseStaff, navigate]);

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
    if (!isNurseStaff || !isOpNew || !form.patientId?.trim()) {
      setPatientHistory([]);
      return;
    }
    setPatientHistoryLoading(true);
    api.consultations
      .list({ patientId: form.patientId.trim() })
      .then((data) => setPatientHistory(data as ConsultationRow[]))
      .catch(() => setPatientHistory([]))
      .finally(() => setPatientHistoryLoading(false));
  }, [form.patientId, isNurseStaff, isOpNew]);

  useEffect(() => {
    if (!isConsultationViewRoute || !consultationIdFromRoute) {
      setViewConsultation(null);
      return;
    }
    setViewLoading(true);
    api.consultations.get(consultationIdFromRoute)
      .then((data) => setViewConsultation(data as unknown as Record<string, unknown>))
      .catch(() => setViewConsultation(null))
      .finally(() => setViewLoading(false));
  }, [consultationIdFromRoute, isConsultationViewRoute]);

  /** Doctor opens /admin/op/:id — hydrate full consult form; default doctor from profile. */
  useEffect(() => {
    if (!isOpDoctorCompleteRoute || !consultationIdFromRoute) return;
    setOpFormLoading(true);
    api.opVisits
      .get(consultationIdFromRoute)
      .then((raw) => {
        const cons = raw as Record<string, unknown>;
        if (cons.kind !== 'op_visit') {
          toast({ title: 'Invalid OP visit', variant: 'destructive' });
          return;
        }
        if (user?.role === 'admin' && cons.clinicId) setSelectedClinicId(cons.clinicId as string);
        const linkedDoc = user?.linkedDoctorId ?? '';
        let ph = defaultPersonalHistory();
        try {
          const rawPh = cons.personalHistory as string;
          if (rawPh) ph = { ...defaultPersonalHistory(), ...JSON.parse(rawPh) };
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
        } catch {
          diagnosisText = (cons.diagnosis as string) || '';
        }
        const presc =
          (cons.prescription as Array<{
            medicineId?: string;
            medicineName?: string;
            dosage?: string;
            durationDays?: number;
            timeMorning?: boolean;
            timeAfternoon?: boolean;
            timeNight?: boolean;
            foodRelation?: 'before_food' | 'after_food';
            quantity?: string;
            withHotWater?: boolean;
            withMilk?: boolean;
            withHoney?: boolean;
            withGhee?: boolean;
            withGingerJuice?: boolean;
            withLemonJuice?: boolean;
          }>) || [];
        setForm((f) => ({
          ...f,
          patientId: cons.patientId as string,
          patientGender: (cons.patientGender as string) || '',
          patientMedicalHistory: (cons.patientMedicalHistory as string) || '',
          doctorId: linkedDoc || (cons.doctorId as string) || '',
          consultationDate: String(cons.consultationDate || '').slice(0, 10) || f.consultationDate,
          consultationTime: (cons.consultationTime as string) || f.consultationTime,
          symptoms: (cons.symptoms as string) || '',
          personalHistory: ph,
          menstrualHistory: mh,
          ayurvedaExamination: ae,
          diagnosis: diagnosisText,
          notes: (cons.notes as string) || '',
          followUpRequired: Boolean(cons.followUpRequired),
          followUpDate: (cons.followUpDate as string) || '',
          parentConsultationId: (cons.parentConsultationId as string) || '',
          weight: wholeVitalFromApi(cons.weight),
          height: wholeVitalFromApi(cons.height),
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
            timeMorning: Boolean(p.timeMorning),
            timeAfternoon: Boolean(p.timeAfternoon),
            timeNight: Boolean(p.timeNight),
            foodRelation: (p.foodRelation as 'before_food' | 'after_food' | undefined) || '',
            quantity: p.quantity || '',
            withHotWater: Boolean(p.withHotWater),
            withMilk: Boolean(p.withMilk),
            withHoney: Boolean(p.withHoney),
            withGhee: Boolean(p.withGhee),
            withGingerJuice: Boolean(p.withGingerJuice),
            withLemonJuice: Boolean(p.withLemonJuice),
          })),
        }));
        api.patients.get(String(cons.patientId)).then((p) => {
          setForm((ff) => ({
            ...ff,
            patientName: (p.name as string) || '',
            patientMedicalHistory: (ff.patientMedicalHistory || (p.medicalHistory as string)) || '',
            patientGender: (ff.patientGender || (p.gender as string)) || '',
          }));
        }).catch(() => {});
      })
      .catch(() => toast({ title: 'Failed to load OP visit', variant: 'destructive' }))
      .finally(() => setOpFormLoading(false));
  }, [consultationIdFromRoute, isOpDoctorCompleteRoute, navigate, setSelectedClinicId, toast, user?.linkedDoctorId, user?.role]);


  useEffect(() => {
    if (!parentConsultationIdFromState || !isReview) return;
    api.consultations.get(parentConsultationIdFromState).then((cons) => {
      const presc =
        (cons.prescription as Array<{
          medicineId?: string;
          medicineName?: string;
          dosage?: string;
          durationDays?: number;
          timeMorning?: boolean;
          timeAfternoon?: boolean;
          timeNight?: boolean;
          foodRelation?: 'before_food' | 'after_food';
          quantity?: string;
          withHotWater?: boolean;
          withMilk?: boolean;
          withHoney?: boolean;
          withGhee?: boolean;
          withGingerJuice?: boolean;
          withLemonJuice?: boolean;
        }>) || [];
      if (user?.role === 'admin' && cons.clinicId) setSelectedClinicId(cons.clinicId as string);
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
        weight: wholeVitalFromApi(cons.weight),
        height: wholeVitalFromApi(cons.height),
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
          timeMorning: Boolean(p.timeMorning),
          timeAfternoon: Boolean(p.timeAfternoon),
          timeNight: Boolean(p.timeNight),
          foodRelation: (p.foodRelation as 'before_food' | 'after_food' | undefined) || '',
          quantity: p.quantity || '',
          withHotWater: Boolean(p.withHotWater),
          withMilk: Boolean(p.withMilk),
          withHoney: Boolean(p.withHoney),
          withGhee: Boolean(p.withGhee),
          withGingerJuice: Boolean(p.withGingerJuice),
          withLemonJuice: Boolean(p.withLemonJuice),
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
    if (!targetClinicId) {
      setDoctors([]);
      return;
    }
    api.doctors
      .list({ clinicId: targetClinicId })
      .then(async (data) => {
        const scoped = (data as { id: string; name: string }[]).map((d) => ({ id: d.id, name: d.name }));
        if (!linkedDoctorId || scoped.some((d) => d.id === linkedDoctorId)) {
          setDoctors(scoped);
          return;
        }
        try {
          const allDoctors = (await api.doctors.list()) as { id: string; name: string }[];
          const linkedDoctor = allDoctors.find((d) => d.id === linkedDoctorId);
          if (linkedDoctor) {
            setDoctors([...scoped, { id: linkedDoctor.id, name: linkedDoctor.name }]);
            return;
          }
        } catch {
          // fallback to scoped list
        }
        setDoctors(scoped);
      })
      .catch(() => setDoctors([]));
  }, [targetClinicId, linkedDoctorId]);

  // Auto-pick mapped doctor on consult form for non-nurse users.
  useEffect(() => {
    if (!isFormRoute || isNurseStaff || !defaultDoctorIdForUser) return;
    setForm((f) => (f.doctorId ? f : { ...f, doctorId: defaultDoctorIdForUser }));
  }, [defaultDoctorIdForUser, isFormRoute, isNurseStaff]);

  // OP completion may hydrate doctorId as empty; enforce mapped/default doctor again.
  useEffect(() => {
    if (!isOpDoctorCompleteRoute || isNurseStaff || !defaultDoctorIdForUser) return;
    setForm((f) => (f.doctorId?.trim() ? f : { ...f, doctorId: defaultDoctorIdForUser }));
  }, [isOpDoctorCompleteRoute, isNurseStaff, defaultDoctorIdForUser]);

  useEffect(() => {
    api.medicines.list().then((data) => setMedicinesMaster((data as { id: string; name: string }[]).map((m) => ({ id: m.id, name: m.name })))).catch(() => setMedicinesMaster([]));
  }, []);

  const loadConsultations = () => {
    if (clinicSelectionRequired && isListRoute) {
      setConsultations([]);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    const params: Record<string, string> = {};
    if (user?.role === 'admin' && targetClinicId) params.clinicId = targetClinicId;
    if (form.patientId?.trim()) params.patientId = form.patientId.trim();
    const req = isOpListView ? api.opVisits.list(params) : api.consultations.list(params);
    req
      .then((data) => setConsultations(data as ConsultationRow[]))
      .catch(() => setConsultations([]))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadConsultations();
  }, [targetClinicId, user?.role, form.patientId, isOpListView, isListRoute, isOpSection]);

  const addPrescription = () => {
    setForm((f) => ({
      ...f,
      prescription: [
        ...f.prescription,
        {
          medicineId: '',
          medicineName: '',
          dosage: '',
          durationDays: '',
          timeMorning: false,
          timeAfternoon: false,
          timeNight: false,
          foodRelation: '',
          quantity: '',
          withHotWater: false,
          withMilk: false,
          withHoney: false,
          withGhee: false,
          withGingerJuice: false,
          withLemonJuice: false,
        },
      ],
    }));
    setPrescriptionSearch('');
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
    setPrescriptionSearch('');
  };

  const removePrescription = (idx: number) => {
    setForm((f) => ({ ...f, prescription: f.prescription.filter((_, i) => i !== idx) }));
  };

  const updatePrescription = (idx: number, field: string, value: string | number | boolean) => {
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
      const now = new Date();
      const consultationDate = isNurseStaff ? format(now, 'yyyy-MM-dd') : form.consultationDate;
      const consultationTime = isNurseStaff ? format(now, 'HH:mm') : form.consultationTime;

      const basePayload: Record<string, unknown> = {
        patientId: form.patientId,
        clinicId: targetClinicId,
        consultationDate,
        consultationTime: consultationTime || undefined,
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
        prescription: form.prescription
          .filter((p) => p.medicineId || p.medicineName?.trim())
          .map((p) => ({
            ...(p.medicineId
              ? { medicineId: p.medicineId }
              : { medicineName: p.medicineName.trim() }),
            dosage: p.dosage || undefined,
            durationDays: toNum(p.durationDays),
            timeMorning: p.timeMorning,
            timeAfternoon: p.timeAfternoon,
            timeNight: p.timeNight,
            foodRelation: p.foodRelation || undefined,
            quantity: p.quantity || undefined,
            withHotWater: p.withHotWater,
            withMilk: p.withMilk,
            withHoney: p.withHoney,
            withGhee: p.withGhee,
            withGingerJuice: p.withGingerJuice,
            withLemonJuice: p.withLemonJuice,
          })),
      };

      if (isOpDoctorCompleteRoute && consultationIdFromRoute) {
        const doctorId = String(form.doctorId || user?.linkedDoctorId || '').trim();
        if (!doctorId) {
          toast({
            title: 'Doctor required',
            description: 'Select the examining doctor or ask admin to link a doctor to your account.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const updated = (await api.opVisits.complete(consultationIdFromRoute, {
          ...basePayload,
          doctorId,
        })) as { id?: string };
        setConsultationErrors([]);
        toast({
          title: 'Consultation saved',
          description: 'Visit is now under Consultations. Add fee and medicines at Pharmacy if needed.',
        });
        loadConsultations();
        const cid = updated?.id || consultationIdFromRoute;
        navigate(`/admin/consultations/${cid}`);
        api.consultations.get(cid).then((data) => {
          saveConsultationPrintPayload(cid, data);
          openConsultationPrint(cid);
        }).catch(() => {
          openConsultationPrint(cid);
        });
        setLoading(false);
        return;
      }

      if (isNurseStaff && isOpNew) {
        await api.opVisits.create({
          patientId: form.patientId,
          clinicId: targetClinicId!,
          visitDate: consultationDate,
          visitTime: consultationTime || undefined,
          weight: toNum(form.weight),
          height: toNum(form.height),
          bpSystolic: toNum(form.bpSystolic),
          bpDiastolic: toNum(form.bpDiastolic),
          temperature: toNum(form.temperature),
          pulse: toNum(form.pulse),
          spo2: toNum(form.spo2),
          cbg: toNum(form.cbg),
          parentConsultationId: form.parentConsultationId || undefined,
        });
        setConsultationErrors([]);
        toast({
          title: 'Vitals saved',
          description: 'OP record created. A doctor will complete the consultation from OP.',
        });
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
        navigate('/admin/op');
        setLoading(false);
        return;
      }

      const created = (await api.consultations.create({
        ...basePayload,
        doctorId: isDoctorLogin ? linkedDoctorId : form.doctorId,
      })) as { id?: string };
      setConsultationErrors([]);
      toast({
        title: 'Consultation saved',
        description: 'Prescription recorded. Add fee & medicines at Pharmacy.',
      });
      const savedPatientId = form.patientId;
      const savedPatientName = form.patientName;
      setForm({
        patientId: savedPatientId,
        patientName: savedPatientName,
        patientMedicalHistory: form.patientMedicalHistory,
        patientGender: form.patientGender,
        doctorId: defaultDoctorIdForUser,
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
          saveConsultationPrintPayload(created.id, data);
          openConsultationPrint(created.id);
        }).catch(() => {
          openConsultationPrint(created.id);
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
      saveConsultationPrintPayload(id, data);
      openConsultationPrint(id);
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
      doctorId: isNurseStaff ? '' : defaultDoctorIdForUser,
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
    navigate(isNurseStaff ? '/admin/op/new' : '/admin/consultations/new');
  };

  const loadConsultationForFollowUp = (consultationId: string) => {
    api.consultations.get(consultationId).then((data) => {
      const presc =
        (data.prescription as Array<{
          medicineId?: string;
          medicineName?: string;
          dosage?: string;
          durationDays?: number;
          timeMorning?: boolean;
          timeAfternoon?: boolean;
          timeNight?: boolean;
          foodRelation?: 'before_food' | 'after_food';
          quantity?: string;
          withHotWater?: boolean;
          withMilk?: boolean;
          withHoney?: boolean;
          withGhee?: boolean;
          withGingerJuice?: boolean;
          withLemonJuice?: boolean;
        }>) || [];
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
        weight: wholeVitalFromApi(d.weight),
        height: wholeVitalFromApi(d.height),
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
          timeMorning: Boolean(p.timeMorning),
          timeAfternoon: Boolean(p.timeAfternoon),
          timeNight: Boolean(p.timeNight),
          foodRelation: (p.foodRelation as 'before_food' | 'after_food' | undefined) || '',
          quantity: p.quantity || '',
          withHotWater: Boolean(p.withHotWater),
          withMilk: Boolean(p.withMilk),
          withHoney: Boolean(p.withHoney),
          withGhee: Boolean(p.withGhee),
          withGingerJuice: Boolean(p.withGingerJuice),
          withLemonJuice: Boolean(p.withLemonJuice),
        })),
      }));
    }).catch(() => toast({ title: 'Failed to load details', variant: 'destructive' }));
  };

  const openConsultationRecord = (cons: ConsultationRow) => {
    if (isOpListView) {
      if (isNurseStaff) {
        toast({
          title: 'Open this visit as a doctor',
          description: 'Nurses record vitals only. A doctor opens the row here to add examination, diagnosis, and complete the consultation.',
        });
        return;
      }
      navigate(`/admin/op/${cons.id}`);
    } else {
      navigate(`/admin/consultations/${cons.id}`);
    }
  };

  const openFollowUp = (cons: ConsultationRow) => {
    navigate('/admin/consultations/new', { state: { parentConsultationId: cons.id, isReview: true } });
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  /** Upcoming follow-ups: consultations with followUpRequired and followUpDate >= today. */
  const upcomingFollowUps = React.useMemo(() => {
    if (isOpListView) return [];
    return consultations
      .filter((c) => c.followUpRequired === 1 && c.followUpDate && c.followUpDate >= todayStr)
      .sort((a, b) => ((a.followUpDate as string) || '').localeCompare((b.followUpDate as string) || ''));
  }, [consultations, isOpListView, todayStr]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {(viewLoading || loading || (opFormLoading && isOpDoctorCompleteRoute)) && (
        <FullScreenLoader label="Loading consultations..." />
      )}
      <ConsultationsTopBar
        isListRoute={isListRoute}
        isNurseStaff={isNurseStaff}
        isViewRoute={isViewRoute}
        isFormRoute={isFormRoute}
        isClinicSelected={!!targetClinicId}
        onOpenNew={() => navigate(isNurseStaff ? '/admin/op/new' : '/admin/consultations/new')}
        onBackToRecords={() => navigate(isOpSection ? '/admin/op' : '/admin/consultations')}
      />

      {clinicSelectionRequired && (isListRoute || isFormRoute) && (
        <ClinicSelectionNotice message="Select a clinic in the header to manage consultations and OP flow." />
      )}

      {isListRoute && (
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm ring-1 ring-black/[0.03] transition-[box-shadow,border-color] duration-300 hover:shadow-md dark:ring-white/[0.04]">
          <CardHeader className="shrink-0 space-y-0 border-b border-border/50 bg-muted/10 pb-3 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">
                    {isOpListView ? 'OP queue (vitals pending doctor)' : 'Consultation records'}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-relaxed sm:text-sm">
                    {isOpListView
                      ? 'Nurse-entered vitals stay here until a doctor completes the visit. Open a row to examine.'
                      : 'Doctor-assigned visits. Open a row for full details. Refresh to reload.'}
                  </CardDescription>
                </div>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={loadConsultations}
                className="shrink-0 rounded-lg transition-all duration-200 hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm active:scale-95"
                title="Refresh list"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <ConsultationListTable
              listLoading={listLoading}
              consultations={consultations}
              upcomingFollowUps={upcomingFollowUps}
              todayStr={todayStr}
              activeConsId={activeConsId}
              fmtDateWithTime={fmtDateWithTime}
              formatAppDate={formatAppDate}
              diagnosisDisplay={diagnosisDisplay}
              patientInitials={patientInitials}
              openConsultationRecord={openConsultationRecord}
              openFollowUp={openFollowUp}
              handlePrint={handlePrint}
              onNewConsult={() => navigate(isNurseStaff ? '/admin/op/new' : '/admin/consultations/new')}
              targetClinicId={targetClinicId}
              listKind={isOpListView ? 'op' : 'consultations'}
              newConsultLabel={isNurseStaff ? 'New OP' : 'New consult'}
              disableRowOpen={Boolean(isOpListView && isNurseStaff)}
            />
          </CardContent>
        </Card>
      )}

      {isFormRoute && (
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 shrink-0">
            <div>
              <CardTitle className="text-lg">
                {isOpDoctorCompleteRoute
                  ? 'Complete OP visit'
                  : isNurseStaff
                    ? isOpNew
                      ? 'New OP — record vitals'
                      : 'Record vitals'
                    : form.parentConsultationId
                      ? 'Add Follow-up'
                      : 'New consult'}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {isOpDoctorCompleteRoute
                  ? 'Vitals and beneficiary are from the nurse. Add examination, diagnosis, prescription, then save — the visit moves to Consultations and print opens.'
                  : isNurseStaff
                    ? 'Choose beneficiary and enter vitals. Visit date and time are set when you save. A doctor is not assigned here—they add complaint, examination, diagnosis and prescription when they see the patient.'
                    : form.parentConsultationId
                      ? 'Data copied from previous visit. Edit symptoms, vitals, diagnosis and save as follow-up.'
                      : 'Select patient, doctor, date and prescription (medicine, dose, duration).'}
              </CardDescription>
            </div>
            <Button onClick={openNewConsultation} disabled={!targetClinicId} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />{' '}
              {isNurseStaff ? 'New OP' : 'New consult'}
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
            {isNurseStaff && isOpNew && form.patientId && (
              <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <History className="h-4 w-4" /> Patient visit history
                  </p>
                  {form.parentConsultationId && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20 hover:bg-primary/25 transition-colors"
                      onClick={() => setForm((f) => ({ ...f, parentConsultationId: '' }))}
                    >
                      Follow-up selected <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {patientHistoryLoading ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                  </div>
                ) : patientHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No previous consultations for this patient. This will be an <span className="font-semibold text-foreground">initial</span> visit.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border/40 bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent text-[11px]">
                          <TableHead className="py-1.5 px-2">Date</TableHead>
                          <TableHead className="py-1.5 px-2">Doctor</TableHead>
                          <TableHead className="py-1.5 px-2">Diagnosis</TableHead>
                          <TableHead className="py-1.5 px-2 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientHistory
                          .sort((a, b) => (b.consultationDate || '').localeCompare(a.consultationDate || ''))
                          .map((h) => {
                            const isSelected = form.parentConsultationId === h.id;
                            return (
                              <TableRow key={h.id} className={cn('text-xs', isSelected && 'bg-primary/5')}>
                                <TableCell className="py-1.5 px-2 whitespace-nowrap tabular-nums">
                                  {fmtDateWithTime(h.consultationDate, h.consultationTime)}
                                </TableCell>
                                <TableCell className="py-1.5 px-2">{(h as Record<string, unknown>).doctorName as string || '—'}</TableCell>
                                <TableCell className="py-1.5 px-2 max-w-[160px] truncate">{diagnosisDisplay((h as Record<string, unknown>).diagnosis)}</TableCell>
                                <TableCell className="py-1.5 px-2 text-right">
                                  {isSelected ? (
                                    <span className="text-[10px] font-semibold text-primary">Selected</span>
                                  ) : (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-[10px]"
                                      onClick={() => setForm((f) => ({ ...f, parentConsultationId: h.id }))}
                                    >
                                      Follow-up
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {!form.parentConsultationId && patientHistory.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">Click <span className="font-semibold">Follow-up</span> on a row to link this OP visit, or leave unselected for an <span className="font-semibold">initial</span> visit.</p>
                )}
              </div>
            )}
            {!isNurseStaff && (
            forceMappedDoctorReadOnly ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                  <Label className="text-muted-foreground">Examining doctor</Label>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {doctors.find((d) => d.id === linkedDoctorId)?.name ?? '—'}
                  </p>
                 
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
            ) : (
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
            )
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div>
                <Label className="text-xs">Weight (kgs)</Label>
                <Input type="text" inputMode="numeric" className="h-9" placeholder="e.g. 72" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: restrictVital(e.target.value, 3, 0) }))} />
              </div>
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input type="text" inputMode="numeric" className="h-9" placeholder="e.g. 165" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: restrictVital(e.target.value, 3, 0) }))} />
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
            {!isNurseStaff && (
            <>
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
                      {form.followUpDate ? formatAppDate(form.followUpDate + 'T12:00:00') : 'Select date'}
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
                <Button size="sm" variant="outline" onClick={addPrescription}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {form.prescription.length > 0 && (
                <div className="mt-2 space-y-3">
                  {form.prescription.map((p, i) => (
                    <div key={i} className="rounded-xl border bg-gradient-to-b from-white to-emerald-50/20 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground">Medicine</Label>
                          <div className="mt-1">
                            <Popover
                              open={prescriptionOpen === i}
                              onOpenChange={(o) => {
                                setPrescriptionOpen(o ? i : null);
                                if (!o) setPrescriptionSearch('');
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" size="sm" className="w-full justify-between font-normal">
                                  <span className="truncate">
                                    {p.medicineName?.trim()
                                      ? p.medicineId
                                        ? p.medicineName
                                        : `New: ${p.medicineName}`
                                      : 'Select or type new medicine'}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Search or type new name…"
                                    value={prescriptionSearch}
                                    onValueChange={setPrescriptionSearch}
                                  />
                                  <CommandList>
                                    <CommandEmpty>No matches — use “Add new” below</CommandEmpty>
                                    <CommandGroup>
                                      {medicinesMaster
                                        .filter((med) =>
                                          med.name.toLowerCase().includes(prescriptionSearch.trim().toLowerCase()),
                                        )
                                        .map((med) => (
                                          <CommandItem
                                            key={med.id}
                                            value={med.name}
                                            onSelect={() => selectPrescription(i, med)}
                                          >
                                            {med.name}
                                          </CommandItem>
                                        ))}
                                      {(() => {
                                        const q = prescriptionSearch.trim();
                                        const exact = medicinesMaster.some(
                                          (m) => m.name.trim().toLowerCase() === q.toLowerCase(),
                                        );
                                        if (!q || exact) return null;
                                        return (
                                          <CommandItem
                                            value={`__new__${q}`}
                                            onSelect={() => selectPrescription(i, { id: '', name: q })}
                                          >
                                            Add new medicine &quot;{q}&quot;
                                          </CommandItem>
                                        );
                                      })()}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removePrescription(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Dosage</Label>
                          <Input className="h-9 mt-1" placeholder="e.g. 1 tab" value={p.dosage} onChange={(e) => updatePrescription(i, 'dosage', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Duration (days)</Label>
                          <Input type="number" className="h-9 mt-1" placeholder="e.g. 7" value={p.durationDays} onChange={(e) => updatePrescription(i, 'durationDays', e.target.value)} min={0} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <Input className="h-9 mt-1" placeholder="e.g. 10 tabs" value={p.quantity} onChange={(e) => updatePrescription(i, 'quantity', e.target.value)} />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="rounded-lg border bg-white/60 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Time</p>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              ['Morning', 'timeMorning'],
                              ['Afternoon', 'timeAfternoon'],
                              ['Night', 'timeNight'],
                            ] as const).map(([label, key]) => (
                              <label key={key} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={Boolean(p[key])} onCheckedChange={(v) => updatePrescription(i, key, Boolean(v))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-white/60 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Food / Route</p>
                          <RadioGroup
                            value={p.foodRelation || 'none'}
                            onValueChange={(v) => updatePrescription(i, 'foodRelation', v === 'none' ? '' : v)}
                            className="grid grid-cols-1 gap-2"
                          >
                            <label className="flex items-center gap-2 text-sm">
                              <RadioGroupItem value="before_food" />
                              Before food
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <RadioGroupItem value="after_food" />
                              After food
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RadioGroupItem value="none" />
                              External use
                            </label>
                          </RadioGroup>
                        </div>

                        <div className="rounded-lg border bg-white/60 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">With</p>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              ['Hot water', 'withHotWater'],
                              ['Milk', 'withMilk'],
                              ['Honey', 'withHoney'],
                              ['Ghee', 'withGhee'],
                              ['Ginger juice', 'withGingerJuice'],
                              ['Lemon juice', 'withLemonJuice'],
                            ] as const).map(([label, key]) => (
                              <label key={key} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={Boolean(p[key])} onCheckedChange={(v) => updatePrescription(i, key, Boolean(v))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading || opFormLoading || !targetClinicId}
              className="w-full h-11 font-medium"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : isNurseStaff ? (
                'Save vitals'
              ) : isOpDoctorCompleteRoute ? (
                'Save, print & move to Consultations'
              ) : (
                'Save & Print'
              )}
            </Button>
          </div>
          </CardContent>
        </Card>
      )}

      {isViewRoute && (
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Consultation</CardTitle>
                <CardDescription className="mt-0.5">
                  {isNurseStaff
                    ? 'Vitals and visit summary. Clinical details are managed by doctors.'
                    : 'View details. You can print or start a follow-up.'}
                </CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/consultations/new', { state: { parentConsultationId: consultationIdFromRoute, isReview: true } })}
                  disabled={!consultationIdFromRoute || isNurseStaff}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Add follow-up
                </Button>
                <Button
                  size="sm"
                  onClick={() => consultationIdFromRoute && handlePrint(consultationIdFromRoute)}
                  disabled={!consultationIdFromRoute}
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0">
            {viewLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading consultation...</p>
              </div>
            ) : !viewConsultation ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Consultation not found</p>
                <p className="text-sm text-muted-foreground mt-1">It may have been removed or you may not have access.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
                  const parseMaybeJson = (v: unknown): unknown => {
                    if (typeof v !== 'string') return v;
                    const s = v.trim();
                    if (!s) return v;
                    if (!(s.startsWith('{') || s.startsWith('['))) return v;
                    try { return JSON.parse(s); } catch { return v; }
                  };
                  const personalHistory = asObj(parseMaybeJson(viewConsultation.personalHistory));
                  const menstrualHistory = asObj(parseMaybeJson(viewConsultation.menstrualHistory));
                  const ayurvedaExamination = asObj(parseMaybeJson(viewConsultation.ayurvedaExamination));
                  const followUpRequired = viewConsultation.followUpRequired === 1 || viewConsultation.followUpRequired === true;
                  const followUpDate = viewConsultation.followUpDate ? String(viewConsultation.followUpDate) : '';
                  const parentConsultationId = viewConsultation.parentConsultationId ? String(viewConsultation.parentConsultationId) : '';
                  const patientName = String(viewConsultation.patientName ?? '') || '—';
                  const doctorName =
                    String(viewConsultation.doctorName ?? '').trim() ||
                    (viewConsultation.doctorId
                      ? doctors.find((d) => d.id === String(viewConsultation.doctorId))?.name ?? '—'
                      : '—');
                  const dateTime = viewConsultation.consultationDate
                    ? fmtDateWithTime(String(viewConsultation.consultationDate), (viewConsultation.consultationTime as string | null | undefined))
                    : '—';

                  const pill = (label: string) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                    >
                      {label}
                    </span>
                  );

                  const listFrom = (v: unknown): string[] => {
                    if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
                    if (typeof v === 'string' && v.trim()) return [v.trim()];
                    return [];
                  };

                  const InfoItem = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
                    <div className="rounded-lg border bg-card/60 p-3 shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-start gap-2">
                        {icon ? <div className="mt-0.5 text-emerald-700">{icon}</div> : null}
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-medium mt-0.5 truncate">{value}</p>
                        </div>
                      </div>
                    </div>
                  );

                  const Empty = ({ text }: { text: string }) => (
                    <div className="rounded-md border border-dashed bg-muted/15 p-4 text-sm text-muted-foreground">{text}</div>
                  );

                  const Section = ({
                    title,
                    description,
                    icon,
                    children,
                  }: {
                    title: string;
                    description?: string;
                    icon?: React.ReactNode;
                    children: React.ReactNode;
                  }) => (
                    <div className="rounded-lg border bg-card shadow-sm">
                      <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-emerald-50/70 to-transparent">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 h-4 w-1.5 rounded-full bg-emerald-500/80" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {icon ? <div className="text-emerald-700">{icon}</div> : null}
                              <p className="text-sm font-semibold text-foreground">{title}</p>
                            </div>
                        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">{children}</div>
                    </div>
                  );

                  return (
                    <>
                      {/* Summary */}
                      <div className="rounded-lg border bg-gradient-to-br from-emerald-50/70 via-background to-background shadow-sm">
                        <div className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Beneficiary</p>
                              <p className="text-lg font-semibold truncate">{patientName}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <Stethoscope className="h-4 w-4 text-emerald-700" />
                                  {doctorName}
                                </span>
                                <span className="text-muted-foreground/60">•</span>
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarIcon className="h-4 w-4 text-emerald-700" />
                                  {dateTime}
                                </span>
                                {parentConsultationId ? (
                                  <>
                                    <span className="text-muted-foreground/60">•</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 border-emerald-200 hover:bg-emerald-50"
                                      onClick={() => navigate(`/admin/consultations/${parentConsultationId}`)}
                                    >
                                      <Link2 className="h-4 w-4 mr-1 text-emerald-700" />
                                      Consult
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="default"
                                className={cn(
                                  followUpRequired
                                    ? 'bg-emerald-600 hover:bg-emerald-600/90 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                )}
                              >
                                {followUpRequired ? 'Follow-up required' : 'No follow-up'}
                              </Badge>
                              {followUpRequired && followUpDate ? (
                                <Badge variant="outline" className="border-emerald-200/70 bg-white/60 text-emerald-800">
                                  Follow-up: {formatAppDate(followUpDate + 'T12:00:00')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <Tabs defaultValue={isNurseStaff ? 'vitals' : 'clinical'} className="w-full">
                        <div className="rounded-xl border bg-gradient-to-r from-emerald-50/70 via-background to-background p-1.5 shadow-sm">
                          <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 h-auto">
                            {!isNurseStaff && (
                            <TabsTrigger
                              value="clinical"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Stethoscope className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Clinical
                            </TabsTrigger>
                            )}
                            <TabsTrigger
                              value="vitals"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Activity className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Vitals
                            </TabsTrigger>
                            {!isNurseStaff && (
                            <TabsTrigger
                              value="history"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <ClipboardList className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              History
                            </TabsTrigger>
                            )}
                            {!isNurseStaff && (
                            <TabsTrigger
                              value="prescription"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Pill className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Prescription
                            </TabsTrigger>
                            )}
                          </TabsList>
                        </div>

                        {!isNurseStaff && (
                        <TabsContent value="clinical" className="mt-4 space-y-3">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <Section title="Present Complaint" description="Symptoms & duration." icon={<MessageSquare className="h-4 w-4" />}>
                              {String(viewConsultation.symptoms ?? '') ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(viewConsultation.symptoms)}</p>
                              ) : (
                                <Empty text="No complaint recorded." />
                              )}
                            </Section>
                            <Section title="Diagnosis" icon={<Stethoscope className="h-4 w-4" />}>
                              {diagnosisDisplay(viewConsultation.diagnosis) ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{diagnosisDisplay(viewConsultation.diagnosis)}</p>
                              ) : (
                                <Empty text="No diagnosis recorded." />
                              )}
                            </Section>
                            <Section title="Medical History" icon={<History className="h-4 w-4" />}>
                              {String(viewConsultation.patientMedicalHistory ?? '') ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(viewConsultation.patientMedicalHistory)}</p>
                              ) : (
                                <Empty text="No medical history recorded." />
                              )}
                            </Section>
                            <Section title="Notes" icon={<StickyNote className="h-4 w-4" />}>
                              {String(viewConsultation.notes ?? '') ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(viewConsultation.notes)}</p>
                              ) : (
                                <Empty text="No notes." />
                              )}
                            </Section>
                          </div>
                          <Section title="Diet / Lifestyle Advice" icon={<UtensilsCrossed className="h-4 w-4" />}>
                            {String(viewConsultation.dietLifestyleAdvice ?? '') ? (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(viewConsultation.dietLifestyleAdvice)}</p>
                            ) : (
                              <Empty text="No advice recorded." />
                            )}
                          </Section>
                        </TabsContent>
                        )}

                        <TabsContent value="vitals" className="mt-4 space-y-3">
                          <Section title="Vitals" description="Recorded at the time of consultation." icon={<Activity className="h-4 w-4" />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <InfoItem
                                label="Weight"
                                value={
                                  viewConsultation.weight != null && String(viewConsultation.weight).trim() !== ''
                                    ? `${Math.round(Number(viewConsultation.weight))} kg`
                                    : '—'
                                }
                                icon={<Scale className="h-4 w-4" />}
                              />
                              <InfoItem
                                label="Height"
                                value={
                                  viewConsultation.height != null && String(viewConsultation.height).trim() !== ''
                                    ? `${Math.round(Number(viewConsultation.height))} cm`
                                    : '—'
                                }
                                icon={<Ruler className="h-4 w-4" />}
                              />
                              <InfoItem
                                label="BP"
                                value={`${viewConsultation.bpSystolic != null ? String(viewConsultation.bpSystolic) : '—'}/${viewConsultation.bpDiastolic != null ? String(viewConsultation.bpDiastolic) : '—'}`}
                                icon={<HeartPulse className="h-4 w-4" />}
                              />
                              <InfoItem label="Temperature" value={viewConsultation.temperature != null ? String(viewConsultation.temperature) : '—'} icon={<Thermometer className="h-4 w-4" />} />
                              <InfoItem label="Pulse" value={viewConsultation.pulse != null ? `${String(viewConsultation.pulse)} bpm` : '—'} icon={<Heart className="h-4 w-4" />} />
                              <InfoItem label="SpO2" value={viewConsultation.spo2 != null ? `${String(viewConsultation.spo2)}%` : '—'} icon={<Wind className="h-4 w-4" />} />
                              <InfoItem label="CBG" value={viewConsultation.cbg != null ? `${String(viewConsultation.cbg)} mg/dL` : '—'} icon={<Droplets className="h-4 w-4" />} />
                            </div>
                            <div className="mt-4">
                              <BmiDisplay
                                weight={viewConsultation.weight != null ? Math.round(Number(viewConsultation.weight)) : undefined}
                                height={viewConsultation.height != null ? Math.round(Number(viewConsultation.height)) : undefined}
                                className="max-w-md"
                              />
                            </div>
                          </Section>
                        </TabsContent>

                        {!isNurseStaff && (
                        <TabsContent value="history" className="mt-4 space-y-3">
                          <Section title="History" description="Personal history and examination findings." icon={<ClipboardList className="h-4 w-4" />}>
                            <Accordion
                              type="multiple"
                              className="w-full overflow-hidden rounded-xl border border-emerald-100/70 bg-gradient-to-b from-emerald-50/50 to-background shadow-sm"
                            >
                              <AccordionItem value="personal" className="px-4">
                                <AccordionTrigger className="py-3 hover:no-underline rounded-lg data-[state=open]:bg-white/70 data-[state=open]:shadow-sm px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span>Personal History</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-3 pb-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(['diet', 'exercise', 'habits', 'bowelMovement', 'appetite', 'micturition', 'sleepPattern'] as const).map((k) => {
                                      const labels: Record<string, string> = {
                                        diet: 'Diet',
                                        exercise: 'Exercise / Physical Activity',
                                        habits: 'Habits / Addictions',
                                        bowelMovement: 'Bowel Movement',
                                        appetite: 'Appetite',
                                        micturition: 'Micturition (Urination)',
                                        sleepPattern: 'Sleep Pattern',
                                      };
                                      const items = listFrom(personalHistory[k]);
                                      return (
                                        <div key={k} className="rounded-lg border bg-white/60 p-3 shadow-sm">
                                          <p className="text-xs font-medium text-muted-foreground">{labels[k]}</p>
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {items.length > 0 ? items.map(pill) : <span className="text-sm text-muted-foreground">—</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="ayurveda" className="px-4">
                                <AccordionTrigger className="py-3 hover:no-underline rounded-lg data-[state=open]:bg-white/70 data-[state=open]:shadow-sm px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <span>Ayurvedic Examination</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-3 pb-4">
                                  <div className="overflow-x-auto rounded-lg border bg-white/60 shadow-sm p-3">
                                    <table className="w-full text-sm">
                                      <tbody className="[&>tr:not(:last-child)]:border-b">
                                        {([
                                          ['Naadi (Pulse)', ayurvedaExamination.naadi],
                                          ['Malam (Stool)', ayurvedaExamination.malam],
                                          ['Mootram (Urine)', ayurvedaExamination.mootram],
                                          ['Mootram Colour', ayurvedaExamination.mootramColour],
                                          ['Jihwa (Tongue)', ayurvedaExamination.jihwa],
                                          ['Shabda (Voice)', ayurvedaExamination.shabda],
                                          ['Sparsha (Touch)', ayurvedaExamination.sparsha],
                                          ['Drik (Eyes)', ayurvedaExamination.drik],
                                          ['Drik Colour', ayurvedaExamination.drikColour],
                                          ['Aakriti (Physique)', ayurvedaExamination.aakriti],
                                        ] as Array<[string, unknown]>).map(([label, value]) => {
                                          const values = listFrom(value);
                                          return (
                                            <tr key={label} className="odd:bg-white even:bg-emerald-50/30">
                                              <td className="py-2.5 px-3 align-top text-muted-foreground whitespace-nowrap font-medium">{label}</td>
                                              <td className="py-2.5 px-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                  {values.length > 0 ? values.map(pill) : <span className="text-muted-foreground">—</span>}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {Object.keys(menstrualHistory).length > 0 ? (
                                <AccordionItem value="menstrual" className="px-4">
                                  <AccordionTrigger className="py-3 hover:no-underline rounded-lg data-[state=open]:bg-white/70 data-[state=open]:shadow-sm px-2">
                                    <div className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                      <span>Menstrual History</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="overflow-x-auto rounded-lg border bg-white/60 shadow-sm">
                                      <table className="w-full text-sm">
                                        <tbody className="[&>tr:not(:last-child)]:border-b">
                                          {([
                                            ['Menstrual Cycle', menstrualHistory.menstrualCycle],
                                            ['LMP', menstrualHistory.lmp],
                                            ['Pads per day', menstrualHistory.padsPerDay],
                                            ['Cycle length (days)', menstrualHistory.cycleLengthDays],
                                            ['Day of cycle', menstrualHistory.cycleCountOnVisit],
                                            ['Clots', menstrualHistory.clots],
                                            ['Menstrual flow', menstrualHistory.menstrualFlow],
                                            ['Dysmenorrhea', menstrualHistory.dysmenorrhea],
                                            ['Leucorrhea', menstrualHistory.leucorrhea],
                                            ['Menopause', menstrualHistory.menopause],
                                            ['Menopause age', menstrualHistory.menopauseAge],
                                            ['Gravida', menstrualHistory.gravida],
                                            ['Para', menstrualHistory.para],
                                            ['Abortions', menstrualHistory.abortions],
                                          ] as Array<[string, unknown]>).map(([label, value]) => (
                                            <tr key={label} className="odd:bg-white even:bg-emerald-50/30">
                                              <td className="py-2.5 px-3 align-top text-muted-foreground whitespace-nowrap font-medium">{label}</td>
                                              <td className="py-2.5 px-3">{value != null && String(value) !== '' ? String(value) : '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ) : null}
                            </Accordion>
                          </Section>
                        </TabsContent>
                        )}

                        {!isNurseStaff && (
                        <TabsContent value="prescription" className="mt-4 space-y-3">
                          <Section title="Prescription" description="Medicines and instructions." icon={<Pill className="h-4 w-4" />}>
                            {Array.isArray(viewConsultation.prescription) && viewConsultation.prescription.length > 0 ? (
                              <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b border-border/60 bg-gradient-to-b from-muted/55 to-muted/30 hover:bg-muted/40">
                                        <TableHead className="min-w-[160px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Medicine
                                        </TableHead>
                                        <TableHead className="min-w-[110px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Dosage
                                        </TableHead>
                                        <TableHead className="min-w-[92px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Duration
                                        </TableHead>
                                        <TableHead className="min-w-[120px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Timing
                                        </TableHead>
                                        <TableHead className="min-w-[120px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          Instructions
                                        </TableHead>
                                        <TableHead className="min-w-[130px] whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                          With
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(viewConsultation.prescription as Record<string, unknown>[]).map((p, i) => {
                                        const times: string[] = [];
                                        if (p.timeMorning) times.push('Morning');
                                        if (p.timeAfternoon) times.push('Afternoon');
                                        if (p.timeNight) times.push('Night');
                                        const withItems: string[] = [];
                                        if (p.withHotWater) withItems.push('Hot water');
                                        if (p.withMilk) withItems.push('Milk');
                                        if (p.withHoney) withItems.push('Honey');
                                        if (p.withGhee) withItems.push('Ghee');
                                        if (p.withGingerJuice) withItems.push('Ginger juice');
                                        if (p.withLemonJuice) withItems.push('Lemon juice');
                                        const food =
                                          p.foodRelation === 'before_food'
                                            ? 'Before food'
                                            : p.foodRelation === 'after_food'
                                              ? 'After food'
                                              : '—';
                                        const durVal = p.durationDays;
                                        const duration =
                                          durVal != null && String(durVal).trim() !== ''
                                            ? `${String(durVal)} day${Number(durVal) === 1 ? '' : 's'}`
                                            : '—';
                                        return (
                                          <TableRow
                                            key={i}
                                            className={cn(
                                              'border-b border-border/40 transition-colors duration-150',
                                              i % 2 === 1 ? 'bg-muted/20' : 'bg-background',
                                              'hover:bg-primary/[0.06] dark:hover:bg-primary/[0.08]',
                                            )}
                                          >
                                            <TableCell className="border-l-[3px] border-l-primary/50 px-4 py-3.5 align-top text-sm font-semibold leading-snug text-foreground">
                                              {String(p.medicineName ?? p.medicineId ?? '—')}
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5 align-top text-sm text-foreground/90">
                                              {String(p.dosage ?? '').trim() || '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5 align-top text-sm tabular-nums text-muted-foreground">{duration}</TableCell>
                                            <TableCell className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                                              {times.length > 0 ? times.join(', ') : '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-3.5 align-top text-sm text-muted-foreground">{food}</TableCell>
                                            <TableCell className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                                              {withItems.length > 0 ? withItems.join(', ') : '—'}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <Empty text="No prescription recorded." />
                            )}
                          </Section>
                        </TabsContent>
                        )}
                      </Tabs>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsultationsPage;

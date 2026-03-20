import React, { useState, useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import { BmiDisplay } from '@/components/BmiDisplay';
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
  consultationDate: string;
  consultationTime?: string | null;
  totalAmount: string;
  parentConsultationId?: string | null;
  parentConsultationDate?: string | null;
  parentConsultationTime?: string | null;
  parentDiagnosis?: string | null;
  followUpRequired?: number;
  followUpDate?: string | null;
};

type PrescriptionItem = {
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

/** Shared list-row chrome for consultation records */
const recordRowBase =
  'group flex w-full items-stretch gap-3 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out cursor-pointer sm:p-4';
const recordRowHoverInitial =
  'border-l-[5px] border-l-primary border-border/60 hover:border-primary/35 hover:bg-primary/[0.06] hover:shadow-md dark:hover:bg-primary/10';
const recordRowHoverFollow =
  'border-l-[5px] border-l-amber-400 border-border/60 hover:border-amber-400/80 hover:bg-amber-50/40 hover:shadow-md dark:hover:bg-amber-950/25';
const recordRowHoverUpcoming =
  'border-l-[5px] border-l-amber-500 border-amber-200/60 bg-amber-50/30 hover:border-amber-500/80 hover:bg-amber-50/70 hover:shadow-md dark:border-amber-800/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/35';

const ConsultationsPage = () => {
  const user = getAuthUser();
  const { effectiveClinicId, setSelectedClinicId } = useAdminClinic();
  const targetClinicId = effectiveClinicId ?? undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const consultationIdFromRoute = params.id;
  const isNewRoute = location.pathname.endsWith('/consultations/new');
  const isViewRoute = Boolean(consultationIdFromRoute);
  const isFormRoute = isNewRoute;
  const isListRoute = !isViewRoute && !isFormRoute;
  const state = location.state as { patientId?: string; parentConsultationId?: string; isReview?: boolean } | null;
  const patientIdFromState = state?.patientId;
  const parentConsultationIdFromState = state?.parentConsultationId;
  const isReview = state?.isReview;

  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [medicinesMaster, setMedicinesMaster] = useState<{ id: string; name: string }[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeConsId, setActiveConsId] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
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
    if (!consultationIdFromRoute) {
      setViewConsultation(null);
      return;
    }
    setViewLoading(true);
    api.consultations.get(consultationIdFromRoute)
      .then((data) => setViewConsultation(data as unknown as Record<string, unknown>))
      .catch(() => setViewConsultation(null))
      .finally(() => setViewLoading(false));
  }, [consultationIdFromRoute]);


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
      .then((data) => setDoctors((data as { id: string; name: string }[]).map((d) => ({ id: d.id, name: d.name }))))
      .catch(() => setDoctors([]));
  }, [targetClinicId]);

  useEffect(() => {
    api.medicines.list().then((data) => setMedicinesMaster((data as { id: string; name: string }[]).map((m) => ({ id: m.id, name: m.name })))).catch(() => setMedicinesMaster([]));
  }, []);

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
      prescription: [
        ...f.prescription,
        {
          medicineId: first.id,
          medicineName: first.name,
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
        },
      ],
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
          timeMorning: p.timeMorning,
          timeAfternoon: p.timeAfternoon,
          timeNight: p.timeNight,
          foodRelation: p.foodRelation || undefined,
          quantity: p.quantity || undefined,
          withHotWater: p.withHotWater,
          withMilk: p.withMilk,
          withHoney: p.withHoney,
          withGhee: p.withGhee,
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
        })),
      }));
    }).catch(() => toast({ title: 'Failed to load details', variant: 'destructive' }));
  };

  const openConsultationRecord = (cons: ConsultationRow) => {
    navigate(`/admin/consultations/${cons.id}`);
  };

  const openFollowUp = (cons: ConsultationRow) => {
    navigate('/admin/consultations/new', { state: { parentConsultationId: cons.id, isReview: true } });
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  /** Upcoming follow-ups: consultations with followUpRequired and followUpDate >= today. */
  const upcomingFollowUps = React.useMemo(() => {
    return consultations
      .filter((c) => c.followUpRequired === 1 && c.followUpDate && c.followUpDate >= todayStr)
      .sort((a, b) => ((a.followUpDate as string) || '').localeCompare((b.followUpDate as string) || ''));
  }, [consultations]);

  /** Group consultations: initial visits with follow-ups nested. Orphan follow-ups grouped by parent. */
  const { consultationGroups, orphanGroups } = React.useMemo(() => {
    const initials = consultations.filter((c) => !c.parentConsultationId).sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    const initialIds = new Set(initials.map((i) => i.id));
    const byParent = new Map<string, ConsultationRow[]>();
    const orphanByParent = new Map<string, ConsultationRow[]>();
    for (const c of consultations) {
      if (c.parentConsultationId) {
        const parentId = c.parentConsultationId as string;
        if (initialIds.has(parentId)) {
          const list = byParent.get(parentId) || [];
          list.push(c);
          byParent.set(parentId, list);
        } else {
          const list = orphanByParent.get(parentId) || [];
          list.push(c);
          orphanByParent.set(parentId, list);
        }
      }
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    }
    for (const list of orphanByParent.values()) {
      list.sort((a, b) => (b.consultationDate as string).localeCompare(a.consultationDate as string));
    }
    const groups = initials.map((init) => ({ initial: init, followUps: byParent.get(init.id) || [] }));
    const orphanGroupsList = Array.from(orphanByParent.entries()).map(([parentId, followUps]) => {
      const first = followUps[0];
      const parentInfo: ConsultationRow = {
        id: parentId,
        patientName: first?.patientName ?? '',
        consultationDate: first?.parentConsultationDate ?? '',
        consultationTime: first?.parentConsultationTime ?? null,
        diagnosis: first?.parentDiagnosis ?? null,
        parentConsultationId: null,
        totalAmount: '0',
      };
      return { parent: parentInfo, followUps };
    });
    return { consultationGroups: groups, orphanGroups: orphanGroupsList };
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
      {(listLoading || viewLoading || loading) && (
        <FullScreenLoader label="Loading consultations..." />
      )}
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isListRoute && (
            <Button
              onClick={() => navigate('/admin/consultations/new')}
              disabled={!targetClinicId}
              size="sm"
              className="shrink-0 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="mr-1.5 h-4 w-4" /> New consult
            </Button>
          )}
          {(isViewRoute || isFormRoute) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/consultations')}
              className="shrink-0 transition-all duration-200 hover:bg-muted/80 active:scale-[0.98]"
            >
              Back to records
            </Button>
          )}
        </div>
      </div>

      {isListRoute && (
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm ring-1 ring-black/[0.03] transition-[box-shadow,border-color] duration-300 hover:shadow-md dark:ring-white/[0.04]">
          <CardHeader className="shrink-0 space-y-0 border-b border-border/50 bg-muted/10 pb-3 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Consultation records</CardTitle>
                  <CardDescription className="mt-1 text-xs leading-relaxed sm:text-sm">
                    Open a row for full details. Refresh to reload the list.
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
            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading records...</p>
              </div>
            ) : consultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 transition-transform duration-300 hover:scale-105">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <p className="font-semibold text-foreground">No consultations yet</p>
                <p className="mt-1 max-w-sm px-4 text-sm text-muted-foreground">Create a new consult or pick another clinic to see records.</p>
                <Button
                  className="mt-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  size="sm"
                  disabled={!targetClinicId}
                  onClick={() => navigate('/admin/consultations/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New consult
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {upcomingFollowUps.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-0.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300/50 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-700/50">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Upcoming follow-ups ({upcomingFollowUps.length})
                      </span>
                    </div>
                    {upcomingFollowUps.map((f) => (
                      <div
                        key={f.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openConsultationRecord(f)}
                        onKeyDown={(e) => e.key === 'Enter' && openConsultationRecord(f)}
                        className={cn(
                          recordRowBase,
                          recordRowHoverUpcoming,
                          activeConsId === f.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200/80 to-amber-100/50 text-xs font-bold text-amber-900 ring-2 ring-amber-300/40 transition-transform duration-200 group-hover:scale-105 dark:from-amber-900/50 dark:to-amber-950/50 dark:text-amber-100"
                            aria-hidden
                          >
                            {patientInitials(f.patientName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                              {f.patientName || 'Patient'}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground tabular-nums sm:text-sm">
                              {fmtDateWithTime(f.consultationDate as string, f.consultationTime)}
                            </p>
                            {f.diagnosis ? (
                              <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">{diagnosisDisplay(f.diagnosis)}</p>
                            ) : (
                              <p className="mt-2 text-xs italic text-muted-foreground/80">No diagnosis recorded</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-amber-300/70 bg-amber-100/90 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                            <CalendarIcon className="h-3 w-3" />
                            Due {f.followUpDate ? format(new Date(f.followUpDate + 'T00:00:00'), 'dd-MM-yyyy') : '—'}
                          </span>
                          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-lg transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
                              onClick={() => openFollowUp(f)}
                              title="Schedule follow-up"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-lg transition-colors duration-200 hover:bg-muted"
                              onClick={() => handlePrint(f.id)}
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {orphanGroups.filter((g) => g.followUps.some((f) => !upcomingFollowUps.some((u) => u.id === f.id))).length > 0 && (
                  <div className="space-y-3">
                    <p className="px-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Other follow-ups (parent not in list)</p>
                    {orphanGroups
                      .filter((g) => g.followUps.some((f) => !upcomingFollowUps.some((u) => u.id === f.id)))
                      .map(({ parent, followUps }) => (
                        <div key={parent.id} className="space-y-2">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openConsultationRecord(parent)}
                            onKeyDown={(e) => { if (e.key === 'Enter') openConsultationRecord(parent); }}
                            className={cn(
                              recordRowBase,
                              recordRowHoverInitial,
                              'bg-primary/[0.04]',
                              activeConsId === parent.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-2 ring-primary/15 transition-transform duration-200 group-hover:scale-105"
                                aria-hidden
                              >
                                {patientInitials(followUps[0]?.patientName || parent.patientName || '?')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-base font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary">
                                  {followUps[0]?.patientName || parent.patientName || 'Patient'}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground tabular-nums sm:text-sm">
                                  {parent.consultationDate ? fmtDateWithTime(parent.consultationDate as string, parent.consultationTime) : 'Parent consultation'}
                                </p>
                                {parent.diagnosis ? (
                                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{diagnosisDisplay(parent.diagnosis)}</p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                              <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                <Stethoscope className="h-3.5 w-3.5" /> Initial visit
                              </span>
                              <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg transition-colors hover:bg-primary/10" onClick={() => openFollowUp(parent)} title="Schedule follow-up">
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg transition-colors hover:bg-muted" onClick={() => handlePrint(parent.id)} title="Print">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 space-y-2 border-l-2 border-amber-200/80 pl-4 dark:border-amber-800/80">
                            {followUps
                              .filter((f) => !upcomingFollowUps.some((u) => u.id === f.id))
                              .map((f) => (
                                <div
                                  key={f.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => openConsultationRecord(f)}
                                  onKeyDown={(e) => e.key === 'Enter' && openConsultationRecord(f)}
                                  className={cn(
                                    recordRowBase,
                                    recordRowHoverFollow,
                                    activeConsId === f.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                  )}
                                >
                                  <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300/50 transition-transform group-hover:scale-105 dark:bg-amber-950/50 dark:text-amber-200"
                                      aria-hidden
                                    >
                                      {patientInitials(f.patientName)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="truncate text-sm font-semibold sm:text-base">{f.patientName}</h3>
                                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                        {fmtDateWithTime(f.consultationDate as string, f.consultationTime)}
                                      </p>
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                          <FileText className="h-3 w-3" /> Follow-up
                                        </span>
                                        {f.followUpRequired === 1 && f.followUpDate && f.followUpDate >= todayStr && (
                                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                                            Due {format(new Date((f.followUpDate as string) + 'T00:00:00'), 'dd-MM')}
                                          </span>
                                        )}
                                      </div>
                                      {f.diagnosis ? (
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{diagnosisDisplay(f.diagnosis)}</p>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 gap-0.5 self-start pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10" onClick={() => openFollowUp(f)} title="Schedule follow-up">
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => handlePrint(f.id)} title="Print">
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {consultationGroups.map(({ initial, followUps }) => (
                  <div key={initial.id} className="space-y-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openConsultationRecord(initial)}
                      onKeyDown={(e) => e.key === 'Enter' && openConsultationRecord(initial)}
                      className={cn(
                        recordRowBase,
                        recordRowHoverInitial,
                        'bg-primary/[0.04]',
                        activeConsId === initial.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-sm font-bold text-primary ring-2 ring-primary/15 transition-transform duration-200 group-hover:scale-105"
                          aria-hidden
                        >
                          {patientInitials(initial.patientName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold leading-tight tracking-tight sm:text-lg transition-colors group-hover:text-primary">
                            {initial.patientName}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground tabular-nums sm:text-sm">
                            {fmtDateWithTime(initial.consultationDate as string, initial.consultationTime)}
                          </p>
                          {initial.diagnosis ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {diagnosisDisplay(initial.diagnosis)}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs italic text-muted-foreground/80">No diagnosis recorded</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            <Stethoscope className="h-3.5 w-3.5" /> Initial visit
                          </span>
                          {initial.followUpRequired === 1 && initial.followUpDate && initial.followUpDate >= todayStr && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-100/90 px-2 py-1 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                              Due {format(new Date((initial.followUpDate as string) + 'T00:00:00'), 'dd-MM')}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg transition-colors hover:bg-primary/10 hover:text-primary" onClick={() => openFollowUp(initial)} title="Schedule follow-up">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg transition-colors hover:bg-muted" onClick={() => handlePrint(initial.id)} title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {followUps.length > 0 && (
                      <div className="ml-2 space-y-2 border-l-2 border-amber-200/80 pl-4 dark:border-amber-800/80">
                        {followUps.map((f) => (
                          <div
                            key={f.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openConsultationRecord(f)}
                            onKeyDown={(e) => e.key === 'Enter' && openConsultationRecord(f)}
                            className={cn(
                              recordRowBase,
                              recordRowHoverFollow,
                              activeConsId === f.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300/50 transition-transform group-hover:scale-105 dark:bg-amber-950/50 dark:text-amber-200"
                                aria-hidden
                              >
                                {patientInitials(f.patientName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-semibold sm:text-base transition-colors group-hover:text-amber-900 dark:group-hover:text-amber-100">
                                  {f.patientName}
                                </h3>
                                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                  {fmtDateWithTime(f.consultationDate as string, f.consultationTime)}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                    <FileText className="h-3 w-3" /> Follow-up
                                  </span>
                                  {f.followUpRequired === 1 && f.followUpDate && f.followUpDate >= todayStr && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                                      Due {format(new Date((f.followUpDate as string) + 'T00:00:00'), 'dd-MM')}
                                    </span>
                                  )}
                                </div>
                                {f.diagnosis ? (
                                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{diagnosisDisplay(f.diagnosis)}</p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-0.5 self-start pt-0.5" onClick={(e) => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10" onClick={() => openFollowUp(f)} title="Schedule follow-up">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => handlePrint(f.id)} title="Print">
                                <Printer className="h-4 w-4" />
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
      )}

      {isFormRoute && (
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3 shrink-0">
            <div>
              <CardTitle className="text-lg">
                {form.parentConsultationId ? 'Add Follow-up' : 'New consult'}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {form.parentConsultationId
                  ? 'Data copied from previous visit. Edit symptoms, vitals, diagnosis and save as follow-up.'
                  : 'Select patient, doctor, date and prescription (medicine, dose, duration).'}
              </CardDescription>
            </div>
            <Button onClick={openNewConsultation} disabled={!targetClinicId} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> New consult
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
                <div className="mt-2 space-y-3">
                  {form.prescription.map((p, i) => (
                    <div key={i} className="rounded-xl border bg-gradient-to-b from-white to-emerald-50/20 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground">Medicine</Label>
                          <div className="mt-1">
                            <Popover open={prescriptionOpen === i} onOpenChange={(o) => setPrescriptionOpen(o ? i : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" size="sm" className="w-full justify-between font-normal">
                                  <span className="truncate">{p.medicineName || 'Select medicine'}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[320px] p-0" align="start">
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
            <Button onClick={handleSubmit} disabled={loading || !targetClinicId} className="w-full h-11 font-medium" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save & Print'}
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
                  View details. You can print or start a follow-up.
                </CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/consultations/new', { state: { parentConsultationId: consultationIdFromRoute, isReview: true } })}
                  disabled={!consultationIdFromRoute}
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
                  const doctorName = (() => {
                    const id = String(viewConsultation.doctorId ?? '');
                    return doctors.find((d) => d.id === id)?.name || id || '—';
                  })();
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
                                  Follow-up: {format(new Date(followUpDate + 'T00:00:00'), 'dd-MM-yyyy')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <Tabs defaultValue="clinical" className="w-full">
                        <div className="rounded-xl border bg-gradient-to-r from-emerald-50/70 via-background to-background p-1.5 shadow-sm">
                          <TabsList className="w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 h-auto">
                            <TabsTrigger
                              value="clinical"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Stethoscope className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Clinical
                            </TabsTrigger>
                            <TabsTrigger
                              value="vitals"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Activity className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Vitals
                            </TabsTrigger>
                            <TabsTrigger
                              value="history"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <ClipboardList className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              History
                            </TabsTrigger>
                            <TabsTrigger
                              value="prescription"
                              className="group gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-emerald-200 data-[state=active]:border data-[state=active]:border-emerald-500 data-[state=active]:-translate-y-[1px]"
                            >
                              <Pill className="h-4 w-4 shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
                              Prescription
                            </TabsTrigger>
                          </TabsList>
                        </div>

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

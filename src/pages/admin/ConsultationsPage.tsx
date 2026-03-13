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


type ConsultationRow = Record<string, unknown> & {
  id: string;
  patientName: string;
  consultationDate: string;
  totalAmount: string;
  parentConsultationId?: string | null;
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
  const [form, setForm] = useState({
    patientId: patientIdFromState || '',
    patientName: '',
    doctorId: '',
    consultationDate: format(new Date(), 'yyyy-MM-dd'),
    followUpDate: '',
    symptoms: '',
    diagnosis: '',
    notes: '',
    followUpRequired: false,
    parentConsultationId: '',
    weight: '' as string | number,
    bpSystolic: '' as string | number,
    bpDiastolic: '' as string | number,
    temperature: '' as string | number,
    pulse: '' as string | number,
    dietLifestyleAdvice: '',
    prescription: [] as { medicineId: string; medicineName: string; dosage: string; durationDays: string | number }[],
  });
  const [prescriptionOpen, setPrescriptionOpen] = useState<number | null>(null);
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<{ id: string; name: string; mobile: string }[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const { toast } = useToast();

  const targetClinicId = user?.role === 'admin' ? clinicId : user?.clinicId;

  useEffect(() => {
    if (patientIdFromState) setForm((f) => ({ ...f, patientId: patientIdFromState }));
  }, [patientIdFromState]);

  useEffect(() => {
    if (form.patientId && !form.patientName) {
      api.patients.get(form.patientId).then((p) => setForm((f) => ({ ...f, patientName: (p.name as string) || '' }))).catch(() => {});
    }
  }, [form.patientId]);


  useEffect(() => {
    if (!parentConsultationIdFromState || !isReview) return;
    api.consultations.get(parentConsultationIdFromState).then((cons) => {
      const presc = (cons.prescription as { medicineId?: string; medicineName?: string; dosage?: string; durationDays?: number }[]) || [];
      if (user?.role === 'admin' && cons.clinicId) setClinicId(cons.clinicId as string);
      setForm((f) => ({
        ...f,
        parentConsultationId: parentConsultationIdFromState,
        patientId: cons.patientId as string,
        doctorId: cons.doctorId as string,
        symptoms: (cons.symptoms as string) || '',
        diagnosis: (cons.diagnosis as string) || '',
        notes: (cons.notes as string) || '',
        followUpRequired: true,
        followUpDate: (cons.followUpDate as string) || '',
        weight: cons.weight != null ? String(cons.weight) : '',
        bpSystolic: cons.bpSystolic != null ? String(cons.bpSystolic) : '',
        bpDiastolic: cons.bpDiastolic != null ? String(cons.bpDiastolic) : '',
        temperature: cons.temperature != null ? String(cons.temperature) : '',
        pulse: cons.pulse != null ? String(cons.pulse) : '',
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
    if (!form.patientId || !form.doctorId || !targetClinicId) {
      toast({ title: 'Missing fields', description: 'Patient, doctor and clinic required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const created = await api.consultations.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        clinicId: targetClinicId,
        consultationDate: form.consultationDate,
        symptoms: form.symptoms || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
        consultationFee: 0,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpDate || undefined,
        parentConsultationId: form.parentConsultationId || undefined,
        weight: toNum(form.weight),
        bpSystolic: toNum(form.bpSystolic),
        bpDiastolic: toNum(form.bpDiastolic),
        temperature: toNum(form.temperature),
        pulse: toNum(form.pulse),
        dietLifestyleAdvice: form.dietLifestyleAdvice || undefined,
        prescription: form.prescription.filter((p) => p.medicineId).map((p) => ({
          medicineId: p.medicineId,
          dosage: p.dosage || undefined,
          durationDays: toNum(p.durationDays),
        })),
      }) as { id?: string };
      toast({ title: 'Consultation saved', description: 'Prescription recorded. Add fee & medicines at Pharmacy.' });
      const savedPatientId = form.patientId;
      const savedPatientName = form.patientName;
      setForm({
        patientId: savedPatientId,
        patientName: savedPatientName,
        doctorId: '',
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        followUpDate: '',
        symptoms: '',
        diagnosis: '',
        notes: '',
        followUpRequired: false,
        parentConsultationId: '',
        weight: '',
        bpSystolic: '',
        bpDiastolic: '',
        temperature: '',
        pulse: '',
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
    setForm({
      patientId: '',
      patientName: '',
      doctorId: '',
      consultationDate: format(new Date(), 'yyyy-MM-dd'),
      followUpDate: '',
      symptoms: '',
      diagnosis: '',
      notes: '',
      followUpRequired: false,
      parentConsultationId: '',
      weight: '',
      bpSystolic: '',
      bpDiastolic: '',
      temperature: '',
      pulse: '',
      dietLifestyleAdvice: '',
      prescription: [],
    });
  };

  const loadConsultationForFollowUp = (consultationId: string) => {
    api.consultations.get(consultationId).then((data) => {
      const presc = (data.prescription as { medicineId?: string; medicineName?: string; dosage?: string; durationDays?: number }[]) || [];
      const d = data as Record<string, unknown>;
      setForm((f) => ({
        ...f,
        patientId: data.patientId as string,
        patientName: data.patientName as string,
        doctorId: data.doctorId as string,
        parentConsultationId: consultationId,
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        followUpRequired: true,
        symptoms: (data.symptoms as string) || '',
        diagnosis: (data.diagnosis as string) || '',
        notes: (data.notes as string) || '',
        weight: d.weight != null ? String(d.weight) : '',
        bpSystolic: d.bpSystolic != null ? String(d.bpSystolic) : '',
        bpDiastolic: d.bpDiastolic != null ? String(d.bpDiastolic) : '',
        temperature: d.temperature != null ? String(d.temperature) : '',
        pulse: d.pulse != null ? String(d.pulse) : '',
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
          <Select value={clinicId || undefined} onValueChange={setClinicId}>
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
                  {form.patientId ? form.patientName || 'Patient' : 'Consultation Records'}
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
                <p className="text-sm text-muted-foreground mt-1">Select a patient to filter or create a new consultation</p>
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
                            <p className="font-medium text-sm">{form.patientId ? f.consultationDate : f.patientName}</p>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                              <FileText className="h-3 w-3" /> Follow-up
                            </span>
                          </div>
                          {f.diagnosis && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{String(f.diagnosis)}</p>
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
                          <p className="font-semibold text-sm">{form.patientId ? initial.consultationDate : initial.patientName}</p>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold border border-primary/30">
                            <Stethoscope className="h-3.5 w-3.5" /> Initial Visit
                          </span>
                        </div>
                        {initial.diagnosis && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{String(initial.diagnosis)}</p>
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
                                <p className="font-medium text-sm">{form.patientId ? f.consultationDate : f.patientName}</p>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-semibold border border-amber-200/60">
                                  <FileText className="h-3 w-3" /> Follow-up
                                </span>
                              </div>
                              {f.diagnosis && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{String(f.diagnosis)}</p>
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
            <div>
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Patient <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Popover open={patientSearchOpen} onOpenChange={(open) => { setPatientSearchOpen(open); if (open) loadRecentPatients(); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className={cn('flex-1 justify-between font-normal h-10', !form.patientName && 'text-muted-foreground')}>
                      <span className="truncate">{form.patientName || 'Search patient by name...'}</span>
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
                          <CommandEmpty>No patient found. Try different search.</CommandEmpty>
                          <CommandGroup>
                            {patientSearchResults.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.id}
                                onSelect={() => {
                                  setForm((f) => ({ ...f, patientId: p.id, patientName: p.name }));
                                  setPatientSearchOpen(false);
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
                <Button size="icon" variant="ghost" className="shrink-0 h-10 w-10" onClick={() => setForm((f) => ({ ...f, patientId: '', patientName: '' }))} title="Clear patient">
                  <X className="h-4 w-4" />
                </Button>
              )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Doctor <span className="text-destructive">*</span></Label>
                <Select value={form.doctorId} onValueChange={(v) => setForm((f) => ({ ...f, doctorId: v }))}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  className="h-10"
                  value={form.consultationDate}
                  onChange={(e) => setForm((f) => ({ ...f, consultationDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" step="0.1" className="h-9" placeholder="—" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">BP (mmHg)</Label>
                <div className="flex gap-1 items-center">
                  <Input type="number" className="h-9 w-14" placeholder="—" value={form.bpSystolic} onChange={(e) => setForm((f) => ({ ...f, bpSystolic: e.target.value }))} />
                  <span className="text-muted-foreground">/</span>
                  <Input type="number" className="h-9 w-14" placeholder="—" value={form.bpDiastolic} onChange={(e) => setForm((f) => ({ ...f, bpDiastolic: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Temperature (°C)</Label>
                <Input type="number" step="0.1" className="h-9" placeholder="—" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Pulse (bpm)</Label>
                <Input type="number" className="h-9" placeholder="—" value={form.pulse} onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))} />
              </div>
            </div>
            <div className="pt-4 border-t space-y-4">
            <div>
              <Label>Symptoms</Label>
              <Textarea value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} placeholder="Patient symptoms" rows={2} className="resize-none" />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnosis" rows={2} />
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
                      <SelectItem key={c.id} value={c.id}>{c.patientName} – {c.consultationDate}</SelectItem>
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
              <p className="text-xs text-muted-foreground mb-1">Medicine | Dosage | Duration — Patient may not buy all</p>
              {form.prescription.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.prescription.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2 flex-wrap">
                      <Popover open={prescriptionOpen === i} onOpenChange={(o) => setPrescriptionOpen(o ? i : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="min-w-[140px] justify-between font-normal">
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
                      <Input className="w-28" placeholder="e.g. 1 tab BD" value={p.dosage} onChange={(e) => updatePrescription(i, 'dosage', e.target.value)} />
                      <Input type="number" className="w-16" placeholder="days" value={p.durationDays} onChange={(e) => updatePrescription(i, 'durationDays', e.target.value)} min={0} />
                      <Button size="icon" variant="ghost" onClick={() => removePrescription(i)}><Trash2 className="h-4 w-4" /></Button>
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
      </div>
    </div>
  );
};

export default ConsultationsPage;

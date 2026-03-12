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
import { Plus, Trash2, Printer, RotateCcw, CalendarIcon, Search, User, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DEFAULT_FEE = 250;

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
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
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
    consultationFee: DEFAULT_FEE,
    followUpRequired: false,
    parentConsultationId: '',
    medicines: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
  });
  const [medicineOpen, setMedicineOpen] = useState<number | null>(null);
  const [followUpDateOpen, setFollowUpDateOpen] = useState(false);
  const [activeConsId, setActiveConsId] = useState<string | null>(null);
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
      const meds = (cons.medicines as { inventoryId?: string; medicineId?: string; medicineName: string; quantity: number; unitPrice: string }[]) || [];
      if (user?.role === 'admin' && cons.clinicId) setClinicId(cons.clinicId as string);
      setForm((f) => ({
        ...f,
        parentConsultationId: parentConsultationIdFromState,
        patientId: cons.patientId as string,
        doctorId: cons.doctorId as string,
        symptoms: (cons.symptoms as string) || '',
        diagnosis: (cons.diagnosis as string) || '',
        notes: (cons.notes as string) || '',
        consultationFee: Number(cons.consultationFee) || DEFAULT_FEE,
        followUpRequired: true,
        followUpDate: (cons.followUpDate as string) || '',
        medicines: meds.filter((m) => m.inventoryId && m.medicineId).map((m) => ({
          inventoryId: m.inventoryId!,
          medicineId: m.medicineId!,
          medicineName: m.medicineName || 'Medicine',
          quantity: m.quantity,
          unitPrice: parseFloat(m.unitPrice) || 0,
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
  }, [user?.role]);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
    } else setInventory([]);
  }, [targetClinicId]);

  const loadConsultations = () => {
    if (user?.role === 'admin' && !targetClinicId) return;
    setListLoading(true);
    const params: Record<string, string> = user?.role === 'admin' ? { clinicId: targetClinicId } : {};
    if (form.patientId?.trim()) params.patientId = form.patientId.trim();
    api.consultations.list(params)
      .then((data) => setConsultations(data as ConsultationRow[]))
      .catch(() => setConsultations([]))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadConsultations();
  }, [targetClinicId, user?.role, form.patientId]);

  const addMedicine = () => {
    const inv = inventory[0] as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
    if (!inv) return;
    setForm((f) => ({
      ...f,
      medicines: [...f.medicines, { inventoryId: inv.id, medicineId: inv.medicineId, medicineName: inv.medicineName || 'Medicine', quantity: 1, unitPrice: parseFloat(inv.sellingPrice as string) || 0 }],
    }));
    setMedicineOpen(form.medicines.length);
  };

  const selectMedicine = (idx: number, inv: { id: string; medicineId: string; medicineName: string; sellingPrice: string; currentStock?: number }) => {
    setForm((f) => ({
      ...f,
      medicines: f.medicines.map((m, i) =>
        i === idx ? { ...m, inventoryId: inv.id, medicineId: inv.medicineId, medicineName: inv.medicineName || 'Medicine', unitPrice: parseFloat(inv.sellingPrice as string) || 0 } : m
      ),
    }));
    setMedicineOpen(null);
  };

  const removeMedicine = (idx: number) => {
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  };

  const updateMedicine = (idx: number, field: string, value: number | string) => {
    setForm((f) => ({
      ...f,
      medicines: f.medicines.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const medicineTotal = form.medicines.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const totalAmount = form.consultationFee + medicineTotal;

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
        consultationFee: form.consultationFee,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpDate || undefined,
        parentConsultationId: form.parentConsultationId || undefined,
        medicines: form.medicines.map((m) => ({
          inventoryId: m.inventoryId,
          medicineId: m.medicineId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      }) as { id?: string };
      toast({ title: 'Consultation saved', description: `Total: ₹${totalAmount}` });
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
        consultationFee: DEFAULT_FEE,
        followUpRequired: false,
        parentConsultationId: '',
        medicines: [],
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
      consultationFee: DEFAULT_FEE,
      followUpRequired: false,
      parentConsultationId: '',
      medicines: [],
    });
  };

  const openReviewFromConsultation = (cons: ConsultationRow) => {
    api.consultations.get(cons.id).then((data) => {
      const meds = (data.medicines as { inventoryId?: string; medicineId?: string; medicineName: string; quantity: number; unitPrice: string }[]) || [];
      setActiveConsId(cons.id);
      setForm({
        patientId: data.patientId as string,
        patientName: data.patientName as string,
        doctorId: data.doctorId as string,
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        followUpDate: '',
        symptoms: (data.symptoms as string) || '',
        diagnosis: (data.diagnosis as string) || '',
        notes: (data.notes as string) || '',
        consultationFee: Number(data.consultationFee) || DEFAULT_FEE,
        followUpRequired: true,
        parentConsultationId: cons.id,
        medicines: meds.filter((m) => m.inventoryId && m.medicineId).map((m) => ({
          inventoryId: m.inventoryId!,
          medicineId: m.medicineId!,
          medicineName: m.medicineName || 'Medicine',
          quantity: m.quantity,
          unitPrice: parseFloat(m.unitPrice) || 0,
        })),
      });
    }).catch(() => toast({ title: 'Failed to load details', variant: 'destructive' }));
  };

  const openFollowUp = (cons: ConsultationRow) => {
    openReviewFromConsultation(cons);
  };

  const viewConsultationDetails = (cons: ConsultationRow) => {
    openReviewFromConsultation(cons);
  };

  const invList = inventory as { id: string; medicineId: string; medicineName: string; sellingPrice: string; currentStock?: number }[];

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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <PageHeader title="Consultations" description="View consultations and create new or follow-up" />
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(400px,1.5fr)] gap-6 flex-1 min-h-0">
        {/* Left: Recent Consultations (filtered by patient when selected) */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">
                  {form.patientId ? form.patientName || 'Patient' : 'Recent Consultations'}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {form.patientId ? 'This patient only. ' : ''}Click row to add review
                </CardDescription>
              </div>
              {form.patientId && (
                <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, patientId: '', patientName: '' }))} className="shrink-0">
                  Show all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading consultations...</p>
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
              <div className="space-y-2">
                {consultations.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => viewConsultationDetails(c)}
                    onKeyDown={(e) => e.key === 'Enter' && viewConsultationDetails(c)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border p-3.5 cursor-pointer transition-all duration-200',
                      activeConsId === c.id ? 'ring-2 ring-primary border-primary/30 bg-primary/5 shadow-sm' : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{form.patientId ? c.consultationDate : c.patientName}</p>
                        {c.parentConsultationId ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-medium">Review</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-medium">Consult</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {!form.patientId && `${c.consultationDate} · `}<span className="font-medium text-foreground">₹{c.totalAmount}</span>
                      </p>
                      {c.diagnosis && <p className="text-xs text-muted-foreground mt-0.5 truncate">{String(c.diagnosis)}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openFollowUp(c)} title="Add review">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(c.id)} title="Print">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: New/Review form */}
        <Card className="flex flex-col min-h-0 border-l-0 lg:border-l">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg">
                {form.parentConsultationId ? 'Add Review' : 'New Consult'}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {form.parentConsultationId
                  ? 'Data copied from previous. Edit and save as new review.'
                  : 'Select patient, doctor, date and medicines.'}
              </CardDescription>
            </div>
            <Button onClick={openNewConsultation} disabled={!targetClinicId} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> New Consult
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
                <Select value={form.parentConsultationId || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, parentConsultationId: v === '__none__' ? '' : v }))}>
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
            <div>
              <Label>Consultation Fee (₹)</Label>
              <Input type="number" value={form.consultationFee} onChange={(e) => setForm((f) => ({ ...f, consultationFee: Number(e.target.value) || DEFAULT_FEE }))} />
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">Medicines</Label>
                <Button size="sm" variant="outline" onClick={addMedicine} disabled={!targetClinicId || inventory.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Add medicine
                </Button>
              </div>
              {form.medicines.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2">
                      <Popover open={medicineOpen === i} onOpenChange={(o) => setMedicineOpen(o ? i : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                            {m.medicineName || 'Select medicine'}
                            <span className="text-muted-foreground ml-1">({invList.find((x) => x.id === m.inventoryId)?.currentStock ?? 0} left)</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search medicine..." />
                            <CommandList>
                              <CommandEmpty>No medicine found</CommandEmpty>
                              <CommandGroup>
                                {invList
                                  .filter((inv) => inv.currentStock !== undefined && inv.currentStock > 0)
                                  .map((inv) => (
                                    <CommandItem key={inv.id} value={inv.medicineName} onSelect={() => selectMedicine(i, inv)}>
                                      {inv.medicineName} (Stock: {inv.currentStock}) – ₹{inv.sellingPrice}
                                    </CommandItem>
                                  ))}
                                {invList.filter((inv) => (inv.currentStock ?? 0) > 0).length === 0 && (
                                  <CommandItem disabled>No stock available</CommandItem>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input type="number" className="w-16" value={m.quantity} onChange={(e) => updateMedicine(i, 'quantity', Number(e.target.value) || 1)} min={1} />
                      <Input type="number" className="w-20" value={m.unitPrice} onChange={(e) => updateMedicine(i, 'unitPrice', Number(e.target.value) || 0)} />
                      <span className="text-sm">₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeMedicine(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Consultation Fee</span><span>₹{form.consultationFee}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Medicines</span><span>₹{medicineTotal}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span className="text-primary">₹{totalAmount}</span></div>
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

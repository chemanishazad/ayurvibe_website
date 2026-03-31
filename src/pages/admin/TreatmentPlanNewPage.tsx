import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { addDays, format, subDays } from 'date-fns';

const MASTER_NONE = '__master_none__';

/** Hide browser steppers on rupee amount inputs */
const INPUT_NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

type ConsumableRow = { medicineId: string; quantityUsed: string; notes: string };

type PatientRow = { id: string; name: string; mobile: string };

const TreatmentPlanNewPage = () => {
  const navigate = useNavigate();
  const { effectiveClinicId: targetClinicId, isAdmin } = useAdminClinic();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [masters, setMasters] = useState<Record<string, unknown>[]>([]);
  const [medicines, setMedicines] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    treatmentMasterId: '' as string,
    name: '',
    description: '',
    durationDays: 7,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    instructions: '',
    /** Package fee: total, advance, balance = total − advance (shown live; stored on save). */
    totalCost: '',
    advancePaid: '',
    consumables: [] as ConsumableRow[],
  });
  const { toast } = useToast();

  const packageMoney = useMemo(() => {
    const total = Math.max(0, parseFloat(String(form.totalCost).replace(/,/g, '')) || 0);
    const advance = Math.min(Math.max(0, parseFloat(String(form.advancePaid).replace(/,/g, '')) || 0), total);
    const balance = Math.max(0, total - advance);
    return { total, advance, balance };
  }, [form.totalCost, form.advancePaid]);

  useEffect(() => {
    api.medicines.list().then(setMedicines).catch(() => setMedicines([]));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (targetClinicId) params.clinicId = targetClinicId;
    api.patients
      .list(params)
      .then((rows) =>
        setPatients(
          (rows as PatientRow[]).map((r) => ({
            id: r.id as string,
            name: r.name as string,
            mobile: String(r.mobile ?? ''),
          })),
        ),
      )
      .catch(() => setPatients([]));
  }, [targetClinicId]);

  useEffect(() => {
    if (targetClinicId) {
      api.treatmentMasters.list({ clinicId: targetClinicId }).then(setMasters).catch(() => setMasters([]));
    } else if (isAdmin) {
      api.treatmentMasters.list().then(setMasters).catch(() => setMasters([]));
    } else {
      setMasters([]);
    }
  }, [targetClinicId, isAdmin]);

  useEffect(() => {
    if (form.startDate && form.durationDays) {
      const start = new Date(form.startDate);
      start.setDate(start.getDate() + form.durationDays);
      setForm((f) => ({ ...f, endDate: format(start, 'yyyy-MM-dd') }));
    }
  }, [form.startDate, form.durationDays]);

  useEffect(() => {
    const pid = form.patientId;
    const cid = targetClinicId;
    if (!pid || !cid) {
      setDiagnosis(null);
      return;
    }
    let cancelled = false;
    const from = format(subDays(new Date(), 365), 'yyyy-MM-dd');
    const to = format(addDays(new Date(), 90), 'yyyy-MM-dd');
    api.consultations
      .list({ patientId: pid, clinicId: cid, from, to })
      .then((rows) => {
        if (cancelled) return;
        const sorted = [...rows].sort(
          (a, b) =>
            String((b as { consultationDate?: string }).consultationDate ?? '').localeCompare(
              String((a as { consultationDate?: string }).consultationDate ?? ''),
            ),
        );
        const withDx = sorted.find((r) => {
          const d = (r as { diagnosis?: string }).diagnosis;
          return typeof d === 'string' && d.trim().length > 0;
        });
        setDiagnosis(withDx ? String((withDx as { diagnosis: string }).diagnosis) : null);
      })
      .catch(() => {
        if (!cancelled) setDiagnosis(null);
      });
    return () => {
      cancelled = true;
    };
  }, [form.patientId, targetClinicId]);

  const addConsumable = () => {
    const med = medicines[0] as { id: string } | undefined;
    if (!med) return;
    setForm((f) => ({
      ...f,
      consumables: [...f.consumables, { medicineId: med.id, quantityUsed: '', notes: '' }],
    }));
  };

  const removeConsumable = (idx: number) => {
    setForm((f) => ({ ...f, consumables: f.consumables.filter((_, i) => i !== idx) }));
  };

  const updateConsumable = (idx: number, field: keyof ConsumableRow, value: string) => {
    setForm((f) => ({
      ...f,
      consumables: f.consumables.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const handleSubmit = async () => {
    if (!form.patientId || !form.name || !form.startDate || !form.endDate) {
      toast({
        title: 'Missing fields',
        description: 'Patient, plan name, start and end dates are required.',
        variant: 'destructive',
      });
      return;
    }
    if (!targetClinicId) {
      toast({
        title: 'Clinic required',
        description: isAdmin
          ? 'Choose a branch in the header (or pick one clinic) so the plan is stored correctly.'
          : 'Your session has no active clinic. Reload or contact admin.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await api.treatmentPlans.create({
        patientId: form.patientId,
        clinicId: targetClinicId,
        treatmentMasterId: form.treatmentMasterId || undefined,
        name: form.name,
        description: form.description || undefined,
        durationDays: form.durationDays,
        startDate: form.startDate,
        endDate: form.endDate,
        totalCost: packageMoney.total,
        advancePaid: packageMoney.advance,
        instructions: form.instructions || undefined,
        consumables: form.consumables
          .filter((c) => c.medicineId)
          .map((c) => ({
            medicineId: c.medicineId,
            quantityUsed: c.quantityUsed.trim() || undefined,
            notes: c.notes.trim() || undefined,
          })),
      });
      toast({ title: 'Treatment plan created' });
      navigate('/admin/treatment-plans');
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const staffNeedsClinic = !isAdmin && !targetClinicId;

  return (
    <div className="space-y-8">
      <PageHeader
        title="New treatment plan"
        description="Set package total and advance here; balance is calculated. Add session consumables (oils, etc.) below. Further payments can be recorded on Pharmacy → New invoice."
      >
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/treatment-plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Link>
        </Button>
      </PageHeader>

      {staffNeedsClinic && (
        <p className="text-sm text-destructive">No clinic in your session — open OP or reload after login.</p>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
          <CardDescription>
            Patient identifies who receives care; multiple plans per day are allowed. Treatment master fills name and
            description when selected. Enter the agreed package amount and any advance — balance due updates
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Select
              value={form.patientId || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}
              disabled={patients.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={patients.length === 0 ? 'No patients loaded' : 'Select patient'} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.mobile ? `${p.name} · ${p.mobile}` : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {patients.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No patients match this workspace. Admins: pick a branch in the header to see patients who visited that
                clinic, or leave “all clinics” to search everyone.
              </p>
            )}
          </div>

          {diagnosis != null && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">Latest diagnosis (from OP at this clinic)</span>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{diagnosis}</p>
            </div>
          )}

          <div>
            <Label>Treatment master (template)</Label>
            <Select
              value={form.treatmentMasterId ? form.treatmentMasterId : MASTER_NONE}
              onValueChange={(v) => {
                if (v === MASTER_NONE) {
                  setForm((f) => ({ ...f, treatmentMasterId: '' }));
                  return;
                }
                const m = masters.find((x) => (x as { id: string }).id === v) as
                  | { id: string; name: string; description?: string | null; defaultDurationDays?: number | null }
                  | undefined;
                if (!m) return;
                setForm((f) => ({
                  ...f,
                  treatmentMasterId: m.id,
                  name: m.name,
                  description: (m.description ?? '') as string,
                  durationDays: m.defaultDurationDays != null ? Number(m.defaultDurationDays) : f.durationDays,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional — pick to fill name & description" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={MASTER_NONE}>None (manual)</SelectItem>
                {masters.map((m) => (
                  <SelectItem key={(m as { id: string }).id} value={(m as { id: string }).id}>
                    {(m as { name: string }).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plan name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Abhyanga 1–2 pm"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Treatment description"
              rows={2}
            />
          </div>
          <div>
            <Label>Duration (days)</Label>
            <Input
              type="number"
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) || 7 }))}
              min={1}
            />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Internal instructions for staff"
              rows={2}
            />
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Package billing</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total = agreed therapy/package fee. Advance = already collected (cash, UPI, etc.). Balance due = total
                minus advance — same rule as clinic scheduling when you create a plan from OP.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tp-total">Total package amount (₹)</Label>
                <Input
                  id="tp-total"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className={INPUT_NO_SPIN}
                  value={form.totalCost}
                  onChange={(e) => setForm((f) => ({ ...f, totalCost: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp-advance">Advance paid (₹)</Label>
                <Input
                  id="tp-advance"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className={INPUT_NO_SPIN}
                  value={form.advancePaid}
                  onChange={(e) => setForm((f) => ({ ...f, advancePaid: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-dashed border-border bg-background/80 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Balance due (calculated)</span>
              <span className="font-semibold tabular-nums text-foreground">₹{packageMoney.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session consumables</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Oils, powders, or stock used during therapy — quantity or notes only (no dosage schedule).
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addConsumable} disabled={medicines.length === 0}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {form.consumables.length > 0 && (
              <div className="mt-2 space-y-2">
                {form.consumables.map((row, i) => (
                  <div key={i} className="rounded border p-2 space-y-2">
                    <Select value={row.medicineId} onValueChange={(v) => updateConsumable(i, 'medicineId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((med) => (
                          <SelectItem key={(med as { id: string }).id} value={(med as { id: string }).id}>
                            {(med as { name: string }).name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Qty (e.g. 50 ml)"
                        value={row.quantityUsed}
                        onChange={(e) => updateConsumable(i, 'quantityUsed', e.target.value)}
                      />
                      <Input
                        placeholder="Notes"
                        value={row.notes}
                        onChange={(e) => updateConsumable(i, 'notes', e.target.value)}
                      />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeConsumable(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.patientId || !form.name || !targetClinicId || staffNeedsClinic}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Create treatment plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentPlanNewPage;

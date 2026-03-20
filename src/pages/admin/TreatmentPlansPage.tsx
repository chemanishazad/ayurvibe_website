import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const TreatmentPlansPage = () => {
  const { effectiveClinicId: targetClinicId } = useAdminClinic();
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [consultations, setConsultations] = useState<Record<string, unknown>[]>([]);
  const [medicines, setMedicines] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    consultationId: '',
    name: '',
    description: '',
    durationDays: 7,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    instructions: '',
    medicines: [] as { medicineId: string; medicineName: string; dosage: string; frequency: string; durationDays: number; specialInstructions: string }[],
  });
  const { toast } = useToast();

  useEffect(() => {
    api.medicines.list().then(setMedicines).catch(() => setMedicines([]));
  }, []);

  useEffect(() => {
    api.treatmentPlans.list().then(setPlans).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (targetClinicId) {
      const from = format(new Date(), 'yyyy-MM-dd');
      const to = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      api.consultations.list({ clinicId: targetClinicId, from, to }).then(setConsultations).catch(() => setConsultations([]));
    } else {
      setConsultations([]);
    }
  }, [targetClinicId]);

  useEffect(() => {
    if (form.startDate && form.durationDays) {
      const start = new Date(form.startDate);
      start.setDate(start.getDate() + form.durationDays);
      setForm((f) => ({ ...f, endDate: format(start, 'yyyy-MM-dd') }));
    }
  }, [form.startDate, form.durationDays]);

  const addMedicine = () => {
    const med = medicines[0] as { id: string; name: string };
    if (!med) return;
    setForm((f) => ({
      ...f,
      medicines: [...f.medicines, { medicineId: med.id, medicineName: med.name, dosage: '', frequency: '', durationDays: 0, specialInstructions: '' }],
    }));
  };

  const removeMedicine = (idx: number) => {
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  };

  const updateMedicine = (idx: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      medicines: f.medicines.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const handleSubmit = async () => {
    if (!form.consultationId || !form.name || !form.startDate || !form.endDate) {
      toast({ title: 'Missing fields', description: 'Consultation, name, start and end dates required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.treatmentPlans.create({
        consultationId: form.consultationId,
        name: form.name,
        description: form.description || undefined,
        durationDays: form.durationDays,
        startDate: form.startDate,
        endDate: form.endDate,
        instructions: form.instructions || undefined,
        medicines: form.medicines.map((m) => ({
          medicineId: m.medicineId,
          dosage: m.dosage || undefined,
          frequency: m.frequency || undefined,
          durationDays: m.durationDays || undefined,
          specialInstructions: m.specialInstructions || undefined,
        })),
      });
      toast({ title: 'Treatment plan created' });
      setForm({
        consultationId: '',
        name: '',
        description: '',
        durationDays: 7,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        instructions: '',
        medicines: [],
      });
      api.treatmentPlans.list().then(setPlans);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Treatment Plans" description="Ayurvedic treatment plans with duration and medicines. Use the header clinic selector for multi-clinic admins." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Treatment Plan</CardTitle>
            <CardDescription>Link to consultation and add medicines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Consultation</Label>
              <Select value={form.consultationId} onValueChange={(v) => setForm((f) => ({ ...f, consultationId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select consultation" />
                </SelectTrigger>
                <SelectContent>
                  {consultations.map((c) => (
                    <SelectItem key={c.id as string} value={c.id as string}>
                      {(c.patientName as string)} – {(c.consultationDate as string)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Panchakarma 7-day" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Treatment description" rows={2} />
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
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} placeholder="Treatment instructions" rows={2} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button size="sm" variant="outline" onClick={addMedicine} disabled={medicines.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {form.medicines.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="rounded border p-2 space-y-2">
                      <Select
                        value={m.medicineId}
                        onValueChange={(v) => {
                          const med = medicines.find((x) => (x as { id: string }).id === v) as { id: string; name: string };
                          if (med) updateMedicine(i, 'medicineId', v), updateMedicine(i, 'medicineName', med.name);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                        <Input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} />
                        <Input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} />
                        <Input type="number" placeholder="Duration days" value={m.durationDays || ''} onChange={(e) => updateMedicine(i, 'durationDays', Number(e.target.value) || 0)} />
                        <Input placeholder="Before/after food" value={m.specialInstructions} onChange={(e) => updateMedicine(i, 'specialInstructions', e.target.value)} />
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeMedicine(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={loading || !form.consultationId || !form.name} className="w-full">
              {loading ? 'Saving...' : 'Create Treatment Plan'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Treatment Plans</CardTitle>
            <CardDescription>All treatment plans</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-muted-foreground">No treatment plans yet</p>
            ) : (
              <div className="space-y-2">
                {plans.map((p) => (
                  <div key={p.id as string} className="rounded border p-3 text-sm">
                    <div className="flex justify-between font-medium">
                      <span>{p.name as string}</span>
                      <span className="text-muted-foreground">{(p.durationDays as number)} days</span>
                    </div>
                    <p className="text-muted-foreground">{(p.patientName as string)} · {(p.consultationDate as string)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(p.startDate as string)} – {(p.endDate as string)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TreatmentPlansPage;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getAuthUser } from '@/pages/Login';
import { Plus, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_FEE = 250;

const ConsultationsPage = () => {
  const user = getAuthUser();
  const location = useLocation();
  const patientIdFromState = (location.state as { patientId?: string })?.patientId;
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [consultations, setConsultations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState('');
  const [form, setForm] = useState({
    patientId: patientIdFromState || '',
    patientName: '',
    doctorId: '',
    consultationDate: format(new Date(), 'yyyy-MM-dd'),
    symptoms: '',
    diagnosis: '',
    notes: '',
    consultationFee: DEFAULT_FEE,
    medicines: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
  });
  const [selectedCons, setSelectedCons] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  const targetClinicId = user?.role === 'admin' ? clinicId : user?.clinicId;

  useEffect(() => {
    if (patientIdFromState) {
      setForm((f) => ({ ...f, patientId: patientIdFromState }));
    }
  }, [patientIdFromState]);

  useEffect(() => {
    api.clinics.list().then((data) => {
      setClinics(data);
      if (user?.role === 'admin' && data.length > 0) setClinicId((c) => (c || data[0].id));
    }).catch(() => setClinics([]));
    api.doctors.list().then(setDoctors).catch(() => setDoctors([]));
  }, [user?.role]);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
    } else {
      setInventory([]);
    }
  }, [targetClinicId]);

  useEffect(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = from;
    api.consultations.list({ clinicId: targetClinicId || undefined, from, to }).then(setConsultations).catch(() => setConsultations([]));
  }, [targetClinicId]);

  const addMedicine = () => {
    const inv = inventory[0] as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
    if (!inv) return;
    setForm((f) => ({
      ...f,
      medicines: [...f.medicines, { inventoryId: inv.id, medicineId: inv.medicineId, medicineName: inv.medicineName || 'Medicine', quantity: 1, unitPrice: parseFloat(inv.sellingPrice as string) || 0 }],
    }));
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
      await api.consultations.create({
        patientId: form.patientId,
        doctorId: form.doctorId,
        clinicId: targetClinicId,
        consultationDate: form.consultationDate,
        symptoms: form.symptoms || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
        consultationFee: form.consultationFee,
        medicines: form.medicines.map((m) => ({
          inventoryId: m.inventoryId,
          medicineId: m.medicineId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      });
      toast({ title: 'Consultation created', description: `Total: ₹${totalAmount}` });
      setForm({
        patientId: '',
        patientName: '',
        doctorId: '',
        consultationDate: format(new Date(), 'yyyy-MM-dd'),
        symptoms: '',
        diagnosis: '',
        notes: '',
        consultationFee: DEFAULT_FEE,
        medicines: [],
      });
      api.consultations.list({ clinicId: targetClinicId || undefined, from: form.consultationDate, to: form.consultationDate }).then(setConsultations);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const cons = await api.consultations.get(id);
      setSelectedCons(cons);
      setTimeout(() => window.print(), 100);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load prescription', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consultations</h1>
        <p className="text-muted-foreground">Create consultation and dispense medicines</p>
      </div>

      {user?.role === 'admin' && clinics.length > 0 && (
        <div>
          <Label>Clinic</Label>
          <Select value={clinicId || undefined} onValueChange={setClinicId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Consultation</CardTitle>
            <CardDescription>Patient, doctor, date and optional medicines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Patient ID</Label>
              <Input
                placeholder="Search patient first, then click New Consultation or paste ID"
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Get from Patients page → Search by mobile → New Consultation</p>
            </div>
            <div>
              <Label>Doctor</Label>
              <Select value={form.doctorId} onValueChange={(v) => setForm((f) => ({ ...f, doctorId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.consultationDate}
                onChange={(e) => setForm((f) => ({ ...f, consultationDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Symptoms</Label>
              <Textarea
                value={form.symptoms}
                onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
                placeholder="Patient symptoms"
                rows={2}
              />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Textarea
                value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                placeholder="Diagnosis"
                rows={2}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
            </div>
            <div>
              <Label>Consultation Fee (₹)</Label>
              <Input
                type="number"
                value={form.consultationFee}
                onChange={(e) => setForm((f) => ({ ...f, consultationFee: Number(e.target.value) || DEFAULT_FEE }))}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button size="sm" variant="outline" onClick={addMedicine} disabled={!targetClinicId || inventory.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {form.medicines.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2">
                      <Select
                        value={m.inventoryId}
                        onValueChange={(v) => {
                          const inv = inventory.find((x) => (x as { id: string }).id === v) as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
                          if (inv) updateMedicine(i, 'inventoryId', v), updateMedicine(i, 'medicineId', inv.medicineId), updateMedicine(i, 'medicineName', inv.medicineName || ''), updateMedicine(i, 'unitPrice', parseFloat(inv.sellingPrice) || 0);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((inv) => (
                            <SelectItem key={(inv as { id: string }).id} value={(inv as { id: string }).id}>
                              {(inv as { medicineName: string }).medicineName} ({(inv as { currentStock: number }).currentStock} left)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-16"
                        value={m.quantity}
                        onChange={(e) => updateMedicine(i, 'quantity', Number(e.target.value) || 1)}
                        min={1}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        value={m.unitPrice}
                        onChange={(e) => updateMedicine(i, 'unitPrice', Number(e.target.value) || 0)}
                      />
                      <span className="text-sm">= ₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeMedicine(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span>Consultation Fee</span>
                <span>₹{form.consultationFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medicines</span>
                <span>₹{medicineTotal}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={loading || !targetClinicId} className="w-full">
              {loading ? 'Saving...' : 'Create Consultation & Bill'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Consultations</CardTitle>
            <CardDescription>Recent consultations for this clinic</CardDescription>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <p className="text-muted-foreground">No consultations today</p>
            ) : (
              <div className="space-y-2">
                {consultations.map((c) => (
                  <div key={c.id as string} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="font-medium">{c.patientName as string}</p>
                      <p className="text-sm text-muted-foreground">{c.consultationDate as string} · ₹{c.totalAmount as string}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handlePrint(c.id as string)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCons && (
        <div className="hidden print:block fixed inset-0 bg-white p-8" id="print-prescription">
          <h2 className="text-xl font-bold">Prescription</h2>
          <p>Patient: {selectedCons.patientName}</p>
          <p>Date: {selectedCons.consultationDate}</p>
          <p>Doctor: {selectedCons.doctorName}</p>
          <p>Clinic: {selectedCons.clinicName}</p>
          <hr className="my-4" />
          <p><strong>Diagnosis:</strong> {selectedCons.diagnosis as string || '-'}</p>
          <p><strong>Symptoms:</strong> {selectedCons.symptoms as string || '-'}</p>
          <p><strong>Medicines:</strong></p>
          <ul>
            {((selectedCons.medicines as { medicineName: string; quantity: number; unitPrice: number }[]) || []).map((m, i) => (
              <li key={i}>{m.medicineName} - {m.quantity} x ₹{m.unitPrice}</li>
            ))}
          </ul>
          <p className="mt-4"><strong>Total: ₹{selectedCons.totalAmount}</strong></p>
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Trash2, Search, Loader2, Printer } from 'lucide-react';

type ConsultationRow = Record<string, unknown> & {
  id: string;
  patientName: string;
  consultationDate: string;
  consultationTime?: string | null;
  totalAmount: string;
};

const PharmacyPage = () => {
  const user = getAuthUser();
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [clinicId, setClinicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [medicineOpen, setMedicineOpen] = useState<number | null>(null);
  const [form, setForm] = useState({
    consultationId: '',
    consultationLabel: '',
    consultationFee: 0,
    treatments: [] as { name: string; price: number }[],
    items: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
  });
  const { toast } = useToast();

  const targetClinicId = user?.role === 'admin' ? clinicId : user?.clinicId;

  useEffect(() => {
    api.clinics.list().then((data) => {
      setClinics(data);
      if (user?.role === 'admin' && data.length > 0) setClinicId((c) => c || data[0].id);
    }).catch(() => setClinics([]));
  }, [user?.role]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (user?.role === 'admin' && targetClinicId) params.clinicId = targetClinicId;
    api.consultations.list(params)
      .then((data) => setConsultations(data as ConsultationRow[]))
      .catch(() => setConsultations([]));
  }, [targetClinicId, user?.role]);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
    } else setInventory([]);
  }, [targetClinicId]);

  const invList = inventory as { id: string; medicineId: string; medicineName: string; sellingPrice: string; currentStock?: number }[];

  const addItem = () => {
    const inv = invList[0];
    if (!inv) return;
    setForm((f) => ({
      ...f,
      items: [...f.items, {
        inventoryId: inv.id,
        medicineId: inv.medicineId,
        medicineName: inv.medicineName || 'Medicine',
        quantity: 1,
        unitPrice: parseFloat(inv.sellingPrice) || 0,
      }],
    }));
    setMedicineOpen(form.items.length);
  };

  const selectMedicine = (idx: number, inv: typeof invList[0]) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((m, i) =>
        i === idx
          ? {
              ...m,
              inventoryId: inv.id,
              medicineId: inv.medicineId,
              medicineName: inv.medicineName || 'Medicine',
              unitPrice: parseFloat(inv.sellingPrice) || 0,
            }
          : m
      ),
    }));
    setMedicineOpen(null);
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const addTreatment = () => {
    setForm((f) => ({ ...f, treatments: [...f.treatments, { name: '', price: 0 }] }));
  };

  const removeTreatment = (idx: number) => {
    setForm((f) => ({ ...f, treatments: f.treatments.filter((_, i) => i !== idx) }));
  };

  const updateTreatment = (idx: number, field: 'name' | 'price', value: string | number) => {
    setForm((f) => ({
      ...f,
      treatments: f.treatments.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    }));
  };

  const updateItem = (idx: number, field: string, value: number | string) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const medicineTotal = form.items.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const treatmentTotal = form.treatments.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const isConsultationBill = form.consultationId && form.consultationId !== '__direct__';
  const grandTotal = medicineTotal + (isConsultationBill ? form.consultationFee + treatmentTotal : 0);

  const handleSubmit = async () => {
    if (form.items.length === 0 && !isConsultationBill) {
      toast({ title: 'Missing data', description: 'Add at least one medicine for direct sale', variant: 'destructive' });
      return;
    }
    if (isConsultationBill && form.items.length === 0 && form.consultationFee === 0 && form.treatments.every((t) => !t.name || t.price === 0)) {
      toast({ title: 'Missing data', description: 'Add consultation fee, treatments, or medicines', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (isConsultationBill) {
        const treatmentsFiltered = form.treatments.filter((t) => t.name.trim());
        await api.consultations.addPharmacy(form.consultationId, {
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
          })),
          consultationFee: form.consultationFee || undefined,
          treatments: treatmentsFiltered.length > 0 ? treatmentsFiltered.map((t) => ({ name: t.name, price: Number(t.price) || 0 })) : undefined,
        });
        toast({ title: 'Bill saved', description: `Total: ₹${grandTotal}` });
        setForm((f) => ({ ...f, items: [], consultationFee: 0, treatments: [] }));
        const consId = form.consultationId;
        api.consultations.get(consId).then((data) => {
          try { localStorage.setItem(`print_pharmacy_${consId}`, JSON.stringify(data)); } catch {}
          window.open(`${window.location.origin}/print/pharmacy/${consId}`, '_blank', 'noopener,noreferrer');
        }).catch(() => {
          window.open(`${window.location.origin}/print/pharmacy/${consId}`, '_blank', 'noopener,noreferrer');
        });
      } else {
        if (!targetClinicId) {
          toast({ title: 'Missing clinic', variant: 'destructive' });
          return;
        }
        await api.directSales.create({
          clinicId: targetClinicId,
          saleDate: new Date().toISOString().slice(0, 10),
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
          })),
        });
        toast({ title: 'Direct sale recorded', description: `Total: ₹${medicineTotal}` });
        setForm((f) => ({ ...f, items: [] }));
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    api.consultations.get(id).then((data) => {
      try { localStorage.setItem(`print_pharmacy_${id}`, JSON.stringify(data)); } catch {}
      window.open(`${window.location.origin}/print/pharmacy/${id}`, '_blank', 'noopener,noreferrer');
    }).catch(() => toast({ title: 'Failed to load', variant: 'destructive' }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
        <PageHeader
          title="Pharmacy"
          description="Consultation bill (fee + treatments + medicines) or direct sale (medicines only). Deducts from stock."
        />
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

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden max-w-2xl">
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Pharmacy — Bill or Direct Sale</CardTitle>
            <CardDescription className="mt-0.5">
              Select consultation (add fee, treatments, medicines) or Direct sale (medicines only). Deducts from inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0 space-y-4">
            <div>
              <Label>Bill type</Label>
              <Popover open={consultationOpen} onOpenChange={setConsultationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal mt-1.5">
                    <span className="truncate">{form.consultationLabel || 'Select consultation or Direct sale'}</span>
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by patient name..." />
                    <CommandList>
                      <CommandEmpty>No consultation found</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none direct sale"
                          onSelect={() => {
                            setForm((f) => ({
                              ...f,
                              consultationId: '__direct__',
                              consultationLabel: 'Direct sale (no consultation)',
                              consultationFee: 0,
                              treatments: [],
                            }));
                            setConsultationOpen(false);
                          }}
                        >
                          <span className="font-medium text-muted-foreground">Direct sale (no consultation)</span>
                        </CommandItem>
                        {consultations.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.patientName} ${c.consultationDate}`}
                            onSelect={() => {
                              setForm((f) => ({
                                ...f,
                                consultationId: c.id,
                                consultationLabel: `${c.patientName} — ${c.consultationDate}`,
                                consultationFee: 0,
                              }));
                              setConsultationOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{c.patientName}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.consultationTime ? `${c.consultationDate} ${c.consultationTime}` : c.consultationDate}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {isConsultationBill && (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <Label>Consultation fee (₹)</Label>
                  <p className="text-xs text-muted-foreground mt-1">Enter amount manually (first visit / follow-up may differ)</p>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={form.consultationFee || ''}
                    onChange={(e) => setForm((f) => ({ ...f, consultationFee: Number(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Treatments (name + price)</Label>
                    <Button size="sm" variant="outline" onClick={addTreatment}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {form.treatments.length > 0 && (
                    <div className="space-y-2">
                      {form.treatments.map((t, i) => (
                        <div key={i} className="flex gap-2 items-center rounded border p-2">
                          <Input
                            placeholder="Treatment name"
                            value={t.name}
                            onChange={(e) => updateTreatment(i, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            className="w-24"
                            value={t.price || ''}
                            onChange={(e) => updateTreatment(i, 'price', Number(e.target.value) || 0)}
                          />
                          <Button size="icon" variant="ghost" onClick={() => removeTreatment(i)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">Medicine | Qty | Price</Label>
                <Button size="sm" variant="outline" onClick={addItem} disabled={!targetClinicId || invList.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {form.items.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.items.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2 flex-wrap">
                      <Popover open={medicineOpen === i} onOpenChange={(o) => setMedicineOpen(o ? i : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="flex-1 min-w-[140px] justify-between font-normal">
                            {m.medicineName || 'Select medicine'}
                            <span className="text-muted-foreground ml-1">
                              ({(() => {
                                const inv = invList.find((x) => x.id === m.inventoryId);
                                const stock = inv?.currentStock ?? 0;
                                const inBill = form.items.filter((x) => x.inventoryId === m.inventoryId).reduce((s, x) => s + x.quantity, 0);
                                return `${Math.max(0, stock - inBill)} left`;
                              })()})
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search medicine..." />
                            <CommandList>
                              <CommandEmpty>No medicine found</CommandEmpty>
                              <CommandGroup>
                                {invList
                                  .filter((inv) => (inv.currentStock ?? 0) > 0)
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
                      <Input type="number" className="w-14" value={m.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)} min={1} />
                      <Input type="number" className="w-20" value={m.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)} />
                      <span className="text-sm font-medium">₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                {isConsultationBill && form.consultationFee > 0 && <p>Consultation: ₹{form.consultationFee}</p>}
                {isConsultationBill && treatmentTotal > 0 && <p>Treatments: ₹{treatmentTotal}</p>}
                {form.items.length > 0 && <p>Medicines: ₹{medicineTotal}</p>}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Total: ₹{grandTotal}</span>
                <div className="flex gap-2">
                {isConsultationBill && form.consultationId && (
                  <Button size="sm" variant="outline" onClick={() => handlePrint(form.consultationId)}>
                    <Printer className="h-4 w-4 mr-1" /> Print Bill
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !form.consultationLabel ||
                    (form.consultationId === '__direct__' && form.items.length === 0) ||
                    (isConsultationBill && form.items.length === 0 && !form.consultationFee && !form.treatments.some((t) => t.name.trim() && (Number(t.price) || 0) > 0))
                  }
                >
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save & Print'}
                </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyPage;

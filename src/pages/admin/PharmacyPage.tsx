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
import { COUNTRY_CODES } from '@/lib/country-codes';
import { getAuthUser } from '@/pages/Login';
import { Plus, Trash2, Search, Loader2, Printer, MessageCircle } from 'lucide-react';

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
  const [discountPopoverOpen, setDiscountPopoverOpen] = useState(false);
  const [discountDraft, setDiscountDraft] = useState<{ type: 'percent' | 'fixed'; value: number }>({ type: 'percent', value: 10 });
  const [pharmacyRecords, setPharmacyRecords] = useState<Record<string, unknown>[]>([]);
  const [recordsDateFrom, setRecordsDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [recordsDateTo, setRecordsDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'] as const;
  const [form, setForm] = useState({
    consultationId: '__direct__',
    consultationLabel: 'Direct sale (no consultation)',
    consultationFee: 0,
    treatments: [] as { name: string; price: number }[],
    items: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
    medicineDiscount: null as { type: 'percent' | 'fixed'; value: number } | null,
    paymentMode: 'Cash' as (typeof PAYMENT_MODES)[number],
    customerName: '',
    customerMobile: '',
    customerCountryCode: '91',
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

  useEffect(() => {
    if (targetClinicId) {
      api.directSales.list({ clinicId: targetClinicId, from: recordsDateFrom, to: recordsDateTo })
        .then(setPharmacyRecords)
        .catch(() => setPharmacyRecords([]));
    } else setPharmacyRecords([]);
  }, [targetClinicId, recordsDateFrom, recordsDateTo]);

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

  const medicineSubtotal = form.items.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const discountAmount = form.medicineDiscount
    ? form.medicineDiscount.type === 'percent'
      ? Math.round((medicineSubtotal * form.medicineDiscount.value) / 100)
      : Math.min(form.medicineDiscount.value, medicineSubtotal)
    : 0;
  const medicineTotal = Math.max(0, medicineSubtotal - discountAmount);
  const treatmentTotal = form.treatments.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const isConsultationBill = form.consultationId && form.consultationId !== '__direct__';
  const grandTotal = medicineTotal + (isConsultationBill ? form.consultationFee + treatmentTotal : 0);

  const handleSubmit = async () => {
    if (form.items.length === 0 && !isConsultationBill) {
      toast({ title: 'Missing data', description: 'Add at least one medicine for direct sale', variant: 'destructive' });
      return;
    }
    if (!isConsultationBill && !form.customerName.trim()) {
      toast({ title: 'Customer name required', description: 'Enter customer name for direct sale', variant: 'destructive' });
      return;
    }
    if (!isConsultationBill && form.customerMobile.trim()) {
      const mobile = form.customerMobile.replace(/\D/g, '');
      if (mobile.length !== 10) {
        toast({ title: 'Invalid mobile', description: 'Mobile must be exactly 10 digits', variant: 'destructive' });
        return;
      }
    }
    if (isConsultationBill && form.items.length === 0 && form.consultationFee === 0 && form.treatments.every((t) => !t.name || t.price === 0)) {
      toast({ title: 'Missing data', description: 'Add consultation fee, treatments, or medicines', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (isConsultationBill) {
        const treatmentsFiltered = form.treatments.filter((t) => t.name.trim());
        const treatmentsWithDiscount = [...treatmentsFiltered];
        if (discountAmount > 0) {
          treatmentsWithDiscount.push({ name: 'Medicine Discount', price: -discountAmount });
        }
        await api.consultations.addPharmacy(form.consultationId, {
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
          })),
          consultationFee: form.consultationFee || undefined,
          treatments: treatmentsWithDiscount.length > 0 ? treatmentsWithDiscount.map((t) => ({ name: t.name, price: Number(t.price) || 0 })) : undefined,
        });
        toast({ title: 'Invoice saved', description: `Total: ₹${grandTotal}` });
        setForm((f) => ({ ...f, items: [], consultationFee: 0, treatments: [], medicineDiscount: null }));
        const consId = form.consultationId;
        const paymentMode = form.paymentMode;
        api.consultations.get(consId).then((data) => {
          try { localStorage.setItem(`print_pharmacy_${consId}`, JSON.stringify({ ...data, paymentMode })); } catch {}
          window.open(`${window.location.origin}/print/pharmacy/${consId}`, '_blank', 'noopener,noreferrer');
          const rawMobile = (data.patientMobile as string) || '';
          const digits = rawMobile.replace(/\D/g, '');
          if (digits.length >= 10) {
            const meds = ((data.medicines as Array<{ medicineName: string; quantity: number; unitPrice: string; total?: string }>) || []).map((m) => ({
              medicineName: m.medicineName,
              quantity: m.quantity,
              unitPrice: String(m.unitPrice ?? 0),
              total: String(m.total ?? m.quantity * parseFloat(m.unitPrice || '0')),
            }));
            const trts = ((data.treatments as Array<{ name: string; price: string }>) || []).map((t) => ({ name: t.name, price: String(t.price ?? 0) }));
            const medTotal = String(data.medicineTotal ?? meds.reduce((s, m) => s + parseFloat(m.total || '0'), 0));
            const trtTotal = String(data.treatmentTotal ?? trts.reduce((s, t) => s + parseFloat(t.price || '0'), 0));
            const grand = parseFloat(medTotal) + parseFloat(trtTotal);
            api.whatsapp.sendBill({
              mobile: digits,
              countryCode: digits.length === 10 ? '91' : undefined,
              billData: {
                customerName: String(data.patientName || ''),
                medicines: meds,
                consultationFee: parseFloat(String(data.consultationFee ?? 0)),
                treatments: trts,
                medicineTotal: medTotal,
                treatmentTotal: trtTotal,
                grandTotal: grand.toFixed(2),
                paymentMode,
                date: [data.consultationDate, data.consultationTime].filter(Boolean).join(' ') || undefined,
                clinicName: data.clinicName as string,
              },
            }).then((r) => {
              if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
              else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
            }).catch(() => {});
          }
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
          customerName: form.customerName.trim(),
          customerMobile: form.customerMobile.trim() || undefined,
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
          })),
          ...(discountAmount > 0 && { discount: discountAmount }),
        });
        toast({ title: 'Direct sale recorded', description: `Total: ₹${medicineTotal}` });
        const customerMobile = form.customerMobile.trim();
        const customerCountryCode = form.customerCountryCode;
        const customerName = form.customerName.trim() || 'Direct Sale';
        const saleDate = new Date().toISOString().slice(0, 10);
        const clinicName = clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic';
        const billMedicines = form.items.map((m) => ({
          medicineName: m.medicineName,
          quantity: m.quantity,
          unitPrice: String(m.unitPrice),
          total: String(m.quantity * m.unitPrice),
        }));
        const billTreatments = discountAmount > 0 ? [{ name: 'Medicine Discount', price: String(-discountAmount) }] : [];
        const billMedicineTotal = String(medicineSubtotal);
        const billTreatmentTotal = discountAmount > 0 ? String(-discountAmount) : '0';
        const billGrandTotal = String(medicineTotal);
        setForm((f) => ({ ...f, items: [], medicineDiscount: null, customerName: '', customerMobile: '', customerCountryCode: '91' }));
        const printId = `direct_${Date.now()}`;
        const printData = {
          patientName: customerName,
          patientMobile: customerMobile ? `${COUNTRY_CODES.find((c) => c.code === customerCountryCode)?.dial || '+91'} ${customerMobile}` : undefined,
          consultationDate: saleDate,
          consultationTime: null,
          clinicName,
          doctorName: 'Dr.V.VAITHEESHWARI BAMS.',
          paymentMode: form.paymentMode,
          medicines: billMedicines,
          treatments: billTreatments,
          consultationFee: 0,
          medicineTotal: billMedicineTotal,
          treatmentTotal: billTreatmentTotal,
        };
        try { localStorage.setItem(`print_pharmacy_${printId}`, JSON.stringify(printData)); } catch {}
        window.open(`${window.location.origin}/print/pharmacy/${printId}`, '_blank', 'noopener,noreferrer');
        if (customerMobile) {
          api.whatsapp.sendBill({
            mobile: customerMobile,
            countryCode: customerCountryCode || '91',
            billData: {
              customerName,
              medicines: billMedicines,
              treatments: billTreatments,
              medicineTotal: billMedicineTotal,
              treatmentTotal: billTreatmentTotal,
              grandTotal: billGrandTotal,
              paymentMode: form.paymentMode,
              date: saleDate,
              clinicName,
            },
          }).then((r) => {
            if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
            else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
          }).catch(() => {});
        }
        api.directSales.list({ clinicId: targetClinicId, from: recordsDateFrom, to: recordsDateTo }).then(setPharmacyRecords).catch(() => {});
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    api.consultations.get(id).then((data) => {
      try { localStorage.setItem(`print_pharmacy_${id}`, JSON.stringify({ ...data, paymentMode: form.paymentMode })); } catch {}
      window.open(`${window.location.origin}/print/pharmacy/${id}`, '_blank', 'noopener,noreferrer');
    }).catch(() => toast({ title: 'Failed to load', variant: 'destructive' }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
        <PageHeader
          title="Pharmacy"
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

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-4 lg:flex-row">
        <Card className="flex flex-col min-h-0 overflow-hidden flex-1 max-w-2xl">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Pharmacy</CardTitle>
            <CardDescription>Create invoice for consultation bill or direct medicine sale. Deducts from stock.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 pt-0 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invoice type</Label>
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
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Consultation details</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Consultation fee (₹)</Label>
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
                    <Label className="text-sm">Treatments (name + price)</Label>
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
              </div>
            )}

            {!isConsultationBill && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Customer details</p>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Customer name <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder="Enter customer name"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Mobile number</Label>
                    <div className="flex gap-2">
                      <Select value={form.customerCountryCode} onValueChange={(v) => setForm((f) => ({ ...f, customerCountryCode: v }))}>
                        <SelectTrigger className="h-9 w-24 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.dial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={form.customerMobile}
                        onChange={(e) => setForm((f) => ({ ...f, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        placeholder="10 digits"
                        className="h-9 flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Medicines</p>
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
                      <span className="text-sm text-muted-foreground w-12">₹{m.unitPrice}</span>
                      <span className="text-sm font-medium">₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {form.items.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Medicine discount</Label>
                  {form.medicineDiscount ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {form.medicineDiscount.type === 'percent'
                          ? `${form.medicineDiscount.value}% = ₹${discountAmount}`
                          : `₹${form.medicineDiscount.value} off`}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setForm((f) => ({ ...f, medicineDiscount: null }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Popover open={discountPopoverOpen} onOpenChange={setDiscountPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" /> Add Discount
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Add medicine discount</p>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              min={0}
                              placeholder={discountDraft.type === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                              value={discountDraft.value || ''}
                              onChange={(e) => setDiscountDraft((d) => ({ ...d, value: Number(e.target.value) || 0 }))}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-12 shrink-0 font-medium"
                              onClick={() => setDiscountDraft((d) => ({ ...d, type: d.type === 'percent' ? 'fixed' : 'percent', value: d.type === 'percent' ? 0 : 10 }))}
                              title={discountDraft.type === 'percent' ? 'Switch to fixed amount' : 'Switch to percentage'}
                            >
                              {discountDraft.type === 'percent' ? '%' : '₹'}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setForm((f) => ({ ...f, medicineDiscount: { ...discountDraft } }));
                              setDiscountPopoverOpen(false);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-40 space-y-2">
                  <Label className="text-sm">Payment mode</Label>
                  <Select value={form.paymentMode} onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v as typeof form.paymentMode }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                {isConsultationBill && form.consultationFee > 0 && <p>Consultation: ₹{form.consultationFee}</p>}
                {isConsultationBill && treatmentTotal > 0 && <p>Treatments: ₹{treatmentTotal}</p>}
                {form.items.length > 0 && (
                  <p>
                    Medicines: ₹{medicineSubtotal}
                    {discountAmount > 0 && <span className="text-green-600"> − ₹{discountAmount} = ₹{medicineTotal}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Total: ₹{grandTotal}</span>
                <div className="flex gap-2">
                {isConsultationBill && form.consultationId && (
                  <Button size="sm" variant="outline" onClick={() => handlePrint(form.consultationId)}>
                    <Printer className="h-4 w-4 mr-1" /> Print Invoice
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !form.consultationLabel ||
                    (form.consultationId === '__direct__' && (form.items.length === 0 || !form.customerName.trim())) ||
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

        <Card className="flex flex-col min-h-0 overflow-hidden flex-1 min-w-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Pharmacy Records</CardTitle>
            <CardDescription>Past direct sales and bills</CardDescription>
            <div className="flex gap-2 mt-2">
              <Input
                type="date"
                value={recordsDateFrom}
                onChange={(e) => setRecordsDateFrom(e.target.value)}
                className="w-36"
              />
              <span className="self-center text-muted-foreground">to</span>
              <Input
                type="date"
                value={recordsDateTo}
                onChange={(e) => setRecordsDateTo(e.target.value)}
                className="w-36"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto">
            {!targetClinicId ? (
              <p className="text-sm text-muted-foreground">Select clinic to view records</p>
            ) : pharmacyRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records for this period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const bySale = new Map<string, { saleDate: string; createdAt: string; items: typeof pharmacyRecords; total: number; customerName?: string; customerMobile?: string }>();
                  for (const r of pharmacyRecords as { saleDate: string; createdAt: string; medicineName: string; quantity: number; unitPrice: string; total: string; customerName?: string; customerMobile?: string }[]) {
                    const total = parseFloat(r.total || '0');
                    const key = `${r.saleDate}_${(r.createdAt || '').slice(0, 16)}`;
                    const existing = bySale.get(key);
                    if (existing) {
                      existing.items.push(r);
                      existing.total += total;
                    } else {
                      bySale.set(key, { saleDate: r.saleDate, createdAt: r.createdAt || '', items: [r], total, customerName: r.customerName, customerMobile: r.customerMobile });
                    }
                  }
                  return Array.from(bySale.values())
                    .sort((a, b) => (b.saleDate + b.createdAt).localeCompare(a.saleDate + a.createdAt))
                    .map((sale, i) => (
                      <div key={i} className="rounded border p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">
                            <span>{sale.saleDate}</span>
                            <span className="ml-2 text-muted-foreground font-normal">₹{sale.total.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-1">
                            {sale.customerMobile && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 shrink-0"
                                onClick={() => {
                                  const discountItems = sale.items.filter((it: Record<string, unknown>) => (it.quantity as number) === 0 && parseFloat((it.total as string) || '0') < 0);
                                  const medicineItems = sale.items.filter((it: Record<string, unknown>) => (it.quantity as number) > 0 || parseFloat((it.total as string) || '0') >= 0);
                                  const discountAmount = discountItems.reduce((s: number, it: Record<string, unknown>) => s + parseFloat((it.total as string) || '0'), 0);
                                  const medicineSubtotal = medicineItems.reduce((s: number, it: Record<string, unknown>) => s + parseFloat((it.total as string) || '0'), 0);
                                  const grandTotal = medicineSubtotal + (discountAmount < 0 ? discountAmount : 0);
                                  const rawMobile = String(sale.customerMobile || '').replace(/\D/g, '');
                                  api.whatsapp.sendBill({
                                    mobile: rawMobile,
                                    countryCode: rawMobile.length === 10 ? '91' : undefined,
                                    billData: {
                                      customerName: sale.customerName || 'Direct Sale',
                                      medicines: medicineItems.map((m: Record<string, unknown>) => ({
                                        medicineName: String(m.medicineName ?? ''),
                                        quantity: Number(m.quantity ?? 0),
                                        unitPrice: String(m.unitPrice ?? 0),
                                        total: String(m.total ?? 0),
                                      })),
                                      treatments: discountAmount < 0 ? [{ name: 'Medicine Discount', price: String(discountAmount) }] : [],
                                      medicineTotal: String(medicineSubtotal),
                                      treatmentTotal: discountAmount < 0 ? String(discountAmount) : '0',
                                      grandTotal: grandTotal.toFixed(2),
                                      paymentMode: form.paymentMode,
                                      date: sale.saleDate,
                                      clinicName: clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic',
                                    },
                                  }).then((r) => {
                                    if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
                                    else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
                                  }).catch(() => {});
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 shrink-0"
                              onClick={() => {
                                const discountItems = sale.items.filter((it: Record<string, unknown>) => (it.quantity as number) === 0 && parseFloat((it.total as string) || '0') < 0);
                                const medicineItems = sale.items.filter((it: Record<string, unknown>) => (it.quantity as number) > 0 || parseFloat((it.total as string) || '0') >= 0);
                                const discountAmount = discountItems.reduce((s: number, it: Record<string, unknown>) => s + parseFloat((it.total as string) || '0'), 0);
                                const medicineSubtotal = medicineItems.reduce((s: number, it: Record<string, unknown>) => s + parseFloat((it.total as string) || '0'), 0);
                                const printId = `record_${sale.saleDate}_${i}_${Date.now()}`;
                                const clinicName = clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic';
                                const printData = {
                                  patientName: sale.customerName || 'Direct Sale',
                                  patientMobile: sale.customerMobile,
                                  consultationDate: sale.saleDate,
                                  consultationTime: null,
                                  clinicName,
                                  doctorName: 'Dr.V.VAITHEESHWARI B.A.M.S.,',
                                  paymentMode: form.paymentMode,
                                  medicines: medicineItems.map((m: Record<string, unknown>) => ({
                                    medicineName: m.medicineName,
                                    quantity: m.quantity,
                                    unitPrice: m.unitPrice,
                                    total: m.total,
                                  })),
                                  treatments: discountAmount < 0 ? [{ name: 'Medicine Discount', price: String(discountAmount) }] : [],
                                  consultationFee: 0,
                                  medicineTotal: String(medicineSubtotal),
                                  treatmentTotal: discountAmount < 0 ? String(discountAmount) : '0',
                                };
                                try { localStorage.setItem(`print_pharmacy_${printId}`, JSON.stringify(printData)); } catch {}
                                window.open(`${window.location.origin}/print/pharmacy/${printId}`, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" /> Print
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-muted-foreground">
                          {sale.items.slice(0, 8).map((item: Record<string, unknown>, j: number) => {
                            const qty = item.quantity as number;
                            const tot = parseFloat((item.total as string) || '0');
                            const label = qty === 0 && tot < 0 ? 'Discount' : `${item.medicineName as string} × ${qty}`;
                            return (
                              <div key={j} className="flex justify-between text-xs">
                                <span>{label}</span>
                                <span>₹{item.total as string}</span>
                              </div>
                            );
                          })}
                          {sale.items.length > 8 && <p className="text-xs">+{sale.items.length - 8} more</p>}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyPage;

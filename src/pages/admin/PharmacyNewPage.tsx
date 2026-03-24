import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Plus, Trash2, Search, Loader2, Printer, ArrowLeft, ListPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
/** One row per patient (master list); pharmacy bill attaches to latest consultation at this clinic. */
type PatientMasterRow = {
  id: string;
  name: string;
  mobile: string;
  lastConsultationId: string | null;
  lastConsultationDate: string | null;
  consultationCount?: number;
};

type StockBatchRow = {
  id: string;
  inventoryId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string | null;
  expiryDate: string | null;
  remainingQuantity: number;
  effectiveSellingPrice: string;
};

type FifoPick = {
  kind: 'fifo';
  inventoryId: string;
  medicineId: string;
  medicineName: string;
  currentStock: number;
  sellingPrice: string;
};

type BatchPick = StockBatchRow & { kind: 'batch' };

type SaleLine = {
  inventoryBatchId: string | null;
  inventoryId: string;
  medicineId: string;
  medicineName: string;
  batchLabel: string;
  expiryDate: string | null;
  quantity: number;
  unitPrice: number;
};

/** Hide browser steppers on numeric inputs (consultation fee, treatment price, etc.) */
const INPUT_NO_SPIN =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const PharmacyNewPage = () => {
  const navigate = useNavigate();
  const { effectiveClinicId, isAdmin, clinics } = useAdminClinic();
  const [patientMaster, setPatientMaster] = useState<PatientMasterRow[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [medicineOpen, setMedicineOpen] = useState<number | null>(null);
  const [discountPopoverOpen, setDiscountPopoverOpen] = useState(false);
  const [discountDraft, setDiscountDraft] = useState<{ type: 'percent' | 'fixed'; value: number }>({ type: 'percent', value: 10 });
  const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'] as const;
  const [form, setForm] = useState({
    /** direct = walk-in; consultation = bill linked to a visit; own = internal / clinic use */
    saleMode: 'direct' as 'direct' | 'consultation' | 'own',
    consultationId: null as string | null,
    consultationLabel: 'Direct sale',
    consultationFee: 0,
    treatments: [] as { name: string; price: number }[],
    items: [] as SaleLine[],
    medicineDiscount: null as { type: 'percent' | 'fixed'; value: number } | null,
    paymentMode: 'Cash' as (typeof PAYMENT_MODES)[number] | 'Split',
    paymentSplit: [] as { mode: (typeof PAYMENT_MODES)[number]; amount: number }[],
    customerName: '',
    customerMobile: '',
    customerCountryCode: '91',
  });
  const { toast } = useToast();

  const targetClinicId = effectiveClinicId ?? undefined;

  useEffect(() => {
    api.patients
      .list(targetClinicId ? { clinicId: targetClinicId } : {})
      .then((data) => setPatientMaster((data as PatientMasterRow[]) || []))
      .catch(() => setPatientMaster([]));
  }, [targetClinicId]);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
      api.inventory.batches(targetClinicId).then(setStockBatches).catch(() => setStockBatches([]));
    } else {
      setInventory([]);
      setStockBatches([]);
    }
  }, [targetClinicId]);

  const invList = inventory as { id: string; medicineId: string; medicineName: string; sellingPrice: string; currentStock?: number }[];

  const linePickOptions = useMemo((): (BatchPick | FifoPick)[] => {
    const batchByMed = new Set(stockBatches.map((b) => b.medicineId));
    const fifoRows: FifoPick[] = invList
      .filter((inv) => !batchByMed.has(inv.medicineId) && (inv.currentStock ?? 0) > 0)
      .map((inv) => ({
        kind: 'fifo' as const,
        inventoryId: inv.id,
        medicineId: inv.medicineId,
        medicineName: inv.medicineName || 'Medicine',
        currentStock: inv.currentStock ?? 0,
        sellingPrice: inv.sellingPrice,
      }));
    const batchRows: BatchPick[] = stockBatches.map((b) => ({ kind: 'batch' as const, ...b }));
    return [...batchRows, ...fifoRows];
  }, [stockBatches, invList]);

  const remainingForPick = (pick: BatchPick | FifoPick, lineIdx: number) => {
    if (pick.kind === 'batch') {
      const used = form.items.reduce((s, l, i) => {
        if (i === lineIdx) return s;
        return s + (l.inventoryBatchId === pick.id ? l.quantity : 0);
      }, 0);
      return Math.max(0, pick.remainingQuantity - used);
    }
    const used = form.items.reduce((s, l, i) => {
      if (i === lineIdx) return s;
      return s + (l.inventoryBatchId === null && l.medicineId === pick.medicineId ? l.quantity : 0);
    }, 0);
    return Math.max(0, pick.currentStock - used);
  };

  const pickToLine = (pick: BatchPick | FifoPick): SaleLine => {
    if (pick.kind === 'batch') {
      return {
        inventoryBatchId: pick.id,
        inventoryId: pick.inventoryId,
        medicineId: pick.medicineId,
        medicineName: pick.medicineName,
        batchLabel: pick.batchNumber || '—',
        expiryDate: pick.expiryDate,
        quantity: 1,
        unitPrice: parseFloat(pick.effectiveSellingPrice) || 0,
      };
    }
    return {
      inventoryBatchId: null,
      inventoryId: pick.inventoryId,
      medicineId: pick.medicineId,
      medicineName: pick.medicineName,
      batchLabel: 'Stock (FIFO)',
      expiryDate: null,
      quantity: 1,
      unitPrice: parseFloat(pick.sellingPrice) || 0,
    };
  };

  const addItem = () => {
    const first = linePickOptions.find((p) => remainingForPick(p, -1) > 0);
    if (!first) return;
    setForm((f) => ({
      ...f,
      items: [...f.items, pickToLine(first)],
    }));
    setMedicineOpen(form.items.length);
  };

  /** Insert a new line after `afterIdx` (Add before Delete — primary action). */
  const insertItemAfter = (afterIdx: number) => {
    const first = linePickOptions.find((p) => remainingForPick(p, -1) > 0);
    if (!first) return;
    const line = pickToLine(first);
    setForm((f) => ({
      ...f,
      items: [...f.items.slice(0, afterIdx + 1), line, ...f.items.slice(afterIdx + 1)],
    }));
    setMedicineOpen(afterIdx + 1);
  };

  const formatExpiry = (d: string | null) => {
    if (!d) return '—';
    const s = String(d).slice(0, 10);
    return s;
  };

  const selectLinePick = (idx: number, pick: BatchPick | FifoPick) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((m, i) => (i === idx ? pickToLine(pick) : m)),
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

  const getPaymentDisplay = () => {
    if (form.paymentMode === 'Split' && form.paymentSplit.length > 0) {
      const splitSum = form.paymentSplit.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(splitSum - grandTotal) < 0.01) {
        return form.paymentSplit.map((p) => `${p.mode}: ₹${p.amount.toFixed(2)}`).join(', ');
      }
    }
    return form.paymentMode;
  };

  const medicineSubtotal = form.items.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const discountAmount = form.medicineDiscount
    ? form.medicineDiscount.type === 'percent'
      ? Math.round((medicineSubtotal * form.medicineDiscount.value) / 100)
      : Math.min(form.medicineDiscount.value, medicineSubtotal)
    : 0;
  const medicineTotal = Math.max(0, medicineSubtotal - discountAmount);
  const treatmentTotal = form.treatments.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const isConsultationBill = form.saleMode === 'consultation' && !!form.consultationId;
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
    if (form.paymentMode === 'Split') {
      const splitSum = form.paymentSplit.reduce((s, p) => s + p.amount, 0);
      if (form.paymentSplit.length === 0 || Math.abs(splitSum - grandTotal) > 0.01) {
        toast({ title: 'Invalid split', description: `Split amounts must total ₹${grandTotal.toFixed(2)}. Current sum: ₹${splitSum.toFixed(2)}`, variant: 'destructive' });
        return;
      }
    }
    setLoading(true);
    try {
      if (isConsultationBill) {
        const treatmentsFiltered = form.treatments.filter((t) => t.name.trim());
        const treatmentsWithDiscount = [...treatmentsFiltered];
        if (discountAmount > 0) {
          treatmentsWithDiscount.push({ name: 'Medicine Discount', price: -discountAmount });
        }
        await api.consultations.addPharmacy(form.consultationId!, {
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            inventoryBatchId: m.inventoryBatchId,
          })),
          consultationFee: form.consultationFee || undefined,
          treatments: treatmentsWithDiscount.length > 0 ? treatmentsWithDiscount.map((t) => ({ name: t.name, price: Number(t.price) || 0 })) : undefined,
        });
        toast({ title: 'Invoice saved', description: `Total: ₹${grandTotal}` });
        setForm((f) => ({
          ...f,
          items: [],
          consultationFee: 0,
          treatments: [],
          medicineDiscount: null,
          saleMode: 'direct',
          consultationId: null,
          consultationLabel: 'Direct sale',
        }));
        const consId = form.consultationId!;
        const paymentMode = getPaymentDisplay();
        api.consultations.get(consId).then((data) => {
          const now = new Date();
          const billDate = now.toISOString().slice(0, 10);
          const billTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          try {
            localStorage.setItem(
              `print_pharmacy_${consId}`,
              JSON.stringify({
                ...data,
                paymentMode,
                billDate,
                billTime,
                billDateLabel: `${billDate} ${billTime}`,
              }),
            );
          } catch {}
          window.open(`${window.location.origin}/print/pharmacy/${consId}`, '_blank', 'noopener,noreferrer');
          navigate('/admin/pharmacy');
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
                date: `${billDate} ${billTime}`,
                clinicName: data.clinicName as string,
              },
            }).then((r) => {
              if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
              else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
            }).catch(() => {});
          }
        }).catch(() => {
          window.open(`${window.location.origin}/print/pharmacy/${consId}`, '_blank', 'noopener,noreferrer');
          navigate('/admin/pharmacy');
        });
      } else {
        if (!targetClinicId) {
          toast({ title: 'Missing clinic', variant: 'destructive' });
          return;
        }
        await api.directSales.create({
          clinicId: targetClinicId,
          saleDate: new Date().toISOString().slice(0, 10),
          salePurpose: form.saleMode === 'own' ? 'own' : 'direct',
          customerName: form.saleMode === 'own' ? (form.customerName.trim() || 'Internal use') : form.customerName.trim(),
          customerMobile: form.customerMobile.trim() || undefined,
          items: form.items.map((m) => ({
            inventoryId: m.inventoryId,
            medicineId: m.medicineId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            inventoryBatchId: m.inventoryBatchId,
          })),
          ...(discountAmount > 0 && { discount: discountAmount }),
        });
        toast({ title: 'Direct sale recorded', description: `Total: ₹${medicineTotal}` });
        const customerMobile = form.customerMobile.trim();
        const customerCountryCode = form.customerCountryCode;
        const customerName =
          form.saleMode === 'own'
            ? form.customerName.trim() || 'Internal use'
            : form.customerName.trim() || 'Direct Sale';
        const skipWhatsApp = form.saleMode === 'own';
        const saleDate = new Date().toISOString().slice(0, 10);
        const clinicName = clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic';
        const billMedicines = form.items.map((m) => ({
          medicineName: m.medicineName,
          quantity: m.quantity,
          unitPrice: String(m.unitPrice),
          total: String(m.quantity * m.unitPrice),
          batchNumber: m.batchLabel !== 'Stock (FIFO)' ? m.batchLabel : undefined,
          expiryDate: m.expiryDate ? String(m.expiryDate).slice(0, 10) : undefined,
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
          paymentMode: getPaymentDisplay(),
          medicines: billMedicines,
          treatments: billTreatments,
          consultationFee: 0,
          medicineTotal: billMedicineTotal,
          treatmentTotal: billTreatmentTotal,
        };
        try { localStorage.setItem(`print_pharmacy_${printId}`, JSON.stringify(printData)); } catch {}
        window.open(`${window.location.origin}/print/pharmacy/${printId}`, '_blank', 'noopener,noreferrer');
        if (customerMobile && !skipWhatsApp) {
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
              paymentMode: getPaymentDisplay(),
              date: saleDate,
              clinicName,
            },
          }).then((r) => {
            if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
            else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
          }).catch(() => {});
        }
        navigate('/admin/pharmacy');
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getPickForLine = (line: SaleLine): BatchPick | FifoPick | null => {
    if (line.inventoryBatchId) {
      const b = stockBatches.find((x) => x.id === line.inventoryBatchId);
      if (b) return { kind: 'batch', ...b };
    }
    const inv = invList.find((x) => x.id === line.inventoryId);
    if (inv) {
      return {
        kind: 'fifo',
        inventoryId: inv.id,
        medicineId: inv.medicineId,
        medicineName: line.medicineName,
        currentStock: inv.currentStock ?? 0,
        sellingPrice: inv.sellingPrice,
      };
    }
    return null;
  };

  const hasAnyStockLine = linePickOptions.some((p) => remainingForPick(p, -1) > 0);

  const handlePrint = (id: string, options?: { paymentMode?: string }) => {
    api.consultations.get(id).then((data) => {
      const now = new Date();
      const billDate = now.toISOString().slice(0, 10);
      const billTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      try {
        const paymentMode = options?.paymentMode ?? '—';
        localStorage.setItem(
          `print_pharmacy_${id}`,
          JSON.stringify({
            ...data,
            paymentMode,
            billDate,
            billTime,
            billDateLabel: `${billDate} ${billTime}`,
          }),
        );
      } catch {}
      window.open(`${window.location.origin}/print/pharmacy/${id}`, '_blank', 'noopener,noreferrer');
    }).catch(() => toast({ title: 'Failed to load', variant: 'destructive' }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="mb-3 shrink-0">
        <PageHeader
          title="New pharmacy invoice"
          description="Direct sale, own use, or consultation billing. Pick a stock batch per line when available."
        >
          <Button variant="outline" asChild>
            <Link to="/admin/pharmacy" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to pharmacy
            </Link>
          </Button>
        </PageHeader>
      </div>

      <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden px-3 sm:px-4 lg:px-6">
        <Card className="flex flex-col min-h-0 overflow-hidden h-full w-full max-w-full border-border/80 shadow-sm">
          <CardHeader className="pb-3 shrink-0 px-4 sm:px-6 pt-4">
            <CardTitle className="text-lg">Invoice</CardTitle>
            <CardDescription>Medicines use batch + expiry when stock was purchased with batch details; otherwise FIFO from aggregate stock.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 pt-0 space-y-5">
            <div
              className={
                !isConsultationBill
                  ? 'grid gap-6 xl:grid-cols-2 xl:items-start'
                  : 'space-y-0'
              }
            >
              <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Invoice type</Label>
              <Popover open={consultationOpen} onOpenChange={setConsultationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal mt-1.5">
                    <span className="truncate">{form.consultationLabel || 'Select invoice type'}</span>
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search patient or type…" />
                    <CommandList>
                      <CommandEmpty>No match</CommandEmpty>
                      <CommandGroup heading="Sale type">
                        <CommandItem
                          value="direct sale walk in"
                          onSelect={() => {
                            setForm((f) => ({
                              ...f,
                              saleMode: 'direct' as const,
                              consultationId: null,
                              consultationLabel: 'Direct sale',
                              consultationFee: 0,
                              treatments: [],
                            }));
                            setConsultationOpen(false);
                          }}
                        >
                          <span className="font-medium">Direct sale</span>
                          <span className="ml-2 text-xs text-muted-foreground">Walk-in medicines</span>
                        </CommandItem>
                        <CommandItem
                          value="own use internal"
                          onSelect={() => {
                            setForm((f) => ({
                              ...f,
                              saleMode: 'own' as const,
                              consultationId: null,
                              consultationLabel: 'Own use (internal)',
                              consultationFee: 0,
                              treatments: [],
                            }));
                            setConsultationOpen(false);
                          }}
                        >
                          <span className="font-medium">Own use</span>
                          <span className="ml-2 text-xs text-muted-foreground">Clinic / internal</span>
                        </CommandItem>
                      </CommandGroup>
                      <CommandGroup heading="Patient (latest visit at this clinic)">
                        {patientMaster.map((p) => {
                          const visit = p.lastConsultationDate ? String(p.lastConsultationDate).slice(0, 10) : null;
                          return (
                            <CommandItem
                              key={p.id}
                              value={`${p.name} ${p.mobile} ${p.id}`}
                              onSelect={() => {
                                if (!p.lastConsultationId) {
                                  toast({
                                    title: 'No consultation visit',
                                    description:
                                      'This patient has no consultation at this clinic yet. Register a visit under Consultations first.',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                const datePart = visit ? ` · ${visit}` : '';
                                setForm((f) => ({
                                  ...f,
                                  saleMode: 'consultation' as const,
                                  consultationId: p.lastConsultationId,
                                  consultationLabel: `${p.name}${datePart} (latest visit)`,
                                  consultationFee: 0,
                                }));
                                setConsultationOpen(false);
                              }}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{p.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {p.mobile}
                                  {p.lastConsultationId
                                    ? visit
                                      ? ` · Latest visit ${visit}`
                                      : ' · Latest visit'
                                    : ' · No visit at this clinic'}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              </div>

            {!isConsultationBill && (
              <div className="space-y-4 pt-4 border-t xl:pt-0 xl:border-t-0 xl:border-l xl:border-border/80 xl:pl-6 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {form.saleMode === 'own' ? 'Internal (optional label)' : 'Customer details'}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {form.saleMode === 'own' ? 'Label' : 'Customer name'}{' '}
                      {form.saleMode === 'direct' && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder={form.saleMode === 'own' ? 'e.g. Staff / camp / purpose' : 'Name'}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Mobile number {form.saleMode === 'own' && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
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
            </div>

            <div className="pt-4 border-t min-w-0 space-y-5">
              {isConsultationBill && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Consultation billing</p>
                  <div>
                    <Label className="text-sm">Consultation fee (₹)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Enter amount manually (first visit / follow-up may differ)</p>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className={`mt-1.5 ${INPUT_NO_SPIN}`}
                      value={form.consultationFee || ''}
                      onChange={(e) => setForm((f) => ({ ...f, consultationFee: Number(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div>
                        <Label className="text-sm">Treatments & therapies (optional)</Label>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          Manual charges (e.g. therapy). Add medicines from stock in the table below.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={addTreatment}>
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
                              inputMode="decimal"
                              placeholder="Price"
                              className={`w-24 ${INPUT_NO_SPIN}`}
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

              <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Medicines</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isConsultationBill
                      ? 'Stock from inventory — batch, expiry, qty and price. Use + on a row to add another line below.'
                      : 'Choose batch, qty and price. Use + on a row to add another line below it.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="default"
                  className="w-full sm:w-auto shrink-0 gap-2 font-medium shadow-sm"
                  onClick={addItem}
                  disabled={!targetClinicId || !hasAnyStockLine}
                >
                  <ListPlus className="h-4 w-4" />
                  Add row
                </Button>
              </div>

              <div className="rounded-lg border border-border/80 bg-muted/20 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60 border-b">
                      <TableHead className="w-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                      <TableHead className="min-w-[200px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Medicine & batch
                      </TableHead>
                      <TableHead className="w-[100px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expiry</TableHead>
                      <TableHead className="w-16 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Avail</TableHead>
                      <TableHead className="w-20 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qty</TableHead>
                      <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Price (₹)</TableHead>
                      <TableHead className="w-28 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount (₹)</TableHead>
                      <TableHead className="w-[88px] text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                          No medicine lines yet. Click <span className="font-medium text-foreground">Add row</span> to start.
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.items.map((m, i) => {
                        const pick = getPickForLine(m);
                        const left = pick ? remainingForPick(pick, i) : 0;
                        const batchDisplay =
                          m.batchLabel && m.batchLabel !== 'Stock (FIFO)' ? m.batchLabel : m.inventoryBatchId ? m.batchLabel : 'FIFO';
                        return (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="text-center text-sm text-muted-foreground tabular-nums align-middle">
                              {i + 1}
                            </TableCell>
                            <TableCell className="align-top py-2 min-w-[200px]">
                              <Popover open={medicineOpen === i} onOpenChange={(o) => setMedicineOpen(o ? i : null)}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full max-w-full justify-between font-normal text-left h-auto min-h-[44px] py-2 px-3"
                                  >
                                    <span className="min-w-0 truncate text-left">
                                      <span className="font-medium block truncate">{m.medicineName || 'Select medicine / batch'}</span>
                                      <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                                        {batchDisplay}
                                      </span>
                                    </span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search medicine or batch…" />
                                    <CommandList>
                                      <CommandEmpty>No stock line</CommandEmpty>
                                      <CommandGroup>
                                        {linePickOptions
                                          .filter((p) => remainingForPick(p, i) > 0)
                                          .map((p) => (
                                            <CommandItem
                                              key={p.kind === 'batch' ? p.id : `fifo-${p.medicineId}`}
                                              value={p.kind === 'batch' ? `${p.medicineName} ${p.batchNumber ?? ''}` : p.medicineName}
                                              onSelect={() => selectLinePick(i, p)}
                                            >
                                              <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">{p.kind === 'batch' ? p.medicineName : `${p.medicineName} (FIFO)`}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  {p.kind === 'batch'
                                                    ? `${p.batchNumber ?? '—'} · Exp ${p.expiryDate ? String(p.expiryDate).slice(0, 10) : '—'} · ${remainingForPick(p, i)} left · ₹${parseFloat(p.effectiveSellingPrice).toFixed(2)}`
                                                    : `${remainingForPick(p, i)} left · ₹${parseFloat(p.sellingPrice).toFixed(2)}`}
                                                </span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground tabular-nums align-middle whitespace-nowrap">
                              {formatExpiry(m.expiryDate)}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums align-middle">{left}</TableCell>
                            <TableCell className="text-right align-middle">
                              <Input
                                type="number"
                                inputMode="numeric"
                                className={`h-9 w-full min-w-[4rem] text-right tabular-nums ${INPUT_NO_SPIN}`}
                                value={m.quantity}
                                onChange={(e) => {
                                  const max = left + m.quantity;
                                  const q = Math.max(1, Math.min(Number(e.target.value) || 1, max));
                                  updateItem(i, 'quantity', q);
                                }}
                                min={1}
                              />
                            </TableCell>
                            <TableCell className="text-right align-middle">
                              <Input
                                type="number"
                                inputMode="decimal"
                                className={`h-9 w-full min-w-[4.5rem] text-right tabular-nums ${INPUT_NO_SPIN}`}
                                step={0.01}
                                value={m.unitPrice}
                                onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums align-middle">
                              ₹{(m.quantity * m.unitPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 shrink-0 text-primary border-primary/30 hover:bg-primary/10"
                                  title="Add row below"
                                  aria-label="Add row below"
                                  onClick={() => insertItemAfter(i)}
                                  disabled={!targetClinicId || !hasAnyStockLine}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                  title="Remove line"
                                  aria-label="Remove line"
                                  onClick={() => removeItem(i)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              </div>
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
                              inputMode="decimal"
                              min={0}
                              placeholder={discountDraft.type === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                              value={discountDraft.value || ''}
                              onChange={(e) => setDiscountDraft((d) => ({ ...d, value: Number(e.target.value) || 0 }))}
                              className={`flex-1 ${INPUT_NO_SPIN}`}
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
              <div className="space-y-2">
                <Label className="text-sm">Payment mode</Label>
                <Select value={form.paymentMode} onValueChange={(v) => setForm((f) => ({
                  ...f,
                  paymentMode: v as typeof form.paymentMode,
                  paymentSplit: v === 'Split' ? (f.paymentSplit.length > 0 ? f.paymentSplit : [{ mode: 'Cash' as const, amount: 0 }, { mode: 'UPI' as const, amount: 0 }]) : [],
                }))}>
                  <SelectTrigger className="h-9 w-full max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                    <SelectItem value="Split">Split payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.paymentMode === 'Split' && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Split payment — Total: ₹{grandTotal.toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setForm((f) => ({ ...f, paymentSplit: [...f.paymentSplit, { mode: 'Cash' as const, amount: 0 }] }))}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add row
                    </Button>
                  </div>

                  {form.paymentSplit.length > 0 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {form.paymentSplit.map((p, i) => {
                          const sumSoFar = form.paymentSplit.slice(0, i).reduce((s, x) => s + x.amount, 0);
                          const isLast = i === form.paymentSplit.length - 1;
                          const remaining = Math.round((grandTotal - sumSoFar) * 100) / 100;
                          const canAutoFill = isLast && form.paymentSplit.length > 1 && p.amount === 0 && remaining > 0;
                          return (
                            <div key={i} className="flex gap-2 items-center">
                              <Select
                                value={p.mode}
                                onValueChange={(v) => setForm((f) => ({
                                  ...f,
                                  paymentSplit: f.paymentSplit.map((s, j) => j === i ? { ...s, mode: v as typeof s.mode } : s),
                                }))}
                              >
                                <SelectTrigger className="h-9 w-[130px] shrink-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAYMENT_MODES.map((mode) => (
                                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                className="h-9 w-24"
                                placeholder="0"
                                min={0}
                                step={0.01}
                                value={p.amount || ''}
                                onChange={(e) => setForm((f) => ({
                                  ...f,
                                  paymentSplit: f.paymentSplit.map((s, j) => j === i ? { ...s, amount: Number(e.target.value) || 0 } : s),
                                }))}
                              />
                              {canAutoFill && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-9 px-2 text-xs shrink-0"
                                  onClick={() => setForm((f) => ({
                                    ...f,
                                    paymentSplit: f.paymentSplit.map((s, j) => j === i ? { ...s, amount: remaining } : s),
                                  }))}
                                >
                                  Use remaining ₹{remaining}
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setForm((f) => ({ ...f, paymentSplit: f.paymentSplit.filter((_, j) => j !== i) }))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      <div className={`flex items-center justify-between text-sm py-1.5 px-2 rounded ${Math.abs(form.paymentSplit.reduce((s, p) => s + p.amount, 0) - grandTotal) < 0.01 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                        <span>Total entered: ₹{form.paymentSplit.reduce((s, p) => s + p.amount, 0).toFixed(2)}</span>
                        {Math.abs(form.paymentSplit.reduce((s, p) => s + p.amount, 0) - grandTotal) < 0.01
                          ? <span className="font-medium">✓ Balanced</span>
                          : <span>Need ₹{(grandTotal - form.paymentSplit.reduce((s, p) => s + p.amount, 0)).toFixed(2)} more</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  <Button size="sm" variant="outline" onClick={() => handlePrint(form.consultationId, { paymentMode: getPaymentDisplay() })}>
                    <Printer className="h-4 w-4 mr-1" /> Print Invoice
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    (form.saleMode === 'direct' && (form.items.length === 0 || !form.customerName.trim())) ||
                    (form.saleMode === 'own' && form.items.length === 0) ||
                    (isConsultationBill &&
                      form.items.length === 0 &&
                      !form.consultationFee &&
                      !form.treatments.some((t) => t.name.trim() && (Number(t.price) || 0) > 0))
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

export default PharmacyNewPage;

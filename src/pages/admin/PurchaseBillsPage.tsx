import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { QuickAddMedicineDialog } from './QuickAddMedicineDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  api,
  type PaymentStatus,
  type PaymentMode,
  type PurchaseBillRow,
  type NewPurchaseBillItem,
  type MedicineRow,
} from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { formatIsoDateToApp, localDateYmd } from '@/lib/datetime';
import { toAmount as money, formatINR as inr } from '@/lib/money';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import {
  Plus,
  Loader2,
  AlertTriangle,
  IndianRupee,
  Trash2,
  Wallet,
  ReceiptText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'];

const STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
};

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{status}</StatusBadge>;
}

function isOverdue(bill: Pick<PurchaseBillRow, 'dueDate' | 'paymentStatus'>) {
  return (
    bill.paymentStatus !== 'paid' &&
    !!bill.dueDate &&
    bill.dueDate < localDateYmd()
  );
}

type DraftItem = NewPurchaseBillItem & { _key: number; purchaseUnit?: string };

/** Per-line unit picker: loads the medicine's units and lets you buy in box/strip/base. */
function LineUnitSelect({
  medicineId,
  value,
  onChange,
}: {
  medicineId: string;
  value: string | undefined;
  onChange: (unitCode: string, factorToBase: number) => void;
}) {
  const { data } = useQuery({
    queryKey: ['medicine-units', medicineId],
    queryFn: () => api.medicines.getUnits(medicineId),
    enabled: !!medicineId,
  });
  const units = data?.units ?? [];
  if (!medicineId) return <div className="h-9" />;
  if (units.length <= 1) {
    return <div className="flex h-9 items-center text-xs text-muted-foreground">{data?.baseUnit || 'unit'}</div>;
  }
  const current = value || units.find((u) => u.isBase)?.unitCode || units[0].unitCode;
  return (
    <Select
      value={current}
      onValueChange={(v) => {
        const u = units.find((x) => x.unitCode === v);
        onChange(v, u?.factorToBase ?? 1);
      }}
    >
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>
        {units.map((u) => (
          <SelectItem key={u.unitCode} value={u.unitCode}>
            {u.unitCode}{u.factorToBase > 1 ? ` (×${u.factorToBase})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const PurchaseBillsPage = () => {
  const perms = usePermissions();
  const canView = perms.has('purchase_bills.view');
  const canCreate = perms.has('purchase_bills.create');
  const canPay = perms.has('purchase_bills.edit');
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clinics, effectiveClinicId, isAdmin } = useAdminClinic();

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  // ─ New bill dialog ─
  const [showNew, setShowNew] = useState(false);
  const [newClinicId, setNewClinicId] = useState<string>('');
  const [newSupplierId, setNewSupplierId] = useState<string>('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(localDateYmd());
  const [dueDate, setDueDate] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ _key: 1, medicineId: '', quantity: 1, unitPurchasePrice: '' }]);

  // ─ Quick-add medicine (inline master creation) ─
  const [quickAdd, setQuickAdd] = useState<{ lineKey: number; name: string } | null>(null);

  // ─ Payment + detail dialogs ─
  const [payBillId, setPayBillId] = useState<string | null>(null);
  const [detailBillId, setDetailBillId] = useState<string | null>(null);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['purchase-bills', supplierFilter, statusFilter],
    queryFn: () =>
      api.purchaseBills.list({
        supplierId: supplierFilter !== 'all' ? supplierFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.list(),
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => api.medicines.list(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['purchase-bills'] });
    qc.invalidateQueries({ queryKey: ['payables-summary'] });
    qc.invalidateQueries({ queryKey: ['inventory'] });
  };

  const medicineOptions = useMemo<ComboboxOption[]>(
    () =>
      medicines
        .filter((m) => m.status !== 'archived')
        .map((m) => ({
          value: m.id,
          label: m.name,
          hint: m.baseUnit || m.uom || undefined,
          keywords: [m.category, m.baseUnit, m.uom].filter(Boolean).join(' '),
        })),
    [medicines],
  );

  const supplierOptions = useMemo<ComboboxOption[]>(
    () => suppliers.map((s) => ({ value: s.id, label: s.name, keywords: s.contact ?? '' })),
    [suppliers],
  );

  const draftSubtotal = useMemo(
    () => items.reduce((acc, it) => acc + money(it.unitPurchasePrice) * (it.quantity || 0), 0),
    [items],
  );
  const draftTotal = draftSubtotal + money(taxAmount);

  const resolveClinicId = () => newClinicId || effectiveClinicId || '';

  const openNew = () => {
    setNewClinicId(effectiveClinicId || (clinics.length === 1 ? clinics[0].id : ''));
    setNewSupplierId('');
    setBillNumber('');
    setBillDate(localDateYmd());
    setDueDate('');
    setTaxAmount('');
    setNotes('');
    setItems([{ _key: 1, medicineId: '', quantity: 1, unitPurchasePrice: '' }]);
    setShowNew(true);
  };

  const addItemRow = () =>
    setItems((prev) => [...prev, { _key: (prev[prev.length - 1]?._key ?? 0) + 1, medicineId: '', quantity: 1, unitPurchasePrice: '' }]);
  const removeItemRow = (key: number) => setItems((prev) => (prev.length > 1 ? prev.filter((i) => i._key !== key) : prev));
  const updateItem = (key: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, ...patch } : i)));

  const createMutation = useMutation({
    mutationFn: async () => {
      const clinicId = resolveClinicId();
      if (!clinicId) throw new Error('Select a clinic for this bill');
      if (!newSupplierId) throw new Error('Select a supplier / agency');
      const clean = items
        .filter((i) => i.medicineId && i.quantity > 0)
        .map((i) => ({
          medicineId: i.medicineId,
          quantity: Number(i.quantity),
          purchaseUnit: i.purchaseUnit || undefined,
          unitPurchasePrice: money(i.unitPurchasePrice),
          sellingPrice: i.sellingPrice ? money(i.sellingPrice) : undefined,
          batchNumber: i.batchNumber || undefined,
          expiryDate: i.expiryDate || undefined,
        }));
      if (clean.length === 0) throw new Error('Add at least one medicine line with quantity');
      return api.purchaseBills.create({
        clinicId,
        supplierId: newSupplierId,
        billNumber: billNumber.trim() || undefined,
        billDate,
        dueDate: dueDate || undefined,
        taxAmount: taxAmount ? money(taxAmount) : undefined,
        notes: notes.trim() || undefined,
        items: clean,
      });
    },
    onSuccess: () => {
      toast({ title: 'Purchase bill recorded', description: 'Stock added and payable created.' });
      setShowNew(false);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  if (!canView) return <Navigate to="/admin/dashboard" replace />;

  const totalOutstanding = bills.reduce(
    (acc, b) => acc + (b.paymentStatus !== 'paid' ? money(b.totalAmount) - money(b.amountPaid) : 0),
    0,
  );
  const overdueCount = bills.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases & Bills"
        description="Record medicine purchases per agency, track what's paid, and stay on top of payment deadlines."
      >
        {canCreate && (
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            New bill
          </Button>
        )}
      </PageHeader>

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="rounded-lg bg-primary/10 p-2 text-primary"><Wallet className="h-5 w-5" /></span>
            <div>
              <div className="text-xs text-muted-foreground">Outstanding (this view)</div>
              <div className="text-lg font-semibold">{inr(totalOutstanding)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="rounded-lg bg-red-100 p-2 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <div className="text-xs text-muted-foreground">Overdue bills</div>
              <div className="text-lg font-semibold">{overdueCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600"><ReceiptText className="h-5 w-5" /></span>
            <div>
              <div className="text-xs text-muted-foreground">Bills shown</div>
              <div className="text-lg font-semibold">{bills.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>Agency bills</CardTitle>
              <CardDescription>Newest first. Overdue rows are flagged.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="w-[200px]">
                <Combobox
                  options={[{ value: 'all', label: 'All agencies' }, ...supplierOptions]}
                  value={supplierFilter}
                  onChange={setSupplierFilter}
                  placeholder="All agencies"
                  searchPlaceholder="Search agencies…"
                  triggerClassName="h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | 'all')}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Bill / Agency</th>
                  <th className="px-4 py-3">Bill date</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && bills.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b"><td colSpan={8} className="px-4 py-3"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
                  ))
                ) : bills.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No purchase bills yet. Click “New bill” to record one.</td></tr>
                ) : (
                  bills.map((b) => {
                    const pending = money(b.totalAmount) - money(b.amountPaid);
                    const overdue = isOverdue(b);
                    return (
                      <tr key={b.id} className={cn('border-b transition-colors hover:bg-muted/20', overdue && 'bg-red-50/50')}>
                        <td className="px-4 py-3 align-top">
                          <button className="text-left font-medium hover:underline" onClick={() => setDetailBillId(b.id)}>
                            {b.billNumber || '(no bill no.)'}
                          </button>
                          <div className="text-xs text-muted-foreground">{b.supplierName ?? '—'}{isAdmin && b.clinicName ? ` · ${b.clinicName}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">{formatIsoDateToApp(b.billDate)}</td>
                        <td className="px-4 py-3 align-top">
                          {b.dueDate ? (
                            <span className={cn(overdue && 'font-medium text-red-600')}>
                              {formatIsoDateToApp(b.dueDate)}{overdue ? ' · overdue' : ''}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right align-top">{inr(b.totalAmount)}</td>
                        <td className="px-4 py-3 text-right align-top">{inr(b.amountPaid)}</td>
                        <td className="px-4 py-3 text-right align-top font-medium">{inr(pending)}</td>
                        <td className="px-4 py-3 align-top"><PaymentStatusBadge status={b.paymentStatus} /></td>
                        <td className="px-4 py-3 text-right align-top">
                          {b.paymentStatus !== 'paid' && canPay && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setPayBillId(b.id)}>
                              <IndianRupee className="mr-1 h-3.5 w-3.5" />Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New bill dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New purchase bill</DialogTitle>
            <DialogDescription>Each line adds stock to inventory and creates a payable for this agency.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {(isAdmin && !effectiveClinicId) && (
                <div className="sm:col-span-2">
                  <Label>Clinic <span className="text-destructive">*</span></Label>
                  <Select value={newClinicId} onValueChange={setNewClinicId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select clinic" /></SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Agency / Supplier <span className="text-destructive">*</span></Label>
                <div className="mt-1">
                  <Combobox
                    options={supplierOptions}
                    value={newSupplierId}
                    onChange={setNewSupplierId}
                    placeholder="Select agency"
                    searchPlaceholder="Search agencies…"
                  />
                </div>
              </div>
              <div>
                <Label>Bill / Invoice number</Label>
                <Input className="mt-1" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="e.g. INV-1024" />
              </div>
              <div>
                <Label>Bill date <span className="text-destructive">*</span></Label>
                <Input type="date" className="mt-1" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
              </div>
              <div>
                <Label>Payment due date</Label>
                <Input type="date" className="mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Used for due-soon / overdue reminders.</p>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2.5">
                <div>
                  <span className="text-sm font-medium">Medicines purchased</span>
                  <p className="text-xs text-muted-foreground">Search to pick a medicine, or type a new name to add it.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addItemRow}><Plus className="mr-1 h-3.5 w-3.5" />Add line</Button>
              </div>

              {/* Column headers (desktop) */}
              <div className="hidden gap-2 border-b bg-muted/20 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_72px_110px_96px_96px_40px]">
                <span>Medicine</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Cost/unit</span>
                <span>Sell/base</span>
                <span className="sr-only">Remove</span>
              </div>

              <div className="divide-y">
                {items.map((it, idx) => {
                  const lineCost = money(it.unitPurchasePrice) * (it.quantity || 0);
                  return (
                    <div key={it._key} className="grid items-start gap-2 px-3 py-3 sm:grid-cols-[1fr_72px_110px_96px_96px_40px]">
                      <div>
                        <Label className="text-xs sm:hidden">Medicine</Label>
                        <div className="mt-1 sm:mt-0">
                          <Combobox
                            options={medicineOptions}
                            value={it.medicineId || undefined}
                            onChange={(v) => updateItem(it._key, { medicineId: v, purchaseUnit: undefined })}
                            placeholder="Select medicine"
                            searchPlaceholder="Search medicines…"
                            onCreate={(q) => setQuickAdd({ lineKey: it._key, name: q })}
                            createLabel={(q) => `Add new medicine “${q}”`}
                          />
                        </div>
                        {lineCost > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">Line total: {inr(lineCost)}</div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs sm:hidden">Qty</Label>
                        <Input type="number" min={1} className="mt-1 h-9 sm:mt-0" value={it.quantity}
                          onChange={(e) => updateItem(it._key, { quantity: parseInt(e.target.value, 10) || 0 })} />
                      </div>
                      <div>
                        <Label className="text-xs sm:hidden">Unit</Label>
                        <div className="mt-1 sm:mt-0">
                          <LineUnitSelect
                            medicineId={it.medicineId}
                            value={it.purchaseUnit}
                            onChange={(unitCode) => updateItem(it._key, { purchaseUnit: unitCode })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:hidden">Cost/unit</Label>
                        <Input type="number" min={0} step="0.01" className="mt-1 h-9 sm:mt-0" value={String(it.unitPurchasePrice)}
                          onChange={(e) => updateItem(it._key, { unitPurchasePrice: e.target.value })} placeholder="0.00" />
                      </div>
                      <div>
                        <Label className="text-xs sm:hidden">Sell/base</Label>
                        <Input type="number" min={0} step="0.01" className="mt-1 h-9 sm:mt-0" value={String(it.sellingPrice ?? '')}
                          onChange={(e) => updateItem(it._key, { sellingPrice: e.target.value })} placeholder="0.00" />
                      </div>
                      <div className="flex justify-end sm:block">
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeItemRow(it._key)} disabled={items.length === 1} title={`Remove line ${idx + 1}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Batch no. + expiry — span the full line width, below the main grid. */}
                      <div className="grid gap-2 sm:col-span-full sm:grid-cols-[1fr_1fr_auto]">
                        <div>
                          <Label className="text-xs text-muted-foreground">Batch / lot no.</Label>
                          <Input
                            className="mt-1 h-9"
                            value={it.batchNumber ?? ''}
                            onChange={(e) => updateItem(it._key, { batchNumber: e.target.value })}
                            placeholder="Manufacturer batch (optional)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Expiry date</Label>
                          <Input
                            type="date"
                            className="mt-1 h-9"
                            value={it.expiryDate ?? ''}
                            onChange={(e) => updateItem(it._key, { expiryDate: e.target.value })}
                          />
                        </div>
                        <div className="hidden sm:block sm:w-10" aria-hidden />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tax / GST amount</Label>
                <Input type="number" min={0} step="0.01" className="mt-1" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex flex-col justify-end rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(draftSubtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{inr(taxAmount)}</span></div>
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{inr(draftTotal)}</span></div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickAddMedicineDialog
        open={!!quickAdd}
        initialName={quickAdd?.name}
        onClose={() => setQuickAdd(null)}
        onCreated={(med: MedicineRow) => {
          qc.invalidateQueries({ queryKey: ['medicines'] });
          if (quickAdd) updateItem(quickAdd.lineKey, { medicineId: med.id, purchaseUnit: undefined });
          setQuickAdd(null);
        }}
      />

      <RecordPaymentDialog billId={payBillId} onClose={() => setPayBillId(null)} onPaid={invalidate} />
      <BillDetailDialog billId={detailBillId} canPay={canPay} onClose={() => setDetailBillId(null)} onPay={(id) => { setDetailBillId(null); setPayBillId(id); }} />
    </div>
  );
};

// ─── Record payment dialog ─────────────────────────────────────────────────────
function RecordPaymentDialog({ billId, onClose, onPaid }: { billId: string | null; onClose: () => void; onPaid: () => void }) {
  const { toast } = useToast();
  const { data: bill } = useQuery({
    queryKey: ['purchase-bill', billId],
    queryFn: () => api.purchaseBills.get(billId!),
    enabled: !!billId,
  });
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(localDateYmd());
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [reference, setReference] = useState('');

  React.useEffect(() => {
    if (bill) {
      const pending = money(bill.totalAmount) - money(bill.amountPaid);
      setAmount(pending > 0 ? pending.toFixed(2) : '');
      setPaymentDate(localDateYmd());
      setMode('CASH');
      setReference('');
    }
  }, [bill]);

  const mutation = useMutation({
    mutationFn: () =>
      api.purchaseBills.recordPayment(billId!, {
        amount: money(amount),
        paymentDate,
        paymentMode: mode,
        reference: reference.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Payment recorded' });
      onPaid();
      onClose();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const pending = bill ? money(bill.totalAmount) - money(bill.amountPaid) : 0;

  return (
    <Dialog open={!!billId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {bill ? <>Bill {bill.billNumber || '(no number)'} · {bill.supplierName} · pending <strong>{inr(pending)}</strong></> : 'Loading…'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Amount <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} step="0.01" className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" className="mt-1" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Reference</Label>
            <Input className="mt-1" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn / cheque no. (optional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || money(amount) <= 0}>
            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bill detail dialog ────────────────────────────────────────────────────────
function BillDetailDialog({ billId, canPay, onClose, onPay }: { billId: string | null; canPay: boolean; onClose: () => void; onPay: (id: string) => void }) {
  const { data: bill, isLoading } = useQuery({
    queryKey: ['purchase-bill', billId],
    queryFn: () => api.purchaseBills.get(billId!),
    enabled: !!billId,
  });
  const pending = bill ? money(bill.totalAmount) - money(bill.amountPaid) : 0;

  return (
    <Dialog open={!!billId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bill?.billNumber || 'Purchase bill'}</DialogTitle>
          <DialogDescription>{bill ? `${bill.supplierName} · ${formatIsoDateToApp(bill.billDate)}` : 'Loading…'}</DialogDescription>
        </DialogHeader>
        {isLoading || !bill ? (
          <div className="h-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="space-y-4 py-1 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-4">
              <div><div className="text-xs text-muted-foreground">Total</div><div className="font-semibold">{inr(bill.totalAmount)}</div></div>
              <div><div className="text-xs text-muted-foreground">Paid</div><div className="font-semibold">{inr(bill.amountPaid)}</div></div>
              <div><div className="text-xs text-muted-foreground">Pending</div><div className="font-semibold">{inr(pending)}</div></div>
              <div><div className="text-xs text-muted-foreground">Status</div><PaymentStatusBadge status={bill.paymentStatus} /></div>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</div>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Medicine</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Cost</th><th className="px-3 py-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {bill.items.map((it) => (
                      <tr key={it.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{it.medicineName ?? '—'}{it.batchNumber ? <span className="text-xs text-muted-foreground"> · {it.batchNumber}</span> : ''}</td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">{inr(it.unitPurchasePrice)}</td>
                        <td className="px-3 py-2 text-right">{inr(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</div>
              {bill.payments.length === 0 ? (
                <p className="text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="space-y-1">
                  {bill.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded border px-3 py-1.5">
                      <span>{formatIsoDateToApp(p.paymentDate)} · {p.paymentMode ?? '—'}{p.reference ? ` · ${p.reference}` : ''}</span>
                      <span className="font-medium">{inr(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {bill.notes && <p className="rounded bg-muted/30 p-2 text-muted-foreground">{bill.notes}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {bill && bill.paymentStatus !== 'paid' && canPay && (
            <Button onClick={() => onPay(bill.id)}><IndianRupee className="mr-1 h-4 w-4" />Record payment</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseBillsPage;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Plus, Trash2, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  RECORDS_PAGE_SIZE,
  buildPharmacyGroups,
  type PharmacyLedgerLine,
} from '@/pages/admin/pharmacyLedgerUtils';

const DirectSalesPage = () => {
  const { effectiveClinicId } = useAdminClinic();
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [sales, setSales] = useState<Record<string, unknown>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    customerName: '',
    customerMobile: '',
    items: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
  });
  const [listFrom, setListFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [listTo, setListTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [listSearch, setListSearch] = useState('');
  const [listSaleKind, setListSaleKind] = useState<'all' | 'direct' | 'consultation'>('all');
  const [listPage, setListPage] = useState(1);
  const [historySource, setHistorySource] = useState<'unified' | 'direct_fallback' | null>(null);
  const { toast } = useToast();

  const targetClinicId = effectiveClinicId ?? undefined;

  const fetchSalesHistory = useCallback(async () => {
    if (!targetClinicId) return;
    setHistoryLoading(true);
    try {
      const data = await api.pharmacyRecords.list({ clinicId: targetClinicId, from: listFrom, to: listTo });
      setSales(data as Record<string, unknown>[]);
      setHistorySource('unified');
    } catch {
      try {
        const data = await api.directSales.list({ clinicId: targetClinicId, from: listFrom, to: listTo });
        setSales(data as Record<string, unknown>[]);
        setHistorySource('direct_fallback');
      } catch {
        setSales([]);
        setHistorySource(null);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [targetClinicId, listFrom, listTo]);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
    } else {
      setInventory([]);
    }
  }, [targetClinicId]);

  useEffect(() => {
    if (!targetClinicId) {
      setSales([]);
      setHistorySource(null);
      setHistoryLoading(false);
      return;
    }
    void fetchSalesHistory();
  }, [targetClinicId, fetchSalesHistory]);

  useEffect(() => {
    setListPage(1);
  }, [listFrom, listTo, listSearch, listSaleKind, targetClinicId]);

  const ledgerLines = useMemo((): PharmacyLedgerLine[] => {
    return (sales as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      saleKind: ((r.saleKind as PharmacyLedgerLine['saleKind']) || 'direct') as PharmacyLedgerLine['saleKind'],
      consultationId: (r.consultationId as string | null) ?? null,
      medicineName: String(r.medicineName ?? ''),
      quantity: Number(r.quantity ?? 0),
      unitPrice: String(r.unitPrice ?? '0'),
      total: String(r.total ?? '0'),
      saleDate: String(r.saleDate ?? '').slice(0, 10),
      createdAt:
        typeof r.createdAt === 'string'
          ? r.createdAt
          : r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : '',
      customerName: r.customerName as string | null | undefined,
      customerMobile: r.customerMobile as string | null | undefined,
      consultationTreatmentTotal:
        (r as Record<string, unknown>).consultationTreatmentTotal != null
          ? String((r as Record<string, unknown>).consultationTreatmentTotal)
          : undefined,
    }));
  }, [sales]);

  const saleGroups = useMemo(() => buildPharmacyGroups(ledgerLines), [ledgerLines]);

  const filteredGroups = useMemo(() => {
    let g = saleGroups;
    if (listSaleKind !== 'all') {
      g = g.filter((x) => x.saleKind === listSaleKind);
    }
    const q = listSearch.trim().toLowerCase();
    if (!q) return g;
    return g.filter((row) => {
      const blob = [
        row.saleDate,
        row.customerName,
        row.customerMobile,
        row.saleKind === 'direct' ? 'direct walk-in' : 'consultation',
        ...row.items.map((i) => i.medicineName),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [saleGroups, listSaleKind, listSearch]);

  const listTotalPages = Math.max(1, Math.ceil(filteredGroups.length / RECORDS_PAGE_SIZE));

  const pagedGroups = useMemo(() => {
    const start = (listPage - 1) * RECORDS_PAGE_SIZE;
    return filteredGroups.slice(start, start + RECORDS_PAGE_SIZE);
  }, [filteredGroups, listPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredGroups.length / RECORDS_PAGE_SIZE));
    if (listPage > maxPage) setListPage(maxPage);
  }, [filteredGroups.length, listPage]);

  const addItem = () => {
    const inv = inventory[0] as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
    if (!inv) return;
    setForm((f) => ({
      ...f,
      items: [...f.items, { inventoryId: inv.id, medicineId: inv.medicineId, medicineName: inv.medicineName || 'Medicine', quantity: 1, unitPrice: parseFloat(inv.sellingPrice as string) || 0 }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: number | string) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const totalAmount = form.items.reduce((s, m) => s + m.quantity * m.unitPrice, 0);

  const handleSubmit = async () => {
    if (!targetClinicId || form.items.length === 0) {
      toast({ title: 'Missing data', description: 'Select clinic and add at least one medicine', variant: 'destructive' });
      return;
    }
    const customerName = form.customerName.trim();
    if (!customerName) {
      toast({ title: 'Customer name required', description: 'Enter a name for this walk-in sale.', variant: 'destructive' });
      return;
    }
    const mobileDigits = form.customerMobile.replace(/\D/g, '');
    if (form.customerMobile.trim() && mobileDigits.length !== 10) {
      toast({ title: 'Invalid mobile', description: 'Enter a 10-digit mobile number or leave it blank.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.directSales.create({
        clinicId: targetClinicId,
        saleDate: form.saleDate,
        customerName,
        customerMobile: mobileDigits.length === 10 ? mobileDigits : undefined,
        items: form.items.map((m) => ({
          inventoryId: m.inventoryId,
          medicineId: m.medicineId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      });
      toast({ title: 'Sale recorded', description: `Total: ₹${totalAmount}` });
      setForm((f) => ({ ...f, items: [], customerMobile: '' }));
      void fetchSalesHistory();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Direct Medicine Sales" description="Walk-in sales (without consultation). History includes consultation pharmacy bills for the same clinic." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
            <CardDescription>Record walk-in medicine sale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sale Date</Label>
              <Input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Customer name</Label>
                <Input
                  placeholder="e.g. Walk-in customer"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Mobile (optional)</Label>
                <Input
                  placeholder="10-digit number"
                  inputMode="numeric"
                  value={form.customerMobile}
                  onChange={(e) => setForm((f) => ({ ...f, customerMobile: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button size="sm" variant="outline" onClick={addItem} disabled={!targetClinicId || inventory.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {form.items.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.items.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2">
                      <Select
                        value={m.inventoryId}
                        onValueChange={(v) => {
                          const inv = inventory.find((x) => (x as { id: string }).id === v) as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
                          if (inv) {
                            updateItem(i, 'inventoryId', v);
                            updateItem(i, 'medicineId', inv.medicineId);
                            updateItem(i, 'medicineName', inv.medicineName || '');
                            updateItem(i, 'unitPrice', parseFloat(inv.sellingPrice) || 0);
                          }
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
                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)}
                        min={1}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        value={m.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)}
                      />
                      <span className="text-sm">= ₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={loading || !targetClinicId || form.items.length === 0} className="w-full">
              {loading ? 'Saving...' : 'Record Sale'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div>
              <CardTitle>Sales history</CardTitle>
              <CardDescription>Direct walk-in and consultation pharmacy sales for this clinic</CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">From</Label>
                <Input type="date" value={listFrom} onChange={(e) => setListFrom(e.target.value)} className="h-9 w-[140px]" />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="date" value={listTo} onChange={(e) => setListTo(e.target.value)} className="h-9 w-[140px]" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Sale type</Label>
                <Select value={listSaleKind} onValueChange={(v) => setListSaleKind(v as 'all' | 'direct' | 'consultation')}>
                  <SelectTrigger className="h-9 w-[min(100%,220px)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="direct">Direct sale</SelectItem>
                    <SelectItem value="consultation">Consultation sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative min-w-0 flex-1 lg:max-w-sm">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search…"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!targetClinicId ? (
              <p className="text-sm text-muted-foreground">Select a clinic to view history</p>
            ) : historyLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-4">
                {historySource === 'direct_fallback' && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                    Walk-in history only until <code className="rounded bg-amber-100/80 px-1 font-mono text-[11px] dark:bg-amber-900/50">GET /api/pharmacy-records</code> is deployed.
                  </p>
                )}
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer / patient</TableHead>
                        <TableHead className="hidden sm:table-cell">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                            No sales in this range. Try different dates or clear filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedGroups.map((sale) => {
                        const preview = sale.items.slice(0, 2).map((item) => {
                          const qty = item.quantity;
                          const tot = parseFloat(item.total || '0');
                          return qty === 0 && tot < 0 ? 'Discount' : `${item.medicineName} × ${qty}`;
                        });
                        const more = sale.items.length > 2 ? ` +${sale.items.length - 2}` : '';
                        return (
                          <TableRow key={sale.key}>
                            <TableCell className="whitespace-nowrap">{sale.saleDate}</TableCell>
                            <TableCell>
                              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                {sale.saleKind === 'direct' ? 'Direct' : 'Consultation'}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[160px]">
                              <div className="font-medium truncate">{sale.customerName || '—'}</div>
                              {sale.customerMobile ? (
                                <div className="text-xs text-muted-foreground truncate">{sale.customerMobile}</div>
                              ) : null}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                              {preview.join(', ')}
                              {more}
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{sale.total.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing{' '}
                    {filteredGroups.length === 0 ? 0 : (listPage - 1) * RECORDS_PAGE_SIZE + 1}–
                    {Math.min(listPage * RECORDS_PAGE_SIZE, filteredGroups.length)} of {filteredGroups.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={listPage <= 1 || filteredGroups.length === 0}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      Page {listPage} / {listTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={listPage >= listTotalPages || filteredGroups.length === 0}
                      onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectSalesPage;

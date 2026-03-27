import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Search, Loader2, Printer, MessageCircle, Plus, CalendarDays, Eye } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { parseISO, isValid } from 'date-fns';
import {
  formatAppDate,
  formatAppTime,
  formatBillDisplayDateTime,
  formatIsoDateToApp,
  formatNowAppTime,
} from '@/lib/datetime';
import { buildPharmacyPrintPayload } from '@/lib/pharmacy-print-payload';
import { openPharmacyPrint, savePharmacyPrintPayload } from '@/lib/print-handoff';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  buildPharmacyGroups,
  type PharmacyLedgerLine,
  type PharmacySaleGroup,
} from '@/pages/admin/pharmacyLedgerUtils';

const PAGE_SIZES = [10, 20, 50] as const;

function formatSaleDate(s: string): string {
  const d = parseISO(s.slice(0, 10));
  return isValid(d) ? formatAppDate(d) : s.slice(0, 10);
}

function effectiveSaleDateIso(sale: PharmacySaleGroup): string {
  const raw = (sale.saleDate || '').slice(0, 10);
  const fromCreated = (sale.createdAt || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromCreated)) return fromCreated;
  return '';
}

/** Bill date column: dd-MM-yyyy + time from saved instant (aligns with filters / invoice). */
function formatBillDateTime(sale: PharmacySaleGroup): string {
  const iso = effectiveSaleDateIso(sale);
  if (!iso) return '—';
  const datePart = formatIsoDateToApp(iso);
  if (!sale.createdAt) return datePart;
  try {
    const t = parseISO(sale.createdAt);
    return isValid(t) ? `${datePart} - ${formatAppTime(t)}` : datePart;
  } catch {
    return datePart;
  }
}

function formatGroupSheetDate(sale: PharmacySaleGroup): string {
  const iso = effectiveSaleDateIso(sale);
  if (!iso) return '—';
  return formatSaleDate(iso);
}

function customerInitials(name: string): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayCustomerName(sale: PharmacySaleGroup): string {
  const n = (sale.customerName || '').trim();
  if (n) return n;
  if (sale.saleKind === 'own') return 'Own use';
  return sale.saleKind === 'direct' ? 'Walk-in sale' : '—';
}

/** Show last 10 digits for Indian numbers stored with country code. */
function formatMobileDisplay(raw: string | null | undefined): string {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 0) return '—';
  return d.length >= 10 ? d.slice(-10) : d;
}

/** Match PharmacyPrintPage: fee row + other consultation_treatments (excl. duplicate name). */
function treatmentBillRows(treatments: { name: string; price: string }[]) {
  const fee = parseFloat(treatments.find((t) => t.name === 'Consultation')?.price || '0') || 0;
  const rest = treatments.filter((t) => t.name !== 'Consultation');
  const rows: { key: string; label: string; qty: string; amount: number }[] = [];
  if (fee > 0) rows.push({ key: 'consultation-fee', label: 'Consultation', qty: '1', amount: fee });
  rest.forEach((t, i) => {
    const amt = parseFloat(String(t.price ?? 0)) || 0;
    rows.push({ key: `tr-${i}-${t.name}`, label: t.name, qty: '1', amount: amt });
  });
  return rows;
}

const PharmacyRecordsPage = () => {
  const { effectiveClinicId, clinics } = useAdminClinic();
  const [pharmacyRecords, setPharmacyRecords] = useState<Record<string, unknown>[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsDateFrom, setRecordsDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [recordsDateTo, setRecordsDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsSaleKind, setRecordsSaleKind] = useState<'all' | 'direct' | 'consultation' | 'own'>('all');
  const [recordsPage, setRecordsPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [recordsSource, setRecordsSource] = useState<'unified' | 'direct_fallback' | null>(null);
  const [viewSale, setViewSale] = useState<PharmacySaleGroup | null>(null);
  const [viewRowIdx, setViewRowIdx] = useState(0);
  /** null = still loading consultation bill; [] = loaded with no fee rows (same source as print). */
  const [sheetConsultationTreatments, setSheetConsultationTreatments] = useState<{ name: string; price: string }[] | null>(
    null,
  );
  const { toast } = useToast();

  const targetClinicId = effectiveClinicId ?? undefined;

  const fetchPharmacyRecords = useCallback(async () => {
    if (!targetClinicId) return;
    setRecordsLoading(true);
    try {
      const data = await api.pharmacyRecords.list({
        clinicId: targetClinicId,
        from: recordsDateFrom,
        to: recordsDateTo,
      });
      setPharmacyRecords(data as Record<string, unknown>[]);
      console.log('data',data)
      setRecordsSource('unified');
    } catch {
      try {
        const data = await api.directSales.list({
          clinicId: targetClinicId,
          from: recordsDateFrom,
          to: recordsDateTo,
        });
        setPharmacyRecords(data as Record<string, unknown>[]);
        setRecordsSource('direct_fallback');
      } catch {
        setPharmacyRecords([]);
        setRecordsSource(null);
      }
    } finally {
      setRecordsLoading(false);
    }
  }, [targetClinicId, recordsDateFrom, recordsDateTo]);

  useEffect(() => {
    if (!targetClinicId) {
      setPharmacyRecords([]);
      setRecordsSource(null);
      setRecordsLoading(false);
      return;
    }
    void fetchPharmacyRecords();
  }, [targetClinicId, fetchPharmacyRecords]);

  useEffect(() => {
    setRecordsPage(1);
  }, [recordsDateFrom, recordsDateTo, recordsSearch, recordsSaleKind, targetClinicId, perPage]);

  const ledgerLines = useMemo((): PharmacyLedgerLine[] => {
    return (pharmacyRecords as Record<string, unknown>[]).map((r) => {
      const row = r as Record<string, unknown>;
      return {
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
        customerName: (row.customerName ?? row.patientName ?? row.name) as string | null | undefined,
        customerMobile: (row.customerMobile ?? row.mobile ?? row.phone) as string | null | undefined,
        consultationTreatmentTotal: row.consultationTreatmentTotal != null ? String(row.consultationTreatmentTotal) : undefined,
        batchNumber: (row.batchNumber as string | null | undefined) ?? null,
        expiryDate: (row.expiryDate as string | null | undefined) ?? null,
      };
    });
  }, [pharmacyRecords]);

  const pharmacyGroups = useMemo(() => buildPharmacyGroups(ledgerLines), [ledgerLines]);

  const filteredPharmacyGroups = useMemo(() => {
    let g = pharmacyGroups;
    if (recordsSaleKind !== 'all') {
      g = g.filter((x) => x.saleKind === recordsSaleKind);
    }
    const q = recordsSearch.trim().toLowerCase();
    if (!q) return g;
    return g.filter((row) => {
      const blob = [
        row.saleDate,
        row.customerName,
        row.customerMobile,
        row.saleKind === 'direct'
          ? 'direct walk-in'
          : row.saleKind === 'own'
            ? 'own'
            : 'consultation',
        ...row.items.map((i) => i.medicineName),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [pharmacyGroups, recordsSaleKind, recordsSearch]);

  const totalFiltered = filteredPharmacyGroups.length;
  const recordsTotalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

  const pagedPharmacyGroups = useMemo(() => {
    console.log(filteredPharmacyGroups);
    const start = (recordsPage - 1) * perPage;
    return filteredPharmacyGroups.slice(start, start + perPage);
  }, [filteredPharmacyGroups, recordsPage, perPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredPharmacyGroups.length / perPage));
    if (recordsPage > maxPage) setRecordsPage(maxPage);
  }, [filteredPharmacyGroups.length, recordsPage, perPage]);

  useEffect(() => {
    if (!viewSale?.consultationId || viewSale.saleKind !== 'consultation') {
      setSheetConsultationTreatments(null);
      return;
    }
    const cid = viewSale.consultationId;
    const ledgerFallback = parseFloat(String(viewSale.items[0]?.consultationTreatmentTotal ?? '0')) || 0;
    setSheetConsultationTreatments(null);
    api.consultations
      .get(cid)
      .then((data) => {
        const tr = (data.treatments as { name: string; price: string }[]) || [];
        if (tr.length === 0 && ledgerFallback > 0) {
          setSheetConsultationTreatments([{ name: 'Consultation & treatments', price: String(ledgerFallback) }]);
        } else {
          setSheetConsultationTreatments(tr);
        }
      })
      .catch(() => {
        if (ledgerFallback > 0) {
          setSheetConsultationTreatments([{ name: 'Consultation & treatments', price: String(ledgerFallback) }]);
        } else {
          setSheetConsultationTreatments([]);
        }
      });
  }, [viewSale]);

  const startIdx = (recordsPage - 1) * perPage;
  const visiblePageNumbers = useMemo(() => {
    const totalPages = recordsTotalPages;
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (recordsPage <= 3) return i + 1;
      if (recordsPage >= totalPages - 2) return totalPages - 4 + i;
      return recordsPage - 2 + i;
    });
  }, [recordsTotalPages, recordsPage]);

  const handlePrint = (id: string, options?: { paymentMode?: string }) => {
    api.consultations.get(id).then((data) => {
      const now = new Date();
      const billDate = now.toISOString().slice(0, 10);
      const billTime = formatNowAppTime();
      try {
        const paymentMode = options?.paymentMode ?? '—';
        const billDateLabel = formatBillDisplayDateTime(billDate, billTime);
        savePharmacyPrintPayload(
          id,
          buildPharmacyPrintPayload(data as Record<string, unknown>, {
            paymentMode,
            billDate,
            billTime,
            billDateLabel,
          })
        );
      } catch {}
      openPharmacyPrint(id);
    }).catch(() => toast({ title: 'Failed to load', variant: 'destructive' }));
  };

  const sendConsultationBillWhatsApp = (consultationId: string) => {
    api.consultations.get(consultationId).then((data) => {
      const rawMobile = (data.patientMobile as string) || '';
      const digits = rawMobile.replace(/\D/g, '');
      if (digits.length < 10) {
        toast({ title: 'No mobile', description: 'Patient has no mobile on file', variant: 'destructive' });
        return;
      }
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
      const billDate = new Date().toISOString().slice(0, 10);
      const billTime = formatNowAppTime();
      api.whatsapp
        .sendBill({
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
            paymentMode: '—',
            date: formatBillDisplayDateTime(billDate, billTime),
            clinicName: data.clinicName as string,
          },
        })
        .then((r) => {
          if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
          else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
        })
        .catch(() => {});
    }).catch(() => toast({ title: 'Failed to load bill', variant: 'destructive' }));
  };

  const printDirectSaleRecord = (sale: PharmacySaleGroup, rowIndex: number) => {
    const discountItems = sale.items.filter((it) => it.quantity === 0 && parseFloat(it.total || '0') < 0);
    const medicineItems = sale.items.filter((it) => it.quantity > 0 || parseFloat(it.total || '0') >= 0);
    const discountAmount = discountItems.reduce((s, it) => s + parseFloat(it.total || '0'), 0);
    const medicineSubtotal = medicineItems.reduce((s, it) => s + parseFloat(it.total || '0'), 0);
    const printId = `record_${sale.saleDate}_${rowIndex}_${Date.now()}`;
    const clinicName = clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic';
    const now = new Date();
    const billDate = now.toISOString().slice(0, 10);
    const billTime = formatNowAppTime();
    const printData = {
      patientName: sale.customerName || 'Direct Sale',
      patientMobile: sale.customerMobile,
      consultationDate: sale.saleDate,
      consultationTime: null,
      billDate,
      billTime,
      billDateLabel: formatBillDisplayDateTime(billDate, billTime),
      clinicName,
      doctorName: 'Dr.V.VAITHEESHWARI B.A.M.S.,',
      paymentMode: 'Cash',
      medicines: medicineItems.map((m) => ({
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
    savePharmacyPrintPayload(printId, printData);
    openPharmacyPrint(printId);
  };

  const whatsappDirectSaleRecord = (sale: PharmacySaleGroup) => {
    const discountItems = sale.items.filter((it) => it.quantity === 0 && parseFloat(it.total || '0') < 0);
    const medicineItems = sale.items.filter((it) => it.quantity > 0 || parseFloat(it.total || '0') >= 0);
    const discountAmount = discountItems.reduce((s, it) => s + parseFloat(it.total || '0'), 0);
    const medicineSubtotal = medicineItems.reduce((s, it) => s + parseFloat(it.total || '0'), 0);
    const grandTotal = medicineSubtotal + (discountAmount < 0 ? discountAmount : 0);
    let rawMobile = String(sale.customerMobile || '').replace(/\D/g, '');
    if (rawMobile.length > 10) rawMobile = rawMobile.slice(-10);
    if (rawMobile.length < 10) {
      toast({ title: 'No mobile', description: 'No mobile number on this sale', variant: 'destructive' });
      return;
    }
    api.whatsapp
      .sendBill({
        mobile: rawMobile,
        countryCode: '91',
        billData: {
          customerName: sale.customerName || 'Direct Sale',
          medicines: medicineItems.map((m) => ({
            medicineName: m.medicineName,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            total: m.total,
          })),
          treatments: discountAmount < 0 ? [{ name: 'Medicine Discount', price: String(discountAmount) }] : [],
          medicineTotal: String(medicineSubtotal),
          treatmentTotal: discountAmount < 0 ? String(discountAmount) : '0',
          grandTotal: grandTotal.toFixed(2),
          paymentMode: 'Cash',
          date: sale.saleDate,
          clinicName: clinics.find((c) => c.id === targetClinicId)?.name || 'Clinic',
        },
      })
      .then((r) => {
        if (r.sent) toast({ title: 'Bill sent via WhatsApp', description: 'Invoice delivered to customer' });
        else if (r.error) toast({ title: 'WhatsApp not sent', description: r.error, variant: 'destructive' });
      })
      .catch(() => {});
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardContent className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
          <div className="shrink-0 border-b border-border/50 bg-muted/15 px-3 py-2 transition-colors duration-200 ease-out hover:bg-muted/25 sm:px-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <div className="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, mobile, medicines…"
                  value={recordsSearch}
                  onChange={(e) => setRecordsSearch(e.target.value)}
                  className="h-9 rounded-md border-border/60 bg-background pl-9 text-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/25 hover:shadow-sm focus-visible:border-primary/40"
                  aria-label="Search pharmacy records"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 transition-[border-color,background-color] duration-200 ease-out hover:border-primary/25 hover:bg-muted/30">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <Input
                    type="date"
                    value={recordsDateFrom}
                    onChange={(e) => setRecordsDateFrom(e.target.value)}
                    className="h-8 w-[128px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:w-[136px] sm:text-sm"
                    aria-label="From date"
                  />
                  <span className="text-muted-foreground/60">–</span>
                  <Input
                    type="date"
                    value={recordsDateTo}
                    onChange={(e) => setRecordsDateTo(e.target.value)}
                    className="h-8 w-[128px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:w-[136px] sm:text-sm"
                    aria-label="To date"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="sr-only" htmlFor="pharmacy-sale-kind">
                    Sale type
                  </Label>
                  <Select value={recordsSaleKind} onValueChange={(v) => setRecordsSaleKind(v as 'all' | 'direct' | 'consultation' | 'own')}>
                    <SelectTrigger id="pharmacy-sale-kind" className="h-9 w-[min(100%,220px)] rounded-md border-border/60 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="direct">Direct sale</SelectItem>
                      <SelectItem value="consultation">Consultation patient</SelectItem>
                      <SelectItem value="own">Own use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-md shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:brightness-[1.02] active:scale-[0.98]"
                  asChild
                >
                  <Link to="/admin/pharmacy/new" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New invoice
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 sm:px-4">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
              {!targetClinicId ? (
                <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                  Select a clinic in the header to view pharmacy records.
                </div>
              ) : recordsLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  Loading records…
                </div>
              ) : (
                <>
                  {recordsSource === 'direct_fallback' && (
                    <div className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                      Showing walk-in (direct) sales only — deploy{' '}
                      <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px] dark:bg-amber-900/50">GET /api/pharmacy-records</code>{' '}
                      for consultation bills in this list.
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md">
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableHead className="h-9 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                          <TableHead className="h-9 min-w-[148px] py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Patient / customer
                          </TableHead>
                          <TableHead className="h-9 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile</TableHead>
                          <TableHead className="hidden lg:table-cell h-9 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Items
                          </TableHead>
                          <TableHead className="h-9 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</TableHead>
                          <TableHead className="h-9 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            Bill date
                          </TableHead>
                          <TableHead className="h-9 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedPharmacyGroups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-36 border-0">
                              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                                <p className="text-base font-medium text-foreground">No records match</p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                  Adjust filters or create a new invoice.
                                </p>
                                <Button size="sm" asChild>
                                  <Link to="/admin/pharmacy/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New invoice
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          pagedPharmacyGroups.map((sale, i) => {
                            const rowIdx = startIdx + i;
                            const preview = sale.items.slice(0, 3).map((item) => {
                              const qty = item.quantity;
                              const tot = parseFloat(item.total || '0');
                              if (qty === 0 && tot < 0) return 'Discount';
                              if (qty === 0 && tot === 0 && item.medicineName === '—') return 'Consultation / services';
                              return `${item.medicineName} × ${qty}`;
                            });
                            const more = sale.items.length > 3 ? ` +${sale.items.length - 3} more` : '';
                            const nameLabel = displayCustomerName(sale);
                            return (
                              <TableRow
                                key={sale.key}
                                className={
                                  i % 2 === 0
                                    ? 'group border-border/30 hover:bg-muted/40'
                                    : 'group border-border/30 bg-muted/30 hover:bg-muted/45'
                                }
                              >
                                <TableCell className="align-top py-2.5">
                                  <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/15">
                                    {sale.saleKind === 'direct'
                                      ? 'Direct'
                                      : sale.saleKind === 'own'
                                        ? 'Own'
                                        : 'Consultation'}
                                  </span>
                                </TableCell>
                                <TableCell className="align-top py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary"
                                      aria-hidden
                                    >
                                      {customerInitials(nameLabel)}
                                    </div>
                                    <span
                                      className="min-w-0 max-w-[200px] truncate font-medium leading-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:max-w-[240px]"
                                      title={nameLabel}
                                    >
                                      {nameLabel}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 align-top font-mono text-sm tabular-nums tracking-tight text-foreground/85">
                                  {formatMobileDisplay(sale.customerMobile)}
                                </TableCell>
                                <TableCell className="hidden max-w-[280px] py-2.5 align-top text-xs text-muted-foreground lg:table-cell">
                                  <span className="line-clamp-2">
                                    {preview.join(', ')}
                                    {more}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5 text-right align-top text-sm font-semibold tabular-nums text-foreground">
                                  ₹{sale.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="py-2.5 text-right align-top text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                                  {formatBillDateTime(sale)}
                                </TableCell>
                                <TableCell className="py-2.5 text-right align-top">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5"
                                    onClick={() => {
                                      setViewSale(sale);
                                      setViewRowIdx(rowIdx);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </div>

          {targetClinicId && !recordsLoading && totalFiltered > 0 && (
            <div className="z-20 shrink-0 border-t border-border/60 bg-muted/20 px-3 py-2 transition-colors duration-200 hover:bg-muted/30 sm:px-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {startIdx + 1}–{Math.min(startIdx + perPage, totalFiltered)}
                  </span>
                  <span className="text-muted-foreground/80">of</span>
                  <span className="font-medium tabular-nums text-foreground">{totalFiltered}</span>
                  <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Rows</span>
                    <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setRecordsPage(1); }}>
                      <SelectTrigger className="h-9 w-[4.5rem] rounded-lg border-border/70 bg-background text-sm font-medium shadow-sm transition-all duration-200 hover:border-primary/35 hover:bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Pagination className="mx-auto w-full justify-center sm:mx-0 sm:w-auto sm:justify-end">
                  <PaginationContent className="flex-wrap gap-0.5 rounded-xl border border-border/50 bg-background/80 p-1 shadow-sm transition-shadow duration-200 hover:shadow-md">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setRecordsPage((prev) => Math.max(1, prev - 1));
                        }}
                        className={
                          recordsPage <= 1
                            ? 'pointer-events-none opacity-40'
                            : 'cursor-pointer rounded-lg transition-colors duration-200 hover:bg-primary/10 hover:text-primary'
                        }
                      />
                    </PaginationItem>
                    {visiblePageNumbers.map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setRecordsPage(pageNum);
                          }}
                          isActive={recordsPage === pageNum}
                          className="min-w-[2.25rem] cursor-pointer rounded-lg transition-colors duration-200 hover:bg-muted/80"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setRecordsPage((prev) => Math.min(recordsTotalPages, prev + 1));
                        }}
                        className={
                          recordsPage >= recordsTotalPages
                            ? 'pointer-events-none opacity-40'
                            : 'cursor-pointer rounded-lg transition-colors duration-200 hover:bg-primary/10 hover:text-primary'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!viewSale}
        onOpenChange={(open) => {
          if (!open) setViewSale(null);
        }}
      >
        <SheetContent className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-lg">
          {viewSale ? (
            <>
              <SheetHeader className="border-b px-6 pb-4 pt-6 text-left">
                <SheetTitle>Pharmacy sale</SheetTitle>
                <SheetDescription>
                  {formatGroupSheetDate(viewSale)}
                  {' · '}
                  {viewSale.saleKind === 'direct'
                    ? 'Direct sale'
                    : viewSale.saleKind === 'own'
                      ? 'Own use'
                      : 'Consultation pharmacy'}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Patient / customer</p>
                    <p className="text-base font-semibold">{displayCustomerName(viewSale)}</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                      {formatMobileDisplay(viewSale.customerMobile)}
                    </p>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9 text-xs">Item</TableHead>
                          <TableHead className="h-9 text-xs hidden sm:table-cell">Batch</TableHead>
                          <TableHead className="h-9 text-xs hidden sm:table-cell">Expiry</TableHead>
                          <TableHead className="h-9 text-right text-xs">Qty</TableHead>
                          <TableHead className="h-9 text-right text-xs">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewSale.saleKind === 'consultation' && sheetConsultationTreatments === null && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading consultation &amp; services…
                              </span>
                            </TableCell>
                          </TableRow>
                        )}
                        {viewSale.saleKind === 'consultation' &&
                          sheetConsultationTreatments !== null &&
                          treatmentBillRows(sheetConsultationTreatments).map((row) => (
                            <TableRow key={row.key}>
                              <TableCell className="text-sm font-medium">{row.label}</TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">—</TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">—</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">{row.qty}</TableCell>
                              <TableCell className="text-right text-sm tabular-nums">₹{row.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        {(viewSale.saleKind !== 'consultation' || sheetConsultationTreatments !== null) &&
                          viewSale.items.map((line) => {
                            const tot = parseFloat(line.total || '0');
                            const isDiscount = line.quantity === 0 && tot < 0;
                            return (
                              <TableRow key={line.id}>
                                <TableCell className="text-sm">{isDiscount ? 'Discount' : line.medicineName}</TableCell>
                                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                  {isDiscount ? '—' : (line.batchNumber || '—')}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                  {isDiscount ? '—' : (line.expiryDate ? formatSaleDate(String(line.expiryDate)) : '—')}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{isDiscount ? '—' : line.quantity}</TableCell>
                                <TableCell className="text-right text-sm tabular-nums">₹{tot.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t pt-3 text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-lg font-semibold tabular-nums">₹{viewSale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-auto flex flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
                {viewSale.saleKind === 'consultation' && viewSale.consultationId ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() => sendConsultationBillWhatsApp(viewSale.consultationId!)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button type="button" className="w-full gap-2 sm:w-auto" onClick={() => handlePrint(viewSale.consultationId!)}>
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </>
                ) : (
                  <>
                    {formatMobileDisplay(viewSale.customerMobile) !== '—' ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 sm:w-auto"
                        onClick={() => whatsappDirectSaleRecord(viewSale)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() => printDirectSaleRecord(viewSale, viewRowIdx)}
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PharmacyRecordsPage;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api, ApiError } from '@/lib/api';
import { formatAppTime, formatHhmmToAmPm, formatIsoDateToApp, localDateYmd } from '@/lib/datetime';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  CalendarClock,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  DoorOpen,
  Eye,
  Info,
  ListChecks,
  Loader2,
  Package,
  Phone,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { parseISO } from 'date-fns';

function parseMoney(v: unknown): number {
  const n = parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function planEndDateStr(p: Record<string, unknown>): string {
  return String(p.endDate ?? '').slice(0, 10);
}

function planStartDateStr(p: Record<string, unknown>): string {
  return String(p.startDate ?? '').slice(0, 10);
}

function preferredSlotLabelFromRow(row: {
  preferredSessionStart?: string | null;
  preferredSessionEnd?: string | null;
}): string | null {
  if (!row.preferredSessionStart || !row.preferredSessionEnd) return null;
  return `${formatHhmmToAmPm(row.preferredSessionStart)} – ${formatHhmmToAmPm(row.preferredSessionEnd)}`;
}

function preferredSlotLabelFromPlan(p: Record<string, unknown>): string | null {
  const a = p.preferredSessionStart as string | undefined | null;
  const b = p.preferredSessionEnd as string | undefined | null;
  if (!a || !b) return null;
  return `${formatHhmmToAmPm(a)} – ${formatHhmmToAmPm(b)}`;
}

function isoToTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = parseISO(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function localDateTimeToIso(dateStr: string, hhmm: string): string {
  const parts = hhmm.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error('Invalid time');
  const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return d.toISOString();
}

function actualSlotLabel(
  actualStartTime: string | null | undefined,
  actualEndTime: string | null | undefined,
): string | null {
  if (!actualStartTime || !actualEndTime) return null;
  try {
    return `${formatAppTime(parseISO(actualStartTime))} – ${formatAppTime(parseISO(actualEndTime))}`;
  } catch {
    return null;
  }
}

function sessionStockUnitsUsed(units: unknown): number {
  const n = typeof units === 'number' ? units : Number(units);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Searchable medicine picker for session oral / supply lines (cmdk filters by name). */
function SessionMedicineCombobox({
  medicines,
  valueId,
  onSelectId,
  placeholder,
  emptyLabel,
  disabled,
  open,
  onOpenChange,
  searchPlaceholder = 'Search medicine…',
}: {
  medicines: Array<{ id: string; name: string }>;
  valueId: string;
  onSelectId: (id: string) => void;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  searchPlaceholder?: string;
}) {
  const selected = medicines.find((m) => m.id === valueId);
  const empty = medicines.length === 0;
  return (
    <Popover modal={false} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between gap-2 font-normal"
          disabled={disabled || empty}
        >
          <span className="min-w-0 truncate text-left">{selected?.name ?? (empty ? emptyLabel : placeholder)}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),340px)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No medicine matches</CommandEmpty>
            <CommandGroup>
              {medicines.map((med) => (
                <CommandItem
                  key={med.id}
                  value={med.name}
                  onSelect={() => {
                    onSelectId(med.id);
                    onOpenChange(false);
                  }}
                >
                  {med.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ScheduleRow = Awaited<ReturnType<typeof api.treatmentPlans.schedule>>['rows'][number];

const DAY_STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'NO_SHOW'] as const;

function statusLabel(s: string): string {
  if (s === 'COMPLETED') return 'Done';
  if (s === 'NO_SHOW') return 'No-show';
  return 'Pending';
}

function dayStatusRowClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-500/[0.07] dark:bg-emerald-950/35';
  if (status === 'NO_SHOW') return 'bg-destructive/[0.06] dark:bg-destructive/10';
  return '';
}

function dayStatusSelectTriggerClass(status: string): string {
  if (status === 'COMPLETED') return 'border-emerald-500/35 bg-emerald-500/[0.04]';
  if (status === 'NO_SHOW') return 'border-destructive/35';
  return 'border-amber-500/25';
}

const TreatmentPlansPage = () => {
  const { effectiveClinicId, isAdmin } = useAdminClinic();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [scheduleDate, setScheduleDate] = useState(() => localDateYmd());
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [updatingDayId, setUpdatingDayId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<ScheduleRow | null>(null);
  const [detailPlanOnly, setDetailPlanOnly] = useState<Record<string, unknown> | null>(null);
  const [planListFilter, setPlanListFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [historyPatientName, setHistoryPatientName] = useState('');
  const [historyData, setHistoryData] = useState<Awaited<ReturnType<typeof api.treatmentPlans.patientHistory>> | null>(
    null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistoryByPatientId, setPatientHistoryByPatientId] = useState<
    Record<string, Awaited<ReturnType<typeof api.treatmentPlans.patientHistory>>>
  >({});
  const [accordionPlansOpen, setAccordionPlansOpen] = useState<string[]>([]);

  /** Local calendar "today" — recomputed each render so it stays correct after midnight without reload. */
  const todayStr = localDateYmd();
  const isViewingToday = scheduleDate === todayStr;

  const loadPlans = useCallback(() => {
    const params = effectiveClinicId ? { clinicId: effectiveClinicId } : undefined;
    api.treatmentPlans
      .list(params)
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [effectiveClinicId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const loadSchedule = useCallback(
    (dateOverride?: string) => {
      if (!effectiveClinicId) return;
      const dateStr = dateOverride ?? scheduleDate;
      setScheduleLoading(true);
      api.treatmentPlans
        .schedule({ clinicId: effectiveClinicId, date: dateStr })
        .then((res) => {
          setScheduleRows(res.rows);
          setDetailRow((prev) => {
            if (!prev) return null;
            const updated = res.rows.find((r) => r.planDayId === prev.planDayId);
            return updated ?? prev;
          });
        })
        .catch(() => setScheduleRows([]))
        .finally(() => setScheduleLoading(false));
    },
    [effectiveClinicId, scheduleDate],
  );

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const ongoingPlans = useMemo(
    () => plans.filter((p) => planEndDateStr(p) >= todayStr).sort((a, b) => planEndDateStr(b).localeCompare(planEndDateStr(a))),
    [plans, todayStr],
  );
  const completedPlans = useMemo(
    () => plans.filter((p) => planEndDateStr(p) < todayStr).sort((a, b) => planEndDateStr(b).localeCompare(planEndDateStr(a))),
    [plans, todayStr],
  );

  const filteredPlansForList = useMemo(() => {
    if (planListFilter === 'active') return ongoingPlans;
    if (planListFilter === 'completed') return completedPlans;
    return [...ongoingPlans, ...completedPlans].sort((a, b) => planEndDateStr(b).localeCompare(planEndDateStr(a)));
  }, [planListFilter, ongoingPlans, completedPlans]);

  useEffect(() => {
    if (!historyPatientId || !effectiveClinicId) {
      setHistoryData(null);
      return;
    }
    setHistoryLoading(true);
    api.treatmentPlans
      .patientHistory(historyPatientId, effectiveClinicId)
      .then(setHistoryData)
      .catch(() => setHistoryData(null))
      .finally(() => setHistoryLoading(false));
  }, [historyPatientId, effectiveClinicId]);

  const ensurePatientHistoryForAccordion = useCallback(async (patientId: string) => {
    if (!effectiveClinicId) return;
    try {
      const data = await api.treatmentPlans.patientHistory(patientId, effectiveClinicId);
      setPatientHistoryByPatientId((prev) => {
        if (prev[patientId]) return prev;
        return { ...prev, [patientId]: data };
      });
    } catch {
      /* ignore */
    }
  }, [effectiveClinicId]);

  const scheduleDoneCount = useMemo(() => scheduleRows.filter((r) => r.dayStatus === 'COMPLETED').length, [scheduleRows]);
  const schedulePendingCount = useMemo(() => scheduleRows.filter((r) => r.dayStatus === 'PENDING').length, [scheduleRows]);
  const scheduleTotal = scheduleRows.length;
  const progressPct = scheduleTotal > 0 ? Math.round((scheduleDoneCount / scheduleTotal) * 100) : 0;

  const scheduleRowByPlanId = useMemo(() => {
    const m = new Map<string, ScheduleRow>();
    for (const r of scheduleRows) {
      m.set(r.treatmentPlanId, r);
    }
    return m;
  }, [scheduleRows]);

  const openSessionDetail = (row: ScheduleRow) => {
    setDetailRow(row);
    setDetailPlanOnly(null);
    setDetailOpen(true);
  };

  const openPlanFromSidebar = (p: Record<string, unknown>) => {
    const pid = p.id as string;
    const row = scheduleRowByPlanId.get(pid);
    if (row) {
      setDetailRow(row);
      setDetailPlanOnly(null);
    } else {
      setDetailRow(null);
      setDetailPlanOnly(p);
    }
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailRow(null);
    setDetailPlanOnly(null);
  };

  const openPatientHistory = (patientId: string, name: string) => {
    setHistoryPatientId(patientId);
    setHistoryPatientName(name);
  };

  const closePatientHistory = () => {
    setHistoryPatientId(null);
    setHistoryData(null);
  };

  const updateDayStatus = async (planDayId: string, status: (typeof DAY_STATUS_OPTIONS)[number]) => {
    setUpdatingDayId(planDayId);
    try {
      await api.clinicManagement.updateDayStatus(planDayId, { status });
      toast({ title: 'Session updated', description: `Marked as ${statusLabel(status)}` });
      loadSchedule();
      loadPlans();
      if (detailRow?.planDayId === planDayId) {
        setDetailRow((prev) => (prev ? { ...prev, dayStatus: status } : null));
      }
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Could not save',
        variant: 'destructive',
      });
    } finally {
      setUpdatingDayId(null);
    }
  };

  const staffNeedsClinic = !isAdmin && !effectiveClinicId;

  if (staffNeedsClinic) {
    return (
      <div className="space-y-6">
        <PageHeader title="Treatment plans" description="Your session has no clinic — reload or contact admin." />
        <Card className="border-destructive/40">
          <CardContent className="py-6 text-sm text-destructive">No clinic in your session.</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin && !effectiveClinicId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Treatment plans"
          description="Pick a branch in the header to see ongoing and completed plans, and today’s session schedule."
        />
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="py-6 text-sm text-amber-950 dark:text-amber-100">
            Select a clinic in the header to load treatment plans and today’s schedule for that branch.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlanId =
    detailOpen && (detailRow?.treatmentPlanId ?? detailPlanOnly?.id)
      ? String(detailRow?.treatmentPlanId ?? detailPlanOnly?.id)
      : null;

  return (
    <div className="space-y-6 w-full max-w-[1400px]">
      <PageHeader
        title="Treatment plans"
        description="Pick a date for the schedule board. Open any row for status, therapist, room, time, and session medicines. The sidebar lists active packages for this clinic."
      >
        <Button asChild className="gap-2 shadow-sm">
          <Link to="/admin/treatment-plans/new">
            <Plus className="h-4 w-4" />
            New treatment plan
          </Link>
        </Button>
      </PageHeader>

      {/* ─── Today: full width on top ─── */}
      <Card className="border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/10">
        <CardHeader className="border-b bg-gradient-to-r from-primary/8 via-background to-background pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-semibold tracking-tight">Session schedule</CardTitle>
                  <CardDescription className="mt-1 leading-relaxed">
                    {isViewingToday
                      ? 'Visits are listed by calendar day for this clinic. Clock times are optional — open a row to set therapist, room, and times manually when needed.'
                      : `Showing ${formatIsoDateToApp(scheduleDate)}. Use Today to jump back to the live day.`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2 shrink-0">
                <div className="space-y-1">
                  <Label htmlFor="sched-date" className="text-xs">
                    Date
                  </Label>
                  <Input
                    id="sched-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-9 w-[160px]"
                  />
                </div>
                <Button type="button" variant="default" size="sm" className="h-9" onClick={() => setScheduleDate(todayStr)}>
                  Today
                </Button>
              </div>
            </div>
            {!scheduleLoading && scheduleRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">
                  {scheduleDoneCount} / {scheduleTotal} done
                </span>
                <div className="h-2 flex-1 min-w-[120px] max-w-md overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {schedulePendingCount > 0 && (
                  <span className="text-muted-foreground">{schedulePendingCount} pending</span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {scheduleLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading schedule…
            </div>
          ) : scheduleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
                <CalendarClock className="h-7 w-7 opacity-80" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No package days on this date</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  None of your treatment packages include {formatIsoDateToApp(scheduleDate)} as a session day (each plan
                  only lists its own start–end dates). &quot;In progress&quot; counts whole packages, not necessarily a
                  visit today. Pick another date or add / extend a plan if someone should be seen then.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-1" asChild>
                <Link to="/admin/treatment-plans/new">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New plan
                </Link>
              </Button>
            </div>
          ) : (
            <div className="relative max-h-[min(70vh,560px)] overflow-auto">
              <p className="border-b border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/90">Tip:</span> Everyone listed here already has this date
                as a package day. Open a row to mark status, add therapist / room / times manually, and record medicines.
              </p>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="sticky top-0 z-10 w-[200px] bg-muted/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border))]">
                      Patient
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border))]">
                      Plan
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border))]">
                      Booked time
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border))]">
                      Status
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 w-[100px] text-right bg-muted/95 backdrop-blur-sm shadow-[0_1px_0_0_hsl(var(--border))]">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleRows.map((row) => {
                    const timeLabel =
                      row.startTime && row.endTime
                        ? `${formatAppTime(parseISO(row.startTime))} – ${formatAppTime(parseISO(row.endTime))}`
                        : null;
                    const actualLbl = actualSlotLabel(row.actualStartTime, row.actualEndTime);
                    const usualSlot = preferredSlotLabelFromRow(row);
                    return (
                      <TableRow
                        key={row.planDayId}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/45 focus-within:bg-muted/40',
                          dayStatusRowClass(row.dayStatus),
                        )}
                        onClick={() => openSessionDetail(row)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="text-left font-medium hover:underline decoration-primary/60 underline-offset-2"
                            onClick={() => openPatientHistory(row.patientId, row.patientName)}
                          >
                            {row.patientName}
                          </button>
                          <div className="text-xs text-muted-foreground tabular-nums">{row.patientMobile}</div>
                          {usualSlot && (
                            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0 opacity-70" />
                              <span>Usual {usualSlot}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{row.planName}</div>
                          <div className="text-xs text-muted-foreground">Day {row.dayNumber}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          <div className="flex flex-col gap-1">
                            {timeLabel ? (
                              <span className="inline-flex items-center gap-1 tabular-nums text-sm">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Booked </span>
                                  {timeLabel}
                                </span>
                              </span>
                            ) : usualSlot ? (
                              <span className="inline-flex items-center gap-1 tabular-nums text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Usual <span className="text-foreground">{usualSlot}</span>
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No time set — add manually</span>
                            )}
                            {actualLbl && (
                              <span className="inline-flex items-center gap-1 text-xs tabular-nums text-amber-800 dark:text-amber-200">
                                <Clock className="h-3 w-3 shrink-0 opacity-80" />
                                <span>
                                  Actual {actualLbl}
                                </span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Select
                              value={row.dayStatus}
                              disabled={updatingDayId === row.planDayId}
                              onValueChange={(v) =>
                                updateDayStatus(row.planDayId, v as (typeof DAY_STATUS_OPTIONS)[number])
                              }
                            >
                              <SelectTrigger
                                className={cn('h-8 w-[130px] text-xs', dayStatusSelectTriggerClass(row.dayStatus))}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAY_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {statusLabel(opt)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingDayId === row.planDayId && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 shadow-sm"
                            onClick={() => openSessionDetail(row)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Sidebar + Ongoing / Completed below ─── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[300px] lg:max-w-[320px]">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/25">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Current plans</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Active packages (end ≥ today). Opens the same panel as the schedule — highlights when that plan is open.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isViewingToday && scheduleTotal > 0 && (
                <div className="border-b border-border/60 bg-muted/15 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Today’s progress</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                    {scheduleDoneCount}
                    <span className="text-muted-foreground font-normal"> / {scheduleTotal}</span>
                    <span className="ml-2 text-sm font-normal text-muted-foreground">sessions done</span>
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
                {ongoingPlans.length === 0 ? (
                  <div className="flex flex-col items-center px-3 py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/90 text-muted-foreground">
                      <Sparkles className="h-6 w-6 opacity-90" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No active packages</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Create a treatment plan to see patients here and on the schedule.
                    </p>
                    <Button type="button" variant="outline" size="sm" className="mt-4" asChild>
                      <Link to="/admin/treatment-plans/new">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New plan
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {ongoingPlans.map((p) => {
                      const pid = p.id as string;
                      const row = scheduleRowByPlanId.get(pid);
                      const balance = parseMoney(p.balanceDue);
                      const isSelected = selectedPlanId === pid;
                      return (
                        <li key={pid}>
                          <button
                            type="button"
                            onClick={() => openPlanFromSidebar(p)}
                            className={cn(
                              'flex w-full items-start gap-2 rounded-xl border px-2.5 py-2.5 text-left text-sm transition-colors',
                              'hover:bg-muted/80 hover:border-border/80',
                              isSelected
                                ? 'border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20'
                                : 'border-transparent',
                            )}
                          >
                            <User className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium leading-tight truncate">{p.patientName as string}</div>
                              <div className="text-xs text-muted-foreground truncate">{p.name as string}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {row ? (
                                  <Badge
                                    variant={row.dayStatus === 'COMPLETED' ? 'default' : 'secondary'}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {formatIsoDateToApp(scheduleDate)}: {statusLabel(row.dayStatus)}
                                  </Badge>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">No row this date</span>
                                )}
                                {balance > 0 && (
                                  <span className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                                    <Wallet className="h-3 w-3" />
                                    {formatInr(balance)}
                                  </span>
                                )}
                                {row && preferredSlotLabelFromRow(row) && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 w-full">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {preferredSlotLabelFromRow(row)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Packages &amp; history</h2>
              </div>
              <ToggleGroup
                type="single"
                value={planListFilter}
                onValueChange={(v) => v && setPlanListFilter(v as typeof planListFilter)}
                className="justify-start"
              >
                <ToggleGroupItem value="active" aria-label="In progress" className="text-xs">
                  In progress ({ongoingPlans.length})
                </ToggleGroupItem>
                <ToggleGroupItem value="completed" aria-label="Completed" className="text-xs">
                  Completed ({completedPlans.length})
                </ToggleGroupItem>
                <ToggleGroupItem value="all" aria-label="All view" className="text-xs">
                  All view
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Filter packages, then open a row to see each day in{' '}
              <span className="font-medium">All view</span>. Click a patient name on the schedule to see full history
              across sessions.
            </p>

            {filteredPlansForList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 py-10 text-center">
                <p className="text-sm text-muted-foreground">No plans match this filter.</p>
                <Button type="button" variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
                  <Link to="/admin/treatment-plans/new">Create a treatment plan</Link>
                </Button>
              </div>
            ) : planListFilter === 'all' ? (
              <Accordion
                type="multiple"
                className="rounded-xl border border-border/80 bg-card/80"
                value={accordionPlansOpen}
                onValueChange={(v) => {
                  setAccordionPlansOpen(v);
                  const ids = Array.isArray(v) ? v : v ? [v] : [];
                  for (const planId of ids) {
                    const pl = filteredPlansForList.find((x) => String(x.id) === planId);
                    if (pl?.patientId) void ensurePatientHistoryForAccordion(String(pl.patientId));
                  }
                }}
              >
                {filteredPlansForList.map((p) => {
                  const pid = String(p.id);
                  const patientId = String(p.patientId ?? '');
                  const muted = planEndDateStr(p) < todayStr;
                  const hist = patientHistoryByPatientId[patientId];
                  const histPlan = hist?.plans?.find((x) => String(x.id) === pid) as Record<string, unknown> | undefined;
                  const days = (histPlan?.days as Array<Record<string, unknown>> | undefined) ?? [];
                  return (
                    <AccordionItem key={pid} value={pid} className="px-3">
                      <AccordionTrigger className="text-xs sm:text-sm hover:no-underline">
                        <div className="flex flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-3">
                          <span className="font-semibold text-foreground">{p.name as string}</span>
                          <span className="text-muted-foreground font-normal">
                            {p.patientName as string} · {formatIsoDateToApp(planStartDateStr(p))} –{' '}
                            {formatIsoDateToApp(planEndDateStr(p))}
                          </span>
                          {muted ? (
                            <Badge variant="outline" className="text-[10px]">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              In progress
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-0">
                        {!histPlan && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Loading day details…
                          </p>
                        )}
                        {histPlan && days.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2">No days generated for this plan.</p>
                        )}
                        {histPlan && days.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-border/60">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/40">
                                  <TableHead className="w-12">Day</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Oral lines</TableHead>
                                  <TableHead>Supplies</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {days.map((d) => (
                                  <TableRow key={String(d.id)}>
                                    <TableCell className="tabular-nums">{String(d.dayNumber)}</TableCell>
                                    <TableCell>{formatIsoDateToApp(String(d.planDate).slice(0, 10))}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="text-[10px]">
                                        {statusLabel(String(d.status))}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {Array.isArray(d.oralLines) ? (d.oralLines as unknown[]).length : 0}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {Array.isArray(d.consumables) ? (d.consumables as unknown[]).length : 0}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        {histPlan &&
                          Array.isArray(histPlan.legacyPlanMedicines) &&
                          (histPlan.legacyPlanMedicines as unknown[]).length > 0 && (
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Legacy plan-level medicines: {(histPlan.legacyPlanMedicines as unknown[]).length} line(s).
                            </p>
                          )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openPlanFromSidebar(p)}>
                            Open session panel
                          </Button>
                          <Button type="button" size="sm" variant="outline" asChild>
                            <Link to={`/admin/treatment-plans/new`}>New plan</Link>
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="space-y-2">
                {filteredPlansForList.map((p) => {
                  const muted = planEndDateStr(p) < todayStr;
                  return (
                    <PlanCard
                      key={p.id as string}
                      p={p}
                      muted={muted}
                      onOpenDetail={() => openPlanFromSidebar(p)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={!!historyPatientId} onOpenChange={(o) => !o && closePatientHistory()}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Treatment history — {historyPatientName || 'Patient'}</DialogTitle>
            <DialogDescription>
              All packages and session days at this clinic. Expand a package on the main list (All view) for day-level
              lines.
            </DialogDescription>
          </DialogHeader>
          {historyLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </p>
          )}
          {!historyLoading && historyData && (
            <div className="space-y-6 text-sm">
              {historyData.plans.length === 0 ? (
                <p className="text-muted-foreground">No treatment plans for this patient at this clinic.</p>
              ) : (
                historyData.plans.map((plan) => {
                  const pl = plan as Record<string, unknown>;
                  const days = (pl.days as Array<Record<string, unknown>> | undefined) ?? [];
                  return (
                    <div key={String(pl.id)} className="rounded-xl border border-border/80 bg-muted/10 p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base">{String(pl.name)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatIsoDateToApp(String(pl.startDate).slice(0, 10))} –{' '}
                            {formatIsoDateToApp(String(pl.endDate).slice(0, 10))}
                            {pl.createdAt && (
                              <span className="ml-2">
                                · Created{' '}
                                {formatIsoDateToApp(String(pl.createdAt).slice(0, 10))}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge variant={pl.isCompleted ? 'outline' : 'secondary'}>
                          {pl.isCompleted ? 'Completed' : 'In progress'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs tabular-nums border-t border-border/60 pt-3">
                        <span>
                          <span className="text-muted-foreground">Total </span>
                          {formatInr(parseMoney(pl.totalCost))}
                        </span>
                        <span>
                          <span className="text-muted-foreground">Advance </span>
                          {formatInr(parseMoney(pl.advancePaid))}
                        </span>
                        <span>
                          <span className="text-muted-foreground">Balance </span>
                          {formatInr(parseMoney(pl.balanceDue))}
                        </span>
                      </div>
                      {days.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-border/60">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/40">
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Oral</TableHead>
                                <TableHead>Supplies</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {days.map((d) => (
                                <TableRow key={String(d.id)}>
                                  <TableCell>{String(d.dayNumber)}</TableCell>
                                  <TableCell>{formatIsoDateToApp(String(d.planDate).slice(0, 10))}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {statusLabel(String(d.status))}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                                    {Array.isArray(d.oralLines)
                                      ? (d.oralLines as Array<{ medicineName?: string }>)
                                          .map((o) => o.medicineName)
                                          .filter(Boolean)
                                          .join(', ') || '—'
                                      : '—'}
                                  </TableCell>
                                  <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                                    {Array.isArray(d.consumables)
                                      ? (d.consumables as Array<{ medicineName?: string; quantityUsed?: string | null }>)
                                          .map((c) =>
                                            [c.medicineName, c.quantityUsed].filter(Boolean).join(' '),
                                          )
                                          .join(' · ') || '—'
                                      : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SessionDetailSheet
        open={detailOpen}
        onOpenChange={(o) => !o && closeDetail()}
        scheduleDate={scheduleDate}
        scheduleDateLabel={formatIsoDateToApp(scheduleDate)}
        row={detailRow}
        fallbackClinicId={effectiveClinicId ?? undefined}
        planOnly={detailPlanOnly}
        todayStr={todayStr}
        onSetToday={() => setScheduleDate(todayStr)}
        onStatusChange={updateDayStatus}
        updatingDayId={updatingDayId}
        onScheduleRefresh={loadSchedule}
        navigateScheduleToDate={(d) => {
          setScheduleDate(d);
          loadSchedule(d);
        }}
      />
    </div>
  );
};

function PlanCard({
  p,
  muted,
  onOpenDetail,
}: {
  p: Record<string, unknown>;
  muted?: boolean;
  onOpenDetail?: () => void;
}) {
  const total = parseMoney(p.totalCost);
  const advance = parseMoney(p.advancePaid);
  const balance = parseMoney(p.balanceDue);
  const patient = String(p.patientName ?? '');
  const initial = patient.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm transition-shadow',
        muted ? 'border-border/60 bg-muted/20' : 'border-border/80 bg-card shadow-sm hover:shadow-md',
        !muted && 'border-l-[3px] border-l-primary/50',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              muted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
            )}
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0">
          <div className="font-semibold leading-snug">{p.name as string}</div>
          <p className="text-muted-foreground mt-1 text-sm">
            {patient}
            {p.consultationDate
              ? ` · OP ${formatIsoDateToApp(String(p.consultationDate).slice(0, 10))}`
              : ` · from ${formatIsoDateToApp(planStartDateStr(p))}`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatIsoDateToApp(planStartDateStr(p))} – {formatIsoDateToApp(planEndDateStr(p))}
            {p.createdAt && (
              <span className="ml-2">
                · Registered {formatIsoDateToApp(String(p.createdAt).slice(0, 10))}
              </span>
            )}
          </p>
          {preferredSlotLabelFromPlan(p) && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span>Usual session {preferredSlotLabelFromPlan(p)}</span>
            </p>
          )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 sm:flex-row sm:items-center">
          <span className="rounded-md bg-muted/80 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {(p.durationDays as number)} days
          </span>
          {onOpenDetail && (
            <Button
              type="button"
              variant={muted ? 'outline' : 'secondary'}
              size="sm"
              className="h-8 shadow-sm"
              onClick={onOpenDetail}
            >
              {muted ? 'View package' : 'Open panel'}
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-xs tabular-nums">
        <span>
          <span className="text-muted-foreground">Total </span>
          <span className="font-medium text-foreground">{formatInr(total)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Advance </span>
          <span className="font-medium text-foreground">{formatInr(advance)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Balance </span>
          <span className={`font-medium ${balance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
            {formatInr(balance)}
          </span>
        </span>
      </div>
    </div>
  );
}

function SessionDetailSheet({
  open,
  onOpenChange,
  scheduleDate,
  scheduleDateLabel,
  row,
  fallbackClinicId,
  planOnly,
  todayStr,
  onSetToday,
  onStatusChange,
  updatingDayId,
  onScheduleRefresh,
  navigateScheduleToDate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  scheduleDate: string;
  scheduleDateLabel: string;
  row: ScheduleRow | null;
  /** Used if schedule row omits clinicId (older API responses). */
  fallbackClinicId?: string;
  planOnly: Record<string, unknown> | null;
  todayStr: string;
  onSetToday: () => void;
  onStatusChange: (id: string, s: (typeof DAY_STATUS_OPTIONS)[number]) => void;
  updatingDayId: string | null;
  onScheduleRefresh: (dateOverride?: string) => void;
  /** After moving a session to another calendar day, sync the schedule board to that date. */
  navigateScheduleToDate: (isoDate: string) => void;
}) {
  const { toast } = useToast();
  const showPlanOnly = !row && planOnly;
  const clinicIdForLists = row?.clinicId ?? fallbackClinicId ?? '';

  const [therapists, setTherapists] = useState<Array<{ id: string; name: string }>>([]);
  const [rooms, setRooms] = useState<
    Array<{ id: string; roomNumber: string; name?: string | null; isActive: boolean }>
  >([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [therapistId, setTherapistId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  /** Calendar date for this visit (may differ from board date if they came another day). */
  const [sessionPlanDate, setSessionPlanDate] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [savingAlloc, setSavingAlloc] = useState(false);

  const [catalogMedicines, setCatalogMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [sessionOral, setSessionOral] = useState<
    Array<{
      id: string;
      medicineId: string;
      medicineName: string;
      quantityUsed: string | null;
      dosage: string | null;
      frequency: string | null;
      specialInstructions: string | null;
      stockUnitsDeducted?: number;
    }>
  >([]);
  const [sessionConsumables, setSessionConsumables] = useState<
    Array<{
      id: string;
      medicineId: string;
      medicineName: string;
      quantityUsed: string | null;
      notes: string | null;
      stockUnitsDeducted?: number;
    }>
  >([]);
  const [loadingSessionMeds, setLoadingSessionMeds] = useState(false);
  const [oralDraft, setOralDraft] = useState({
    medicineId: '',
    quantityUsed: '',
    dosage: '',
    frequency: '',
    specialInstructions: '',
    stockUnits: '1',
  });
  const [consDraft, setConsDraft] = useState({ medicineId: '', quantityUsed: '', notes: '', stockUnits: '1' });
  const [sessionMedSaving, setSessionMedSaving] = useState(false);
  const [oralMedComboOpen, setOralMedComboOpen] = useState(false);
  const [supplyMedComboOpen, setSupplyMedComboOpen] = useState(false);

  const [planFullDetail, setPlanFullDetail] = useState<Awaited<ReturnType<typeof api.treatmentPlans.get>> | null>(null);
  const [planFullLoading, setPlanFullLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setOralMedComboOpen(false);
      setSupplyMedComboOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !showPlanOnly || !planOnly?.id) {
      setPlanFullDetail(null);
      return;
    }
    const id = String(planOnly.id);
    setPlanFullLoading(true);
    api.treatmentPlans
      .get(id)
      .then(setPlanFullDetail)
      .catch(() => setPlanFullDetail(null))
      .finally(() => setPlanFullLoading(false));
  }, [open, showPlanOnly, planOnly?.id]);

  useEffect(() => {
    if (!open || !clinicIdForLists) return;
    const cid = clinicIdForLists;
    setListsLoading(true);
    Promise.all([
      api.clinicManagement.listTherapists({ clinicId: cid }),
      api.clinicManagement.listRooms({ clinicId: cid }),
    ])
      .then(([t, r]) => {
        setTherapists(t);
        setRooms(r.filter((x) => x.isActive));
      })
      .catch(() => {
        setTherapists([]);
        setRooms([]);
      })
      .finally(() => setListsLoading(false));
  }, [open, row?.planDayId, clinicIdForLists]);

  useEffect(() => {
    if (!open || !row) return;
    if (row.dayStatus === 'NO_SHOW') {
      setSessionOral([]);
      setSessionConsumables([]);
      setLoadingSessionMeds(false);
      return;
    }
    setLoadingSessionMeds(true);
    api.treatmentPlans
      .planDaySessionLines(row.planDayId)
      .then((d) => {
        setSessionOral(d.oral);
        setSessionConsumables(d.consumables);
      })
      .catch(() => {
        setSessionOral([]);
        setSessionConsumables([]);
      })
      .finally(() => setLoadingSessionMeds(false));
  }, [open, row?.planDayId, row?.dayStatus]);

  useEffect(() => {
    if (!open || !row || row.dayStatus === 'NO_SHOW') return;
    api.medicines
      .list()
      .then((rows) =>
        setCatalogMedicines(
          (rows as Record<string, unknown>[]).map((r) => ({ id: String(r.id), name: String(r.name ?? '') })),
        ),
      )
      .catch(() => setCatalogMedicines([]));
  }, [open, row?.planDayId, row?.dayStatus]);

  useEffect(() => {
    if (!row) {
      setSessionPlanDate('');
      setActualStart('');
      setActualEnd('');
      return;
    }
    setTherapistId(row.therapistId ?? '');
    setRoomId(row.roomId ?? '');
    setSessionPlanDate(row.planDate.slice(0, 10));
    if (row.startTime && row.endTime) {
      setStartTime(isoToTimeInput(row.startTime));
      setEndTime(isoToTimeInput(row.endTime));
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
    }
    setActualStart(row.actualStartTime ? isoToTimeInput(row.actualStartTime) : '');
    setActualEnd(row.actualEndTime ? isoToTimeInput(row.actualEndTime) : '');
  }, [row]);

  const handleSaveAllocation = async () => {
    if (!row) return;
    if (!therapistId || !roomId || !startTime || !endTime) {
      toast({
        title: 'Missing fields',
        description: 'Choose therapist, room, booked start and end time.',
        variant: 'destructive',
      });
      return;
    }
    const dateForIso = sessionPlanDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateForIso)) {
      toast({ title: 'Invalid session date', description: 'Pick a valid calendar date.', variant: 'destructive' });
      return;
    }
    const aS = actualStart.trim();
    const aE = actualEnd.trim();
    if ((aS && !aE) || (!aS && aE)) {
      toast({
        title: 'Actual visit time',
        description: 'Enter both actual start and end, or leave both empty to match the booked slot.',
        variant: 'destructive',
      });
      return;
    }
    let startIso: string;
    let endIso: string;
    try {
      startIso = localDateTimeToIso(dateForIso, startTime);
      endIso = localDateTimeToIso(dateForIso, endTime);
    } catch {
      toast({ title: 'Invalid time', description: 'Check booked time values.', variant: 'destructive' });
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast({
        title: 'Invalid time range',
        description: 'Booked end must be after booked start.',
        variant: 'destructive',
      });
      return;
    }
    let actualStartIso: string | null = null;
    let actualEndIso: string | null = null;
    if (aS && aE) {
      try {
        actualStartIso = localDateTimeToIso(dateForIso, aS);
        actualEndIso = localDateTimeToIso(dateForIso, aE);
      } catch {
        toast({ title: 'Invalid time', description: 'Check actual visit times.', variant: 'destructive' });
        return;
      }
      if (new Date(actualEndIso) <= new Date(actualStartIso)) {
        toast({
          title: 'Invalid actual range',
          description: 'Actual end must be after actual start.',
          variant: 'destructive',
        });
        return;
      }
    }
    setSavingAlloc(true);
    try {
      const movedDate = dateForIso !== row.planDate.slice(0, 10);
      if (movedDate) {
        await api.treatmentPlans.patchPlanDay(row.planDayId, { planDate: dateForIso });
      }
      const body: Record<string, unknown> = {
        patientId: row.patientId,
        treatmentPlanId: row.treatmentPlanId,
        planDayId: row.planDayId,
        therapistId,
        roomId,
        startTime: startIso,
        endTime: endIso,
        actualStartTime: actualStartIso,
        actualEndTime: actualEndIso,
      };
      if (row.appointmentId) {
        await api.clinicManagement.updateAppointment(row.appointmentId, body);
      } else {
        await api.clinicManagement.createAppointment(body);
      }
      toast({
        title: 'Session setup saved',
        description: 'Booked slot, optional actual visit time, therapist, and room are saved.',
      });
      if (movedDate) {
        navigateScheduleToDate(dateForIso);
      } else {
        onScheduleRefresh();
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not save';
      toast({
        title: 'Could not save session setup',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSavingAlloc(false);
    }
  };

  const reloadSessionLines = async () => {
    if (!row) return;
    if (!open) return;
    setLoadingSessionMeds(true);
    try {
      const d = await api.treatmentPlans.planDaySessionLines(row.planDayId);
      setSessionOral(d.oral);
      setSessionConsumables(d.consumables);
    } catch {
      setSessionOral([]);
      setSessionConsumables([]);
    } finally {
      setLoadingSessionMeds(false);
    }
  };

  const handleAddOral = async () => {
    if (!row || !oralDraft.medicineId) {
      toast({ title: 'Pick a medicine', variant: 'destructive' });
      return;
    }
    setSessionMedSaving(true);
    try {
      const su = parseInt(oralDraft.stockUnits, 10);
      await api.treatmentPlans.addPlanDayOralMedicine(row.planDayId, {
        medicineId: oralDraft.medicineId,
        quantityUsed: oralDraft.quantityUsed.trim() || undefined,
        dosage: oralDraft.dosage.trim() || undefined,
        frequency: oralDraft.frequency.trim() || undefined,
        specialInstructions: oralDraft.specialInstructions.trim() || undefined,
        stockUnits: Number.isFinite(su) ? su : undefined,
      });
      setOralDraft({
        medicineId: '',
        quantityUsed: '',
        dosage: '',
        frequency: '',
        specialInstructions: '',
        stockUnits: '1',
      });
      await reloadSessionLines();
      toast({ title: 'Medicine added for this session' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Failed';
      toast({
        title: 'Could not add',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSessionMedSaving(false);
    }
  };

  const handleAddCons = async () => {
    if (!row || !consDraft.medicineId) {
      toast({ title: 'Pick an item', variant: 'destructive' });
      return;
    }
    setSessionMedSaving(true);
    try {
      const su = parseInt(consDraft.stockUnits, 10);
      await api.treatmentPlans.addPlanDayConsumable(row.planDayId, {
        medicineId: consDraft.medicineId,
        quantityUsed: consDraft.quantityUsed.trim() || undefined,
        notes: consDraft.notes.trim() || undefined,
        stockUnits: Number.isFinite(su) ? su : undefined,
      });
      setConsDraft({ medicineId: '', quantityUsed: '', notes: '', stockUnits: '1' });
      await reloadSessionLines();
      toast({ title: 'Supply line added' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Failed';
      toast({
        title: 'Could not add',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSessionMedSaving(false);
    }
  };

  const handleDeleteOral = async (lineId: string) => {
    if (!row) return;
    setSessionMedSaving(true);
    try {
      await api.treatmentPlans.deletePlanDayOralMedicine(row.planDayId, lineId);
      await reloadSessionLines();
    } catch (e) {
      toast({
        title: 'Could not remove',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSessionMedSaving(false);
    }
  };

  const handleDeleteCons = async (lineId: string) => {
    if (!row) return;
    setSessionMedSaving(true);
    try {
      await api.treatmentPlans.deletePlanDayConsumable(row.planDayId, lineId);
      await reloadSessionLines();
    } catch (e) {
      toast({
        title: 'Could not remove',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSessionMedSaving(false);
    }
  };

  const patientInitial = (row?.patientName ?? '').trim().charAt(0).toUpperCase() || '?';
  let allocatedTimeLabel: string | null = null;
  if (row?.startTime && row?.endTime) {
    try {
      allocatedTimeLabel = `${formatAppTime(parseISO(row.startTime))} – ${formatAppTime(parseISO(row.endTime))}`;
    } catch {
      allocatedTimeLabel = null;
    }
  }
  const actualVisitBadgeLabel = row ? actualSlotLabel(row.actualStartTime, row.actualEndTime) : null;
  const sessionLineCount = sessionOral.length + sessionConsumables.length;
  const preferredSlot = row ? preferredSlotLabelFromRow(row) : null;
  const planOnlyPatientInitial = showPlanOnly && planOnly
    ? String(planOnly.patientName ?? '').trim().charAt(0).toUpperCase() || '?'
    : '?';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-[100dvh] w-full flex-col gap-0 border-l bg-background p-0 sm:max-w-2xl"
      >
        {row && (
          <>
            <div className="relative shrink-0 border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-background to-background px-5 pb-5 pt-6 pr-14">
              <div className="flex gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md"
                  aria-hidden
                >
                  {patientInitial}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <SheetHeader className="space-y-1 p-0 text-left">
                    <SheetTitle className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                      {row.patientName}
                    </SheetTitle>
                    <SheetDescription className="text-sm leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground/90">{row.planName}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        · Day {row.dayNumber} · {formatIsoDateToApp(sessionPlanDate || row.planDate)}
                      </span>
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={row.dayStatus === 'COMPLETED' ? 'default' : 'secondary'}
                      className="rounded-md font-normal"
                    >
                      {statusLabel(row.dayStatus)}
                    </Badge>
                    {allocatedTimeLabel && (
                      <Badge variant="outline" className="gap-1 rounded-md font-normal tabular-nums">
                        <Clock className="h-3 w-3 opacity-70" aria-hidden />
                        Booked {allocatedTimeLabel}
                      </Badge>
                    )}
                    {actualVisitBadgeLabel && (
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-md border border-amber-500/30 bg-amber-500/[0.12] font-normal tabular-nums text-amber-950 dark:text-amber-100"
                      >
                        <Clock className="h-3 w-3 opacity-80" aria-hidden />
                        Actual {actualVisitBadgeLabel}
                      </Badge>
                    )}
                    {preferredSlot && !allocatedTimeLabel && (
                      <Badge variant="outline" className="gap-1 rounded-md font-normal">
                        <Clock className="h-3 w-3 opacity-70" aria-hidden />
                        Usual {preferredSlot}
                      </Badge>
                    )}
                  </div>
                  <a
                    href={`tel:${row.patientMobile.replace(/\s/g, '')}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg bg-background/80 px-2.5 py-1.5 text-sm text-foreground ring-1 ring-border/60 transition-colors hover:bg-muted/50"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="truncate tabular-nums">{row.patientMobile}</span>
                  </a>
                </div>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 px-5 py-5 pb-10">
                <section
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
                  aria-labelledby="sess-step-status"
                >
                  <div className="flex items-center gap-3 border-b border-border/50 bg-muted/25 px-4 py-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm"
                      aria-hidden
                    >
                      1
                    </span>
                    <div className="min-w-0">
                      <h3 id="sess-step-status" className="text-sm font-semibold text-foreground">
                        Session status
                      </h3>
                      <p className="text-xs text-muted-foreground">Update when the patient arrives or the session ends.</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <Label htmlFor="sess-status" className="text-xs text-muted-foreground">
                      Current status
                    </Label>
                    <Select
                      value={row.dayStatus}
                      disabled={updatingDayId === row.planDayId}
                      onValueChange={(v) => onStatusChange(row.planDayId, v as (typeof DAY_STATUS_OPTIONS)[number])}
                    >
                      <SelectTrigger
                        id="sess-status"
                        className={cn('h-11', dayStatusSelectTriggerClass(row.dayStatus))}
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {statusLabel(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updatingDayId === row.planDayId && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                      </p>
                    )}
                  </div>
                </section>

                <section
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
                  aria-labelledby="sess-step-setup"
                >
                  <div className="flex items-center gap-3 border-b border-border/50 bg-muted/25 px-4 py-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm"
                      aria-hidden
                    >
                      2
                    </span>
                    <div className="min-w-0">
                      <h3 id="sess-step-setup" className="text-sm font-semibold text-foreground">
                        Date, therapist, room &amp; times
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Set the calendar day for this visit (if they came on a different day), booked slot, and optional
                        actual arrival window when early or late.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="sess-plan-date" className="text-xs font-medium">
                        Session date
                      </Label>
                      <Input
                        id="sess-plan-date"
                        type="date"
                        value={sessionPlanDate}
                        onChange={(e) => setSessionPlanDate(e.target.value)}
                        disabled={savingAlloc}
                        className="h-11 max-w-[220px]"
                      />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Must fall within the package dates. If the patient comes on another day, change this so they
                        appear on the right schedule board.
                      </p>
                    </div>
                    {preferredSlot && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 text-xs text-muted-foreground dark:bg-primary/10">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>
                          <span className="font-medium text-foreground">Patient&apos;s usual time: </span>
                          {preferredSlot}
                        </span>
                      </div>
                    )}
                    {!clinicIdForLists && (
                      <Alert className="border-amber-500/40 bg-amber-500/[0.06] py-3 dark:bg-amber-950/20">
                        <Info className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                        <AlertTitle className="text-sm">Clinic not loaded</AlertTitle>
                        <AlertDescription className="text-xs leading-relaxed">
                          Reload the page or select a clinic in the header so therapist and room lists can load.
                        </AlertDescription>
                      </Alert>
                    )}
                    {listsLoading && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading therapists and rooms…
                      </p>
                    )}
                    {!listsLoading && clinicIdForLists && therapists.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        No therapists yet. Add them under <strong className="text-foreground">Therapists &amp; Rooms</strong>.
                      </p>
                    )}
                    {!listsLoading && clinicIdForLists && rooms.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        No active rooms. Add or activate rooms under{' '}
                        <strong className="text-foreground">Therapists &amp; Rooms</strong>.
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sess-therapist" className="flex items-center gap-1.5 text-xs font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          Therapist
                        </Label>
                        <Select
                          value={therapistId || undefined}
                          onValueChange={setTherapistId}
                          disabled={listsLoading || savingAlloc || !clinicIdForLists}
                        >
                          <SelectTrigger id="sess-therapist" className="h-11">
                            <SelectValue placeholder="Choose therapist" />
                          </SelectTrigger>
                          <SelectContent>
                            {therapists.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sess-room" className="flex items-center gap-1.5 text-xs font-medium">
                          <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          Room
                        </Label>
                        <Select
                          value={roomId || undefined}
                          onValueChange={setRoomId}
                          disabled={listsLoading || savingAlloc || !clinicIdForLists}
                        >
                          <SelectTrigger id="sess-room" className="h-11">
                            <SelectValue placeholder="Choose room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.roomNumber}
                                {r.name ? ` · ${r.name}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="sess-start" className="text-xs font-medium">
                          Booked start
                        </Label>
                        <Input
                          id="sess-start"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={savingAlloc}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sess-end" className="text-xs font-medium">
                          Booked end
                        </Label>
                        <Input
                          id="sess-end"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={savingAlloc}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-3 py-3">
                      <p className="mb-2 text-xs font-medium text-foreground">Actual visit (optional)</p>
                      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                        If they arrived early or late, record the real time window. Leave empty when actual matches the
                        booked slot.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="sess-actual-start" className="text-xs font-medium text-muted-foreground">
                            Actual start
                          </Label>
                          <Input
                            id="sess-actual-start"
                            type="time"
                            value={actualStart}
                            onChange={(e) => setActualStart(e.target.value)}
                            disabled={savingAlloc}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sess-actual-end" className="text-xs font-medium text-muted-foreground">
                            Actual end
                          </Label>
                          <Input
                            id="sess-actual-end"
                            type="time"
                            value={actualEnd}
                            onChange={(e) => setActualEnd(e.target.value)}
                            disabled={savingAlloc}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="w-full gap-2 font-medium shadow-sm"
                      onClick={handleSaveAllocation}
                      disabled={listsLoading || savingAlloc || !therapistId || !roomId || !clinicIdForLists}
                    >
                      {savingAlloc ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <ClipboardList className="h-4 w-4 opacity-90" aria-hidden />
                          Save session setup
                        </>
                      )}
                    </Button>
                    <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                      Oral medicines and supplies can be added in step 3 anytime. Mark <strong className="text-foreground">Done</strong>{' '}
                      when therapy is finished.
                    </p>
                  </div>
                </section>

                {row.dayStatus === 'NO_SHOW' ? (
                  <Alert className="rounded-2xl border-destructive/30 bg-destructive/[0.06]">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm">No-show</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Usage lines are not recorded for no-shows. Change status above if the patient did attend.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <section
                    className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
                    aria-labelledby="sess-step-meds"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/25 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm"
                          aria-hidden
                        >
                          3
                        </span>
                        <div className="min-w-0">
                          <h3 id="sess-step-meds" className="text-sm font-semibold text-foreground">
                            Medicines &amp; supplies
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            This day only — saves on add. Clinic stock (FIFO) drops by the &quot;Stock units&quot; you enter
                            (0 = record only). Used units show in the table below.
                          </p>
                        </div>
                      </div>
                      {!loadingSessionMeds && sessionLineCount > 0 && (
                        <Badge variant="secondary" className="shrink-0 rounded-md font-normal">
                          {sessionOral.length} oral · {sessionConsumables.length} supply
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-4 p-4">
                      {loadingSessionMeds && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading lines…
                        </p>
                      )}
                      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                              <TableHead className="w-[76px] whitespace-nowrap pl-4 text-xs font-semibold">Type</TableHead>
                              <TableHead className="min-w-[120px] text-xs font-semibold">Item</TableHead>
                              <TableHead
                                className="w-[110px] whitespace-nowrap text-xs font-semibold"
                                title="Amount recorded for this session (free text)"
                              >
                                Session qty
                              </TableHead>
                              <TableHead
                                className="w-[104px] whitespace-nowrap text-xs font-semibold"
                                title="Units removed from clinic inventory (FIFO batches)"
                              >
                                Stock used
                              </TableHead>
                              <TableHead className="min-w-[140px] text-xs font-semibold">Details</TableHead>
                              <TableHead className="w-12 p-2 pr-4 text-right text-xs font-semibold"> </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!loadingSessionMeds && sessionLineCount === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center">
                                  <div className="mx-auto flex max-w-[260px] flex-col items-center gap-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                      <Pill className="h-5 w-5 opacity-80" aria-hidden />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">Nothing recorded yet</p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                      Add oral medicines and session supplies below. Set stock units to deduct inventory,
                                      or 0 to log usage only.
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                            {sessionOral.map((m) => {
                              const stock = sessionStockUnitsUsed(m.stockUnitsDeducted);
                              return (
                                <TableRow
                                  key={`oral-${m.id}`}
                                  className="border-border/50 transition-colors hover:bg-muted/25"
                                >
                                  <TableCell className="py-3 pl-4 align-middle">
                                    <Badge variant="secondary" className="font-normal text-[10px]">
                                      Oral
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 align-middle">
                                    <span className="font-medium text-foreground">{m.medicineName}</span>
                                  </TableCell>
                                  <TableCell className="py-3 align-middle text-sm tabular-nums text-muted-foreground">
                                    {m.quantityUsed?.trim() || '—'}
                                  </TableCell>
                                  <TableCell className="py-3 align-middle">
                                    {stock > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-900 dark:text-emerald-100">
                                        {stock}
                                        <span className="text-[10px] font-normal opacity-80">units</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground" title="No inventory deduction">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-[220px] py-3 align-middle text-xs leading-snug text-muted-foreground">
                                    {[m.dosage, m.frequency, m.specialInstructions].filter(Boolean).join(' · ') || '—'}
                                  </TableCell>
                                  <TableCell className="py-3 pr-4 text-right align-middle">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      disabled={sessionMedSaving}
                                      onClick={() => handleDeleteOral(m.id)}
                                      aria-label="Remove oral line"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {sessionConsumables.map((c) => {
                              const stock = sessionStockUnitsUsed(c.stockUnitsDeducted);
                              return (
                                <TableRow
                                  key={`sup-${c.id}`}
                                  className="border-border/50 transition-colors hover:bg-muted/25"
                                >
                                  <TableCell className="py-3 pl-4 align-middle">
                                    <Badge variant="outline" className="font-normal text-[10px]">
                                      Supply
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 align-middle">
                                    <span className="font-medium text-foreground">{c.medicineName}</span>
                                  </TableCell>
                                  <TableCell className="py-3 align-middle text-sm tabular-nums text-muted-foreground">
                                    {c.quantityUsed?.trim() || '—'}
                                  </TableCell>
                                  <TableCell className="py-3 align-middle">
                                    {stock > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-900 dark:text-emerald-100">
                                        {stock}
                                        <span className="text-[10px] font-normal opacity-80">units</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground" title="No inventory deduction">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-[220px] py-3 align-middle text-xs leading-snug text-muted-foreground">
                                    {c.notes?.trim() || '—'}
                                  </TableCell>
                                  <TableCell className="py-3 pr-4 text-right align-middle">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      disabled={sessionMedSaving}
                                      onClick={() => handleDeleteCons(c.id)}
                                      aria-label="Remove supply line"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3 rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] p-4 dark:bg-primary/[0.06]">
                          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Pill className="h-3.5 w-3.5 text-primary" aria-hidden />
                            Add oral medicine
                          </p>
                          <SessionMedicineCombobox
                            medicines={catalogMedicines}
                            valueId={oralDraft.medicineId}
                            onSelectId={(id) => setOralDraft((d) => ({ ...d, medicineId: id }))}
                            placeholder="Select medicine"
                            emptyLabel="No medicines in catalog"
                            disabled={sessionMedSaving}
                            open={oralMedComboOpen}
                            onOpenChange={setOralMedComboOpen}
                            searchPlaceholder="Search medicine…"
                          />
                          <Input
                            placeholder="Amount this session (e.g. 2 tabs, 10 ml)"
                            value={oralDraft.quantityUsed}
                            onChange={(e) => setOralDraft((d) => ({ ...d, quantityUsed: e.target.value }))}
                            className="h-10"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Dosage"
                              value={oralDraft.dosage}
                              onChange={(e) => setOralDraft((d) => ({ ...d, dosage: e.target.value }))}
                              className="h-10"
                            />
                            <Input
                              placeholder="Frequency"
                              value={oralDraft.frequency}
                              onChange={(e) => setOralDraft((d) => ({ ...d, frequency: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <Input
                            placeholder="Instructions (e.g. after food)"
                            value={oralDraft.specialInstructions}
                            onChange={(e) => setOralDraft((d) => ({ ...d, specialInstructions: e.target.value }))}
                            className="h-10"
                          />
                          <div className="space-y-1.5">
                            <Label htmlFor="oral-stock-units" className="text-xs text-muted-foreground">
                              Stock units to deduct at this clinic
                            </Label>
                            <Input
                              id="oral-stock-units"
                              type="number"
                              min={0}
                              max={9999}
                              inputMode="numeric"
                              value={oralDraft.stockUnits}
                              onChange={(e) => setOralDraft((d) => ({ ...d, stockUnits: e.target.value }))}
                              className="h-10"
                            />
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              0 = record line only (no inventory change). Requires batches under Inventory for this medicine.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-1.5"
                            disabled={sessionMedSaving || !oralDraft.medicineId}
                            onClick={handleAddOral}
                          >
                            <Plus className="h-4 w-4" /> Add oral line
                          </Button>
                        </div>

                        <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            Add session supply
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            Oils, powders, or other stock used during therapy (not the oral list above).
                          </p>
                          <SessionMedicineCombobox
                            medicines={catalogMedicines}
                            valueId={consDraft.medicineId}
                            onSelectId={(id) => setConsDraft((d) => ({ ...d, medicineId: id }))}
                            placeholder="Select stock item"
                            emptyLabel="No stock items in catalog"
                            disabled={sessionMedSaving}
                            open={supplyMedComboOpen}
                            onOpenChange={setSupplyMedComboOpen}
                            searchPlaceholder="Search item…"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Quantity (e.g. 50 ml)"
                              value={consDraft.quantityUsed}
                              onChange={(e) => setConsDraft((d) => ({ ...d, quantityUsed: e.target.value }))}
                              className="h-10"
                            />
                            <Input
                              placeholder="Notes"
                              value={consDraft.notes}
                              onChange={(e) => setConsDraft((d) => ({ ...d, notes: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="supply-stock-units" className="text-xs text-muted-foreground">
                              Stock units to deduct at this clinic
                            </Label>
                            <Input
                              id="supply-stock-units"
                              type="number"
                              min={0}
                              max={9999}
                              inputMode="numeric"
                              value={consDraft.stockUnits}
                              onChange={(e) => setConsDraft((d) => ({ ...d, stockUnits: e.target.value }))}
                              className="h-10"
                            />
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              0 = record only. Same FIFO rules as oral lines.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-1.5"
                            disabled={sessionMedSaving || !consDraft.medicineId}
                            onClick={handleAddCons}
                          >
                            <Plus className="h-4 w-4" /> Add supply line
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {row.dayNotes && (
                  <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day notes</h4>
                    <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{row.dayNotes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {showPlanOnly && planOnly && (
          <>
            <div className="relative shrink-0 border-b border-border/60 bg-gradient-to-br from-muted/80 via-background to-background px-5 pb-5 pt-6 pr-14">
              <div className="flex gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-foreground shadow-inner ring-1 ring-border/60"
                  aria-hidden
                >
                  {planOnlyPatientInitial}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <SheetHeader className="space-y-1 p-0 text-left">
                    <SheetTitle className="text-xl font-semibold tracking-tight">{planOnly.patientName as string}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">{planOnly.name as string}</SheetDescription>
                  </SheetHeader>
                  <Badge variant="outline" className="mt-2 rounded-md font-normal">
                    Package overview · {scheduleDateLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 px-5 py-5 pb-10 text-sm">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-4 dark:bg-amber-950/25">
                <p className="font-medium text-foreground">No session on this date</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  There is no plan-day row for <strong>{scheduleDateLabel}</strong>. The package may not include this
                  calendar day, or plan days are still being generated.
                </p>
                {scheduleDate !== todayStr && (
                  <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onSetToday}>
                    Jump to today&apos;s schedule
                  </Button>
                )}
              </div>

              {planFullLoading && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading plan details…
                </p>
              )}

              {!planFullLoading && planFullDetail?.medicineDataNote && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm">How medicines are stored</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">{planFullDetail.medicineDataNote}</AlertDescription>
                </Alert>
              )}

              {planFullDetail?.sessionMedicineSummary && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Across all days (session lines)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border bg-muted/30 px-2 py-2 text-center">
                      <div className="text-lg font-semibold tabular-nums">{planFullDetail.sessionMedicineSummary.oralLineCount}</div>
                      <div className="text-[10px] text-muted-foreground">Oral lines</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-2 py-2 text-center">
                      <div className="text-lg font-semibold tabular-nums">
                        {planFullDetail.sessionMedicineSummary.consumableLineCount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Supplies</div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 px-2 py-2 text-center">
                      <div className="text-xs font-semibold tabular-nums leading-tight">
                        ₹{planFullDetail.sessionMedicineSummary.estimatedRetailTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Est. retail</div>
                    </div>
                  </div>
                </div>
              )}

              {planFullDetail &&
                Array.isArray(planFullDetail.medicines) &&
                (planFullDetail.medicines as unknown[]).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Legacy plan-level medicines</p>
                    <ul className="space-y-1.5 text-xs">
                      {(planFullDetail.medicines as Array<Record<string, unknown>>).map((m, i) => (
                        <li key={i} className="rounded-md border border-border/60 bg-card px-2 py-1.5">
                          <span className="font-medium">{String(m.medicineName ?? '')}</span>
                          {[m.dosage, m.frequency].filter(Boolean).length > 0 && (
                            <span className="text-muted-foreground">
                              {' '}
                              · {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {m.durationDays != null && (
                            <span className="text-muted-foreground"> · {String(m.durationDays)} days</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {planFullDetail &&
                Array.isArray(planFullDetail.consumables) &&
                (planFullDetail.consumables as unknown[]).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Legacy plan-level supplies</p>
                    <ul className="space-y-1.5 text-xs">
                      {(planFullDetail.consumables as Array<Record<string, unknown>>).map((c, i) => (
                        <li key={i} className="rounded-md border border-border/60 bg-card px-2 py-1.5">
                          <span className="font-medium">{String(c.medicineName ?? '')}</span>
                          {c.quantityUsed != null && c.quantityUsed !== '' && (
                            <span className="text-muted-foreground"> · {String(c.quantityUsed)}</span>
                          )}
                          {c.notes != null && c.notes !== '' && (
                            <span className="text-muted-foreground"> · {String(c.notes)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <Separator className="opacity-60" />
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Package</p>
                <div className="grid gap-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Period</span>
                    <span className="text-right font-medium">
                      {formatIsoDateToApp(planStartDateStr(planOnly))} – {formatIsoDateToApp(planEndDateStr(planOnly))}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total</span>
                    <span className="tabular-nums font-medium">{formatInr(parseMoney(planOnly.totalCost))}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="tabular-nums font-medium text-amber-800 dark:text-amber-300">
                      {formatInr(parseMoney(planOnly.balanceDue))}
                    </span>
                  </div>
                </div>
              </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TreatmentPlansPage;

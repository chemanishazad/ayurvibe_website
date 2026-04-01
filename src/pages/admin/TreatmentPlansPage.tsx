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
import { api, ApiError } from '@/lib/api';
import { formatAppTime, formatHhmmToAmPm, formatIsoDateToApp } from '@/lib/datetime';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  ListChecks,
  Loader2,
  Plus,
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

type ScheduleRow = Awaited<ReturnType<typeof api.treatmentPlans.schedule>>['rows'][number];

const DAY_STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'NO_SHOW'] as const;

function statusLabel(s: string): string {
  if (s === 'COMPLETED') return 'Done';
  if (s === 'NO_SHOW') return 'No-show';
  return 'Pending';
}

const TreatmentPlansPage = () => {
  const { effectiveClinicId, isAdmin } = useAdminClinic();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [updatingDayId, setUpdatingDayId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<ScheduleRow | null>(null);
  const [detailPlanOnly, setDetailPlanOnly] = useState<Record<string, unknown> | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
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

  const loadSchedule = useCallback(() => {
    if (!effectiveClinicId) return;
    setScheduleLoading(true);
    api.treatmentPlans
      .schedule({ clinicId: effectiveClinicId, date: scheduleDate })
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
  }, [effectiveClinicId, scheduleDate]);

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

  return (
    <div className="space-y-6 w-full max-w-[1400px]">
      <PageHeader
        title="Treatment plans"
        description="Today’s sessions at the top — use the left panel for current patients. Tap a row to assign therapist, room, and time."
      >
        <Button asChild className="gap-2">
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
                  <CardTitle className="text-xl font-semibold tracking-tight">Today’s treatments</CardTitle>
                  <CardDescription className="mt-1">
                    {isViewingToday
                      ? 'Sessions scheduled for today. Mark done as each finishes — progress is summarised in the left panel.'
                      : `Viewing ${formatIsoDateToApp(scheduleDate)}. Pick a date or use Today for the live board.`}
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
            <p className="py-12 px-4 text-center text-sm text-muted-foreground">
              No sessions on {formatIsoDateToApp(scheduleDate)}. Plans may not include this day, or none exist for this
              clinic.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[200px]">Patient</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="whitespace-nowrap">Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleRows.map((row) => {
                    const timeLabel =
                      row.startTime && row.endTime
                        ? `${formatAppTime(parseISO(row.startTime))} – ${formatAppTime(parseISO(row.endTime))}`
                        : null;
                    const usualSlot = preferredSlotLabelFromRow(row);
                    return (
                      <TableRow
                        key={row.planDayId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openSessionDetail(row)}
                      >
                        <TableCell>
                          <div className="font-medium">{row.patientName}</div>
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
                        <TableCell className="whitespace-nowrap">
                          {timeLabel ? (
                            <span className="inline-flex items-center gap-1 tabular-nums text-sm">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              {timeLabel}
                            </span>
                          ) : usualSlot ? (
                            <span className="inline-flex items-center gap-1 tabular-nums text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                Usual <span className="text-foreground">{usualSlot}</span>
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not scheduled</span>
                          )}
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
                              <SelectTrigger className="h-8 w-[130px] text-xs">
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
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => openSessionDetail(row)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
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
              <CardDescription className="text-xs">
                Active packages (end date ≥ today). Tap to open full details for the selected schedule date.
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
                  <p className="px-2 py-6 text-sm text-muted-foreground text-center">No current plans.</p>
                ) : (
                  <ul className="space-y-1">
                    {ongoingPlans.map((p) => {
                      const pid = p.id as string;
                      const row = scheduleRowByPlanId.get(pid);
                      const balance = parseMoney(p.balanceDue);
                      return (
                        <li key={pid}>
                          <button
                            type="button"
                            onClick={() => openPlanFromSidebar(p)}
                            className="flex w-full items-start gap-2 rounded-lg border border-transparent px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-muted/80 hover:border-border/80"
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

        <div className="min-w-0 flex-1 space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight">Ongoing plans</h2>
              <Badge variant="secondary">{ongoingPlans.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Same patients as in the left panel — full totals and dates here.
            </p>
            {ongoingPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No ongoing plans for this clinic.</p>
            ) : (
              <div className="space-y-2">
                {ongoingPlans.map((p) => (
                  <PlanCard
                    key={p.id as string}
                    p={p}
                    onOpenDetail={() => openPlanFromSidebar(p)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <h2 className="text-base font-semibold tracking-tight text-muted-foreground">Completed plans</h2>
              <Badge variant="outline">{completedPlans.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Ended before today — history.</p>
            {completedPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No completed plans yet.</p>
            ) : (
              <div className="space-y-2 opacity-90">
                {completedPlans.map((p) => (
                  <PlanCard key={p.id as string} p={p} muted />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <SessionDetailSheet
        open={detailOpen}
        onOpenChange={(o) => !o && closeDetail()}
        scheduleDate={scheduleDate}
        scheduleDateLabel={formatIsoDateToApp(scheduleDate)}
        row={detailRow}
        planOnly={detailPlanOnly}
        todayStr={todayStr}
        onSetToday={() => setScheduleDate(todayStr)}
        onStatusChange={updateDayStatus}
        updatingDayId={updatingDayId}
        onScheduleRefresh={loadSchedule}
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
  return (
    <div
      className={`rounded-lg border p-4 text-sm ${muted ? 'border-border/60 bg-muted/20' : 'border-border/80 bg-card shadow-sm'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{p.name as string}</div>
          <p className="text-muted-foreground mt-1">
            {(p.patientName as string)}
            {p.consultationDate
              ? ` · OP ${formatIsoDateToApp(String(p.consultationDate).slice(0, 10))}`
              : ` · from ${formatIsoDateToApp(planStartDateStr(p))}`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatIsoDateToApp(planStartDateStr(p))} – {formatIsoDateToApp(planEndDateStr(p))}
          </p>
          {preferredSlotLabelFromPlan(p) && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span>Usual session {preferredSlotLabelFromPlan(p)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground">{(p.durationDays as number)} days</span>
          {onOpenDetail && !muted && (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={onOpenDetail}>
              Details
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
  planOnly,
  todayStr,
  onSetToday,
  onStatusChange,
  updatingDayId,
  onScheduleRefresh,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  scheduleDate: string;
  scheduleDateLabel: string;
  row: ScheduleRow | null;
  planOnly: Record<string, unknown> | null;
  todayStr: string;
  onSetToday: () => void;
  onStatusChange: (id: string, s: (typeof DAY_STATUS_OPTIONS)[number]) => void;
  updatingDayId: string | null;
  onScheduleRefresh: () => void;
}) {
  const { toast } = useToast();
  const showPlanOnly = !row && planOnly;

  const [therapists, setTherapists] = useState<Array<{ id: string; name: string }>>([]);
  const [rooms, setRooms] = useState<Array<{ id: string; roomNumber: string; isActive: boolean }>>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [therapistId, setTherapistId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [savingAlloc, setSavingAlloc] = useState(false);

  const [catalogMedicines, setCatalogMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [sessionOral, setSessionOral] = useState<
    Array<{
      id: string;
      medicineId: string;
      medicineName: string;
      dosage: string | null;
      frequency: string | null;
      specialInstructions: string | null;
    }>
  >([]);
  const [sessionConsumables, setSessionConsumables] = useState<
    Array<{ id: string; medicineId: string; medicineName: string; quantityUsed: string | null; notes: string | null }>
  >([]);
  const [loadingSessionMeds, setLoadingSessionMeds] = useState(false);
  const [oralDraft, setOralDraft] = useState({ medicineId: '', dosage: '', frequency: '', specialInstructions: '' });
  const [consDraft, setConsDraft] = useState({ medicineId: '', quantityUsed: '', notes: '' });
  const [sessionMedSaving, setSessionMedSaving] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setListsLoading(true);
    Promise.all([api.clinicManagement.listTherapists(), api.clinicManagement.listRooms()])
      .then(([t, r]) => {
        setTherapists(t);
        setRooms(r.filter((x) => x.isActive));
      })
      .catch(() => {
        setTherapists([]);
        setRooms([]);
      })
      .finally(() => setListsLoading(false));
  }, [open, row?.planDayId]);

  useEffect(() => {
    if (!open || !row) return;
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
  }, [open, row?.planDayId]);

  useEffect(() => {
    if (!open || !row) return;
    api.medicines
      .list()
      .then((rows) =>
        setCatalogMedicines(
          (rows as Record<string, unknown>[]).map((r) => ({ id: String(r.id), name: String(r.name ?? '') })),
        ),
      )
      .catch(() => setCatalogMedicines([]));
  }, [open, row?.planDayId]);

  useEffect(() => {
    if (!row) return;
    setTherapistId(row.therapistId ?? '');
    setRoomId(row.roomId ?? '');
    if (row.startTime && row.endTime) {
      setStartTime(isoToTimeInput(row.startTime));
      setEndTime(isoToTimeInput(row.endTime));
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
    }
  }, [row]);

  const handleSaveAllocation = async () => {
    if (!row) return;
    if (!therapistId || !roomId || !startTime || !endTime) {
      toast({
        title: 'Missing fields',
        description: 'Choose therapist, room, start and end time.',
        variant: 'destructive',
      });
      return;
    }
    let startIso: string;
    let endIso: string;
    try {
      startIso = localDateTimeToIso(row.planDate, startTime);
      endIso = localDateTimeToIso(row.planDate, endTime);
    } catch {
      toast({ title: 'Invalid time', description: 'Check time values.', variant: 'destructive' });
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
      return;
    }
    const body = {
      patientId: row.patientId,
      treatmentPlanId: row.treatmentPlanId,
      planDayId: row.planDayId,
      therapistId,
      roomId,
      startTime: startIso,
      endTime: endIso,
    };
    setSavingAlloc(true);
    try {
      if (row.appointmentId) {
        await api.clinicManagement.updateAppointment(row.appointmentId, body);
      } else {
        await api.clinicManagement.createAppointment(body);
      }
      toast({ title: 'Schedule saved', description: 'Therapist, room, and time updated.' });
      onScheduleRefresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not save';
      toast({
        title: 'Could not save schedule',
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
      await api.treatmentPlans.addPlanDayOralMedicine(row.planDayId, {
        medicineId: oralDraft.medicineId,
        dosage: oralDraft.dosage.trim() || undefined,
        frequency: oralDraft.frequency.trim() || undefined,
        specialInstructions: oralDraft.specialInstructions.trim() || undefined,
      });
      setOralDraft({ medicineId: '', dosage: '', frequency: '', specialInstructions: '' });
      await reloadSessionLines();
      toast({ title: 'Medicine added for this session' });
    } catch (e) {
      toast({
        title: 'Could not add',
        description: e instanceof Error ? e.message : 'Failed',
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
      await api.treatmentPlans.addPlanDayConsumable(row.planDayId, {
        medicineId: consDraft.medicineId,
        quantityUsed: consDraft.quantityUsed.trim() || undefined,
        notes: consDraft.notes.trim() || undefined,
      });
      setConsDraft({ medicineId: '', quantityUsed: '', notes: '' });
      await reloadSessionLines();
      toast({ title: 'Supply line added' });
    } catch (e) {
      toast({
        title: 'Could not add',
        description: e instanceof Error ? e.message : 'Failed',
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8">{row.patientName}</SheetTitle>
              <SheetDescription>
                {row.planName} · Day {row.dayNumber} · {scheduleDateLabel}
              </SheetDescription>
            </SheetHeader>
            {preferredSlotLabelFromRow(row) && (
              <p className="mt-4 text-xs text-muted-foreground rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <span className="font-medium text-foreground">Usual session (from plan): </span>
                {preferredSlotLabelFromRow(row)}
              </p>
            )}
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Session status</span>
                  <Badge variant={row.dayStatus === 'COMPLETED' ? 'default' : 'secondary'}>{statusLabel(row.dayStatus)}</Badge>
                </div>
                <Select
                  value={row.dayStatus}
                  disabled={updatingDayId === row.planDayId}
                  onValueChange={(v) => onStatusChange(row.planDayId, v as (typeof DAY_STATUS_OPTIONS)[number])}
                >
                  <SelectTrigger className="h-10">
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
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Who & when</h4>
                {listsLoading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading therapists and rooms…
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sess-therapist">Therapist</Label>
                  <Select
                    value={therapistId || undefined}
                    onValueChange={setTherapistId}
                    disabled={listsLoading || savingAlloc}
                  >
                    <SelectTrigger id="sess-therapist" className="h-10">
                      <SelectValue placeholder="Select therapist" />
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
                  <Label htmlFor="sess-room">Room</Label>
                  <Select value={roomId || undefined} onValueChange={setRoomId} disabled={listsLoading || savingAlloc}>
                    <SelectTrigger id="sess-room" className="h-10">
                      <SelectValue placeholder="Select room" />
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sess-start">Start</Label>
                    <Input
                      id="sess-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={savingAlloc}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sess-end">End</Label>
                    <Input
                      id="sess-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={savingAlloc}
                      className="h-10"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSaveAllocation}
                  disabled={listsLoading || savingAlloc || !therapistId || !roomId}
                >
                  {savingAlloc ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…
                    </>
                  ) : (
                    'Save schedule'
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Mobile: </span>
                  {row.patientMobile}
                </p>
              </div>

              <Separator className="my-1" />
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Medicines & supplies (this session)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Record oral medicines and session stock (oils, powders) for this day only — when the session is
                    actually done.
                  </p>
                </div>
                {loadingSessionMeds && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading session lines…
                  </p>
                )}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Oral / prescription
                  </p>
                  {sessionOral.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None added yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {sessionOral.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="font-medium">{m.medicineName}</span>
                            {m.dosage && <span className="text-muted-foreground"> · {m.dosage}</span>}
                            {m.frequency && <span className="text-muted-foreground"> · {m.frequency}</span>}
                            {m.specialInstructions && (
                              <p className="text-xs text-muted-foreground mt-1">{m.specialInstructions}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={sessionMedSaving}
                            onClick={() => handleDeleteOral(m.id)}
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 space-y-2 rounded-md border border-dashed border-border/60 p-3">
                    <Select
                      value={oralDraft.medicineId || undefined}
                      onValueChange={(v) => setOralDraft((d) => ({ ...d, medicineId: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Medicine" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {catalogMedicines.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Dosage"
                        value={oralDraft.dosage}
                        onChange={(e) => setOralDraft((d) => ({ ...d, dosage: e.target.value }))}
                        className="h-9"
                      />
                      <Input
                        placeholder="Frequency"
                        value={oralDraft.frequency}
                        onChange={(e) => setOralDraft((d) => ({ ...d, frequency: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <Input
                      placeholder="Instructions (e.g. with meals)"
                      value={oralDraft.specialInstructions}
                      onChange={(e) => setOralDraft((d) => ({ ...d, specialInstructions: e.target.value }))}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={sessionMedSaving || !oralDraft.medicineId}
                      onClick={handleAddOral}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add oral line
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Session supplies (oils, powders, etc.)
                  </p>
                  {sessionConsumables.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None added yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {sessionConsumables.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="font-medium">{c.medicineName}</span>
                            {c.quantityUsed && <span className="text-muted-foreground"> · {c.quantityUsed}</span>}
                            {c.notes && <span className="text-muted-foreground"> · {c.notes}</span>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={sessionMedSaving}
                            onClick={() => handleDeleteCons(c.id)}
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 space-y-2 rounded-md border border-dashed border-border/60 p-3">
                    <Select
                      value={consDraft.medicineId || undefined}
                      onValueChange={(v) => setConsDraft((d) => ({ ...d, medicineId: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Stock item" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {catalogMedicines.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Qty (e.g. 50 ml)"
                        value={consDraft.quantityUsed}
                        onChange={(e) => setConsDraft((d) => ({ ...d, quantityUsed: e.target.value }))}
                        className="h-9"
                      />
                      <Input
                        placeholder="Notes"
                        value={consDraft.notes}
                        onChange={(e) => setConsDraft((d) => ({ ...d, notes: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={sessionMedSaving || !consDraft.medicineId}
                      onClick={handleAddCons}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add supply line
                    </Button>
                  </div>
                </div>
              </div>

              {row.dayNotes && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.dayNotes}</p>
                </div>
              )}
            </div>
          </>
        )}

        {showPlanOnly && planOnly && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8">{planOnly.patientName as string}</SheetTitle>
              <SheetDescription>{planOnly.name as string}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 text-sm">
              <p className="text-muted-foreground">
                No session row for <strong>{scheduleDateLabel}</strong> on this plan. The plan may not cover this day,
                or dates have not been generated yet.
              </p>
              {scheduleDate !== todayStr && (
                <Button type="button" variant="default" size="sm" onClick={onSetToday}>
                  Jump to today’s schedule
                </Button>
              )}
              <Separator />
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span>
                    {formatIsoDateToApp(planStartDateStr(planOnly))} – {formatIsoDateToApp(planEndDateStr(planOnly))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span>{formatInr(parseMoney(planOnly.totalCost))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span>{formatInr(parseMoney(planOnly.balanceDue))}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TreatmentPlansPage;

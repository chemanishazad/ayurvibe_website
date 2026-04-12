import React from 'react';
import { CalendarIcon, FileText, Loader2, Plus, Printer, RotateCcw, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { formatPatientAgeDisplay } from '@/lib/patient-age';
import { formatAppDate, formatHhmmToAmPm } from '@/lib/datetime';
import { cn } from '@/lib/utils';

export type OutpatientRow = {
  id: string;
  patientName: string;
  patientMobile?: string | null;
  patientAge?: number | null;
  patientAgeUnit?: string | null;
  patientGender?: string | null;
  parentConsultationId?: string | null;
  consultationDate: string;
  consultationTime?: string | null;
  followUpRequired?: number;
  followUpDate?: string | null;
  totalAmount: string;
  diagnosis?: string | null;
  weight?: unknown;
  height?: unknown;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  temperature?: unknown;
  pulse?: number | null;
  spo2?: number | null;
  cbg?: unknown;
};

type Props = {
  listLoading: boolean;
  consultations: OutpatientRow[];
  upcomingFollowUps: OutpatientRow[];
  todayStr: string;
  activeConsId: string | null;
  fmtDateWithTime: (date: string, time?: string | null) => string;
  formatAppDate: (iso: string) => string;
  diagnosisDisplay: (d: unknown) => string;
  openConsultationRecord: (c: OutpatientRow) => void;
  openFollowUp: (c: OutpatientRow) => void;
  handlePrint: (id: string) => void;
  onNewConsult: () => void;
  targetClinicId?: string;
  /** OP queue: hide follow-up / print; adjust empty state. */
  listKind?: 'consultations' | 'op';
  newConsultLabel?: string;
  /** Nurses cannot open the doctor completion form from the OP queue. */
  disableRowOpen?: boolean;
};

const dash = (v: unknown): string => {
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  return s || '—';
};

const bpFmt = (s?: number | null, d?: number | null) => {
  if (s == null && d == null) return '—';
  if (s != null && d != null) return `${s}/${d}`;
  return dash(s ?? d);
};

const PAGE_SIZES = [10, 20, 50];

export const ConsultationListTable: React.FC<Props> = ({
  listLoading,
  consultations,
  upcomingFollowUps,
  todayStr,
  activeConsId,
  fmtDateWithTime,
  formatAppDate,
  diagnosisDisplay,
  openConsultationRecord,
  openFollowUp,
  handlePrint,
  onNewConsult,
  targetClinicId,
  listKind = 'consultations',
  newConsultLabel = 'New consult',
  disableRowOpen = false,
}) => {
  const isOpQueue = listKind === 'op';
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const sorted = React.useMemo(
    () =>
      [...consultations].sort((a, b) => {
        const da = `${a.consultationDate} ${a.consultationTime || ''}`;
        const db = `${b.consultationDate} ${b.consultationTime || ''}`;
        return db.localeCompare(da);
      }),
    [consultations],
  );

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const startIdx = (page - 1) * perPage;
  const paginatedRows = sorted.slice(startIdx, startIdx + perPage);

  const visiblePageNumbers = React.useMemo(
    () =>
      Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        if (page <= 3) return i + 1;
        if (page >= totalPages - 2) return totalPages - 4 + i;
        return page - 2 + i;
      }),
    [page, totalPages],
  );

  React.useEffect(() => {
    setPage(1);
  }, [consultations]);

  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [page, perPage, totalPages]);

  if (listLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading records...</p>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 transition-transform duration-300 hover:scale-105">
          <Stethoscope className="h-7 w-7" />
        </div>
        <p className="font-semibold text-foreground">{isOpQueue ? 'No OP visits in queue' : 'No consultations yet'}</p>
        <p className="mt-1 max-w-sm px-4 text-sm text-muted-foreground">
          {isOpQueue
            ? 'Record vitals under New OP, or switch clinic to see other branches.'
            : 'Create a new consult or pick another clinic to see records.'}
        </p>
        <Button className="mt-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]" size="sm" disabled={!targetClinicId} onClick={onNewConsult}>
          <Plus className="mr-2 h-4 w-4" />
          {newConsultLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {!isOpQueue && upcomingFollowUps.length > 0 && (
        <div className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300/50 dark:bg-amber-950/60 dark:text-amber-200">
              <CalendarIcon className="h-3.5 w-3.5" />
              Upcoming follow-ups ({upcomingFollowUps.length})
            </span>
            {upcomingFollowUps.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => openConsultationRecord(u)}
                className="text-xs font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
              >
                {u.patientName} · {u.followUpDate ? formatAppDate(String(u.followUpDate).slice(0, 10) + 'T12:00:00') : '—'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <Table
          wrapperClassName="min-h-0 min-w-0 flex-1 overscroll-contain"
          className={isOpQueue ? 'min-w-[1120px]' : 'min-w-[1040px]'}
        >
            <TableHeader className="sticky top-0 z-10 border-b border-border/60 bg-muted/95 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] whitespace-nowrap">Visit</TableHead>
                <TableHead className="min-w-[120px]">Patient</TableHead>
                <TableHead className="min-w-[100px]">Mobile</TableHead>
                <TableHead className="min-w-[72px]">Age</TableHead>
                <TableHead className="min-w-[52px]">Sex</TableHead>
                {isOpQueue ? (
                  <>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Visit date</TableHead>
                    <TableHead className="min-w-[88px] whitespace-nowrap">OP time</TableHead>
                  </>
                ) : (
                  <TableHead className="min-w-[140px] whitespace-nowrap">Date &amp; time</TableHead>
                )}
                <TableHead className="min-w-[56px]">Wt</TableHead>
                <TableHead className="min-w-[56px]">Ht</TableHead>
                <TableHead className="min-w-[72px]">BP</TableHead>
                <TableHead className="min-w-[52px]">Temp</TableHead>
                <TableHead className="min-w-[48px]">Pulse</TableHead>
                <TableHead className="min-w-[48px]">SpO₂</TableHead>
                <TableHead className="min-w-[48px]">CBG</TableHead>
                <TableHead className="min-w-[72px] text-right">Amount</TableHead>
                <TableHead className="min-w-[120px]">Notes</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((c) => {
                const isInitial = !c.parentConsultationId;
                const ageLabel = formatPatientAgeDisplay(c.patientAge, c.patientAgeUnit);
                return (
                  <TableRow
                    key={c.id}
                    className={cn(
                      !disableRowOpen && 'cursor-pointer',
                      disableRowOpen && 'cursor-default',
                      activeConsId === c.id && 'bg-primary/5',
                    )}
                    onClick={disableRowOpen ? undefined : () => openConsultationRecord(c)}
                  >
                    <TableCell className="align-top">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                          isInitial
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
                        )}
                      >
                        {isInitial ? (
                          <>
                            <Stethoscope className="h-3 w-3" /> Initial
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" /> Follow-up
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="align-top font-medium">
                      <span className="min-w-0 max-w-[220px] break-words sm:max-w-[280px]" title={c.patientName}>
                        {c.patientName}
                      </span>
                    </TableCell>
                    <TableCell className="align-top text-sm tabular-nums text-muted-foreground">{dash(c.patientMobile)}</TableCell>
                    <TableCell className="align-top text-sm">{ageLabel}</TableCell>
                    <TableCell className="align-top text-sm">{dash(c.patientGender)}</TableCell>
                    {isOpQueue ? (
                      <>
                        <TableCell className="align-top text-sm tabular-nums whitespace-nowrap">
                          {formatAppDate(String(c.consultationDate || '').slice(0, 10) + 'T12:00:00')}
                        </TableCell>
                        <TableCell className="align-top text-sm font-medium tabular-nums whitespace-nowrap text-foreground">
                          {formatHhmmToAmPm(c.consultationTime, '—')}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className="align-top text-sm tabular-nums whitespace-nowrap">
                        {fmtDateWithTime(c.consultationDate, c.consultationTime)}
                      </TableCell>
                    )}
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.weight)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.height)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{bpFmt(c.bpSystolic, c.bpDiastolic)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.temperature)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.pulse)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.spo2)}</TableCell>
                    <TableCell className="align-top text-sm tabular-nums">{dash(c.cbg)}</TableCell>
                    <TableCell className="align-top text-right text-sm tabular-nums whitespace-nowrap">
                      ₹{parseFloat(String(c.totalAmount || '0')).toFixed(2)}
                    </TableCell>
                    <TableCell className="max-w-[200px] align-top">
                      <p className="line-clamp-2 text-xs text-muted-foreground">{diagnosisDisplay(c.diagnosis)}</p>
                      {c.followUpRequired === 1 && c.followUpDate && c.followUpDate >= todayStr && (
                        <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                          Due {formatAppDate(String(c.followUpDate).slice(0, 10) + 'T12:00:00')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        {!isOpQueue && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openFollowUp(c)} title="Follow-up">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(c.id)} title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isOpQueue && !disableRowOpen && (
                          <span className="px-1 py-1 text-[11px] text-muted-foreground">Click to complete</span>
                        )}
                        {isOpQueue && disableRowOpen && (
                          <span className="px-1 py-1 text-[11px] text-muted-foreground/60">Pending doctor</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </Table>
      </div>

      {totalRows > 0 && (
        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 sm:px-4">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {startIdx + 1}–{Math.min(startIdx + perPage, totalRows)}
              </span>
              <span className="text-muted-foreground/80">of</span>
              <span className="font-medium tabular-nums text-foreground">{totalRows}</span>
              <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rows</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[4.5rem] rounded-lg border-border/70 bg-background text-sm font-medium shadow-sm">
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
              <PaginationContent className="flex-wrap gap-0.5 rounded-xl border border-border/50 bg-background/80 p-1 shadow-sm">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={
                      page <= 1
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer rounded-lg transition-colors hover:bg-primary/10 hover:text-primary'
                    }
                  />
                </PaginationItem>
                {visiblePageNumbers.map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNum);
                      }}
                      isActive={page === pageNum}
                      className="min-w-[2.25rem] cursor-pointer rounded-lg transition-colors hover:bg-muted/80"
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
                      setPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={
                      page >= totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer rounded-lg transition-colors hover:bg-primary/10 hover:text-primary'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
};

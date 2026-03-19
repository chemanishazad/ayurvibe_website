import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatPatientAgeDisplay } from '@/lib/patient-age';
import { Search, UserPlus, Eye, Pencil, X, CalendarDays, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import FullScreenLoader from '@/components/FullScreenLoader';
type PatientRow = Record<string, unknown> & { consultationCount?: number; lastConsultationId?: string };

const PAGE_SIZES = [10, 20, 50];
const SEARCH_DEBOUNCE_MS = 350;

const PatientsPage = () => {
  const navigate = useNavigate();
  const [rawPatients, setRawPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({ search: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const initializedRef = useRef(false);
  const requestIdRef = useRef(0);

  const totalPatients = rawPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalPatients / perPage));
  const startIdx = (page - 1) * perPage;
  const paginatedPatients = rawPatients.slice(startIdx, startIdx + perPage);
  const visiblePageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  const loadPatients = (nextFilters: typeof filters, opts?: { fullScreen?: boolean }) => {
    const requestId = ++requestIdRef.current;
    const fullScreen = opts?.fullScreen ?? false;
    if (fullScreen) setLoading(true);
    else setIsRefreshing(true);
    setPage(1);
    const params: Record<string, string> = {};
    if (nextFilters.search?.trim()) params.search = nextFilters.search.trim();
    if (nextFilters.from?.trim()) params.from = nextFilters.from.trim();
    if (nextFilters.to?.trim()) params.to = nextFilters.to.trim();
    api.patients
      .list(params)
      .then((data) => {
        if (requestId === requestIdRef.current) setRawPatients(data as PatientRow[]);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setRawPatients([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      });
  };

  useEffect(() => {
    loadPatients(filters, { fullScreen: true });
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [perPage, totalPages]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const timeoutMs = filters.search.trim() ? SEARCH_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      loadPatients(filters);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [filters.search, filters.from, filters.to]);

  const handleFromDateChange = (value: string) => {
    setFilters((f) => {
      const nextFrom = value;
      let nextTo = f.to;
      if (!nextFrom) return { ...f, from: '', to: f.to };
      if (!nextTo || nextFrom > nextTo) nextTo = nextFrom;
      return { ...f, from: nextFrom, to: nextTo };
    });
  };

  const handleToDateChange = (value: string) => {
    setFilters((f) => {
      const nextTo = value;
      let nextFrom = f.from;
      if (!nextTo) return { ...f, to: '' };
      if (!nextFrom || nextTo < nextFrom) nextFrom = nextTo;
      return { ...f, from: nextFrom, to: nextTo };
    });
  };

  const handleClearFilters = () => {
    setFilters({ search: '', from: '', to: '' });
  };

  const handleView = (patientId: string) => {
    navigate('/admin/consultations', { state: { patientId } });
  };

  const handleEdit = (patientId: string) => {
    navigate(`/admin/patients/${patientId}/edit`);
  };

  const patientInitials = (name: string) => {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return <FullScreenLoader label="Loading patients..." />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.03] transition-[border-color,box-shadow] duration-300 ease-out hover:border-border hover:shadow-md dark:ring-white/[0.04]">
        <CardContent className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
          {/* Filters + Add patient — title lives in AdminLayout top bar */}
          <div className="shrink-0 border-b border-border/50 bg-muted/15 px-3 py-2 transition-colors duration-200 ease-out hover:bg-muted/25 sm:px-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <div className="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-xl">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="patient-search"
                  placeholder="Search name or mobile…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="h-9 rounded-md border-border/60 bg-background pl-9 text-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/25 hover:shadow-sm focus-visible:border-primary/40"
                  aria-label="Search patients"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {isRefreshing && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="hidden sm:inline">Updating…</span>
                  </span>
                )}
                <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 transition-[border-color,background-color] duration-200 ease-out hover:border-primary/25 hover:bg-muted/30">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <Input
                    type="date"
                    id="filter-from"
                    value={filters.from}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="h-8 w-[128px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:w-[136px] sm:text-sm"
                  />
                  <span className="text-muted-foreground/60">–</span>
                  <Input
                    type="date"
                    id="filter-to"
                    value={filters.to}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="h-8 w-[128px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 sm:w-[136px] sm:text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 rounded-md transition-all duration-200 ease-out hover:border-primary/30 hover:bg-muted/50 active:scale-[0.98]"
                  disabled={!filters.search && !filters.from && !filters.to}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Reset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-md shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:brightness-[1.02] active:scale-[0.98]"
                  onClick={() => navigate('/admin/patients/new')}
                >
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Add patient
                </Button>
              </div>
            </div>
          </div>

          {/* Table — grows to fill all remaining space */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 sm:px-4">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-[border-color,box-shadow] duration-300 ease-out hover:border-border/80 hover:shadow-md">
              <div className="min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md transition-shadow duration-200">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="h-9 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</TableHead>
                      <TableHead className="h-9 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile</TableHead>
                      <TableHead className="h-9 w-[76px] py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Age</TableHead>
                      <TableHead className="h-9 w-[128px] py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Consultations
                      </TableHead>
                      <TableHead className="h-9 min-w-[148px] py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered</TableHead>
                      <TableHead className="h-9 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {rawPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 border-0 sm:h-48">
                        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5 transition-transform duration-300 ease-out hover:scale-105">
                            <Users className="h-7 w-7 opacity-90" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">No patients match your filters</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                              Try adjusting search or dates, or register a new patient to get started.
                            </p>
                          </div>
                          <Button
                            onClick={() => navigate('/admin/patients/new')}
                            className="rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add patient
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPatients.map((p, rowIdx) => {
                      const visits = Number(p.consultationCount ?? 0);
                      const name = (p.name as string) || 'Unknown';
                      return (
                        <TableRow
                          key={p.id as string}
                          className={
                            rowIdx % 2 === 0
                              ? 'group border-border/30 transition-[background-color,box-shadow] duration-200 ease-out hover:bg-primary/[0.04] hover:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] dark:hover:bg-primary/10'
                              : 'group border-border/30 bg-muted/[0.35] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-muted/50 hover:shadow-[inset_0_0_0_1px_hsl(var(--border)/0.5)] dark:hover:bg-muted/40'
                          }
                        >
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-[11px] font-bold text-primary ring-1 ring-primary/15 transition-[transform,box-shadow] duration-200 ease-out group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/25"
                                aria-hidden
                              >
                                {patientInitials(name)}
                              </div>
                              <span className="font-medium leading-tight text-foreground transition-colors duration-200 group-hover:text-primary">{name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono text-sm tabular-nums tracking-tight text-foreground/85">
                            {p.mobile as string}
                          </TableCell>
                          <TableCell className="py-2 tabular-nums text-muted-foreground">
                            {formatPatientAgeDisplay(p.age, p.ageUnit)}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {visits === 0 ? (
                              <span
                                className="inline-flex min-w-[2rem] items-center justify-center rounded-md bg-muted/45 px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground transition-colors duration-200 group-hover:bg-muted/60"
                                title="No consultations yet"
                              >
                                0
                              </span>
                            ) : (
                              <span
                                className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-primary/15 px-2.5 py-1 text-sm font-bold tabular-nums text-primary shadow-sm ring-1 ring-primary/10 transition-[transform,background-color] duration-200 ease-out group-hover:bg-primary/20 group-hover:ring-primary/25"
                                title={`${visits} consultation${visits === 1 ? '' : 's'}`}
                              >
                                {visits}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-2 text-sm tabular-nums text-muted-foreground">
                            {p.createdAt ? format(new Date(p.createdAt as string), 'dd-MM-yyyy HH:mm') : '—'}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-border/70 transition-all duration-200 ease-out hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.97]"
                                onClick={() => handleEdit(p.id as string)}
                              >
                                <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-lg shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:brightness-[1.06] active:scale-[0.97]"
                                onClick={() => handleView(p.id as string)}
                              >
                                <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">View</span>
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

          {!loading && rawPatients.length > 0 && (
            <div className="z-20 shrink-0 border-t border-border/60 bg-muted/20 px-3 py-2 transition-colors duration-200 hover:bg-muted/30 sm:px-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {startIdx + 1}–{Math.min(startIdx + perPage, totalPatients)}
                  </span>
                  <span className="text-muted-foreground/80">of</span>
                  <span className="font-medium tabular-nums text-foreground">{totalPatients}</span>
                  <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Rows</span>
                    <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
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
                          setPage((prev) => Math.max(1, prev - 1));
                        }}
                        className={
                          page <= 1
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
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
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
                          setPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                        className={
                          page >= totalPages
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
    </div>
  );
};

export default PatientsPage;

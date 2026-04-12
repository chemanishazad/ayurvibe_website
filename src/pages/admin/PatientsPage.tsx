import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatPatientAgeDisplay } from '@/lib/patient-age';
import { Search, UserPlus, Eye, Pencil, X, CalendarDays, Users, Loader2 } from 'lucide-react';
import { formatAppDateTime } from '@/lib/datetime';
import { useQuery } from '@tanstack/react-query';
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
import { ADMIN_ALL_CLINICS_VALUE, useAdminClinic } from '@/contexts/AdminClinicContext';
import { getAuthUser } from '@/pages/Login';

type PatientRow = Record<string, unknown> & { consultationCount?: number; lastConsultationId?: string };

const SEARCH_DEBOUNCE_MS = 350;
const PATIENTS_BRANCH_KEY = 'ayurvibe_patients_clinic_scope';
const PATIENTS_LIST_FILTERS_KEY = 'ayurvibe_patients_list_filters_v1';

function readStoredPatientsFilters(): { search: string; from: string; to: string } {
  try {
    const raw = sessionStorage.getItem(PATIENTS_LIST_FILTERS_KEY);
    if (!raw) return { search: '', from: '', to: '' };
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      search: String(o.search ?? ''),
      from: String(o.from ?? ''),
      to: String(o.to ?? ''),
    };
  } catch {
    return { search: '', from: '', to: '' };
  }
}

const PatientsPage = () => {
  const navigate = useNavigate();
  const { effectiveClinicId, isAdmin, clinics } = useAdminClinic();
  const [patientsBranch, setPatientsBranch] = useState(() => {
    try {
      return sessionStorage.getItem(PATIENTS_BRANCH_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const setPatientsBranchPersist = (v: string) => {
    setPatientsBranch(v);
    try {
      if (v) sessionStorage.setItem(PATIENTS_BRANCH_KEY, v);
      else sessionStorage.removeItem(PATIENTS_BRANCH_KEY);
    } catch {
      /* ignore */
    }
  };
  const initialPatientFilters = readStoredPatientsFilters();
  const [filters, setFilters] = useState(initialPatientFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(() => initialPatientFilters.search.trim());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PATIENTS_LIST_FILTERS_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  const clinicIdForList = isAdmin ? patientsBranch || undefined : effectiveClinicId ?? undefined;

  const queryParams = {
    search: debouncedSearch.trim(),
    from: filters.from.trim(),
    to: filters.to.trim(),
    ...(clinicIdForList ? { clinicId: clinicIdForList } : {}),
  };

  const { data: rawPatients = [], isLoading, isFetching } = useQuery<PatientRow[]>({
    queryKey: ['patients', queryParams],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (queryParams.search) params.search = queryParams.search;
      if (queryParams.from) params.from = queryParams.from;
      if (queryParams.to) params.to = queryParams.to;
      if (queryParams.clinicId) params.clinicId = queryParams.clinicId as string;
      return api.patients.list(params) as Promise<PatientRow[]>;
    },
    placeholderData: (prev) => prev,
  });

  const isRefreshing = isFetching && !isLoading;

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

  // Reset to page 1 when data changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.from, filters.to, effectiveClinicId, patientsBranch]);
  useEffect(() => { if (page > totalPages && totalPages > 0) setPage(totalPages); }, [perPage, totalPages]);

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
    try {
      sessionStorage.removeItem(PATIENTS_LIST_FILTERS_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleView = (patientId: string) => {
    const u = getAuthUser();
    const isNurse = u?.role === 'nurse' || (u?.role === 'user' && u?.staffRole === 'nurse');
    if (isNurse) navigate('/admin/op', { state: { patientId } });
    else navigate('/admin/consultations', { state: { patientId } });
  };

  const handleEdit = (patientId: string) => navigate(`/admin/patients/${patientId}/edit`);

  const PAGE_SIZES = [10, 20, 50];

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          </CardContent>
        </Card>
      </div>
    );
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
                {isAdmin && clinics.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Branch</span>
                    <Select
                      value={patientsBranch || ADMIN_ALL_CLINICS_VALUE}
                      onValueChange={(v) => setPatientsBranchPersist(v === ADMIN_ALL_CLINICS_VALUE ? '' : v)}
                    >
                      <SelectTrigger className="h-8 w-[min(56vw,200px)] border-0 bg-transparent text-xs shadow-none">
                        <SelectValue placeholder="All branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ADMIN_ALL_CLINICS_VALUE}>All branches</SelectItem>
                        {clinics.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  <TableHeader className="sticky top-0 z-10 border-b border-border/60 bg-muted/40 backdrop-blur-sm">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="h-10 py-2 pl-4 text-left text-xs font-semibold text-muted-foreground">Patient</TableHead>
                      <TableHead className="h-10 py-2 text-left text-xs font-semibold text-muted-foreground">Mobile</TableHead>
                      <TableHead className="h-10 w-[76px] py-2 text-left text-xs font-semibold text-muted-foreground">Age</TableHead>
                      <TableHead className="h-10 w-[120px] py-2 text-center text-xs font-semibold text-muted-foreground">
                        Consultations
                      </TableHead>
                      <TableHead className="h-10 min-w-[148px] py-2 text-left text-xs font-semibold text-muted-foreground">Registered</TableHead>
                      <TableHead className="h-10 py-2 pr-4 text-right text-xs font-semibold text-muted-foreground">Actions</TableHead>
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
                              ? 'border-border/40 transition-colors hover:bg-muted/30'
                              : 'border-border/40 bg-muted/20 transition-colors hover:bg-muted/40'
                          }
                        >
                          <TableCell className="max-w-[min(40vw,14rem)] py-2.5 pl-4 sm:max-w-xs">
                            <span className="block truncate font-medium text-foreground" title={name}>
                              {name}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-sm tabular-nums text-foreground/90">
                            {p.mobile as string}
                          </TableCell>
                          <TableCell className="py-2.5 tabular-nums text-muted-foreground">
                            {formatPatientAgeDisplay(p.age, p.ageUnit)}
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            {visits === 0 ? (
                              <span
                                className="inline-flex min-w-[2rem] items-center justify-center rounded-md border border-transparent bg-muted/50 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
                                title="No consultations yet"
                              >
                                0
                              </span>
                            ) : (
                              <span
                                className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary"
                                title={`${visits} consultation${visits === 1 ? '' : 's'}`}
                              >
                                {visits}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-2.5 text-sm tabular-nums text-muted-foreground">
                            {p.createdAt ? formatAppDateTime(p.createdAt as string) : '—'}
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md border-border/60"
                                onClick={() => handleEdit(p.id as string)}
                              >
                                <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-md"
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

          {!isLoading && rawPatients.length > 0 && (
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

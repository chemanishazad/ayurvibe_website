import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Search, UserPlus, UserCheck, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Calendar } from 'lucide-react';

type PatientRow = Record<string, unknown> & { isReturning?: boolean; consultationCount?: number; lastConsultationId?: string };

const PAGE_SIZES = [10, 20, 50];

const PatientsPage = () => {
  const navigate = useNavigate();
  const [rawPatients, setRawPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [filters, setFilters] = useState({ search: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { toast } = useToast();

  const totalPatients = rawPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalPatients / perPage));
  const startIdx = (page - 1) * perPage;
  const paginatedPatients = rawPatients.slice(startIdx, startIdx + perPage);

  const loadPatients = () => {
    setLoading(true);
    setPage(1);
    const params: Record<string, string> = {};
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.from?.trim()) params.from = filters.from.trim();
    if (filters.to?.trim()) params.to = filters.to.trim();
    api.patients.list(params).then((data) => setRawPatients(data as PatientRow[])).catch(() => setRawPatients([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [perPage, totalPages]);

  const handleCreateOrUpdate = async () => {
    setLoading(true);
    try {
      await api.patients.create(formData);
      setShowForm(false);
      toast({ title: 'Patient saved', description: 'Patient registered successfully.' });
      loadPatients();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (patientId: string) => {
    navigate('/admin/consultations', { state: { patientId } });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-3 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or mobile..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && loadPatients()}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  id="filter-from"
                  value={filters.from}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                  className="w-[145px] h-9 text-sm"
                />
              </div>
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                id="filter-to"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="w-[145px] h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={loadPatients} className="h-9">
                Filter
              </Button>
              <Button size="sm" onClick={() => { setFormData({ mobile: '', name: '', age: '', gender: '', address: '', medicalHistory: '' }); setShowForm(true); }} className="h-9">
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add Patient
              </Button>
            </div>
          </div>

          <div className="mt-2 flex-1 min-h-0 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rawPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No patients found. Add a new patient to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPatients.map((p) => {
                    const visits = p.consultationCount ?? 0;
                    const isReturning = p.isReturning ?? visits >= 1;
                    return (
                      <TableRow key={p.id as string} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{(p.name as string) || 'Unknown'}</TableCell>
                        <TableCell>{p.mobile as string}</TableCell>
                        <TableCell>{p.age != null ? String(p.age) : '-'}</TableCell>
                        <TableCell>
                          {isReturning ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <UserCheck className="h-3.5 w-3.5" /> Returning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              <UserPlus className="h-3.5 w-3.5" /> New
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{visits}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleView(p.id as string)}>
                            <Eye className="h-4 w-4 mr-1" />
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

          {/* Pagination - always visible at bottom */}
          {!loading && rawPatients.length > 0 && (
            <div className="mt-2 pt-2 border-t shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {startIdx + 1}–{Math.min(startIdx + perPage, totalPatients)} of {totalPatients}
                </span>
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>per page</span>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage(pageNum); }}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
            <DialogDescription>Enter patient details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={(formData.name as string) || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input
                value={(formData.mobile as string) || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={(formData.age as string) ?? ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={(formData.gender as string) || ''}
                onValueChange={(v) => setFormData({ ...formData, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={(formData.address as string) || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
              />
            </div>
            <div>
              <Label>Medical History</Label>
              <Textarea
                value={(formData.medicalHistory as string) || ''}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Past conditions, allergies, etc."
                rows={3}
              />
            </div>
            <Button onClick={handleCreateOrUpdate} disabled={loading} className="w-full">
              Save Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Search, UserPlus, UserCheck, Stethoscope, RotateCcw } from 'lucide-react';
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

type PatientRow = Record<string, unknown> & { isReturning?: boolean; consultationCount?: number; lastConsultationId?: string };

const PatientsPage = () => {
  const navigate = useNavigate();
  const [rawPatients, setRawPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [filters, setFilters] = useState({ name: '', mobile: '', from: '', to: '', view: '' });
  const { toast } = useToast();

  const loadPatients = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.name?.trim()) params.name = filters.name.trim();
    if (filters.mobile?.trim()) params.mobile = filters.mobile.trim();
    if (filters.from?.trim()) params.from = filters.from.trim();
    if (filters.to?.trim()) params.to = filters.to.trim();
    api.patients.list(params).then((data) => setRawPatients(data as PatientRow[])).catch(() => setRawPatients([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatients();
  }, []);

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

  const handleConsult = (patientId: string) => {
    navigate('/admin/consultations', { state: { patientId } });
  };

  const handleReview = (patientId: string, lastConsultationId: string) => {
    navigate('/admin/consultations', { state: { patientId, parentConsultationId: lastConsultationId, isReview: true } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Patient Management" description="All patients with search and filters">
        <Button onClick={() => { setFormData({ mobile: '', name: '', age: '', gender: '', address: '', medicalHistory: '' }); setShowForm(true); }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Search by name</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs text-muted-foreground">Mobile</Label>
                <Input
                  placeholder="Mobile"
                  value={filters.mobile}
                  onChange={(e) => setFilters((f) => ({ ...f, mobile: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">View</Label>
                  <Select value={filters.view} onValueChange={(v) => setFilters((f) => ({ ...f, view: v as typeof filters.view }))}>
                    <SelectTrigger className="mt-1 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="returning">Returning</SelectItem>
                      <SelectItem value="one_visit">1 Visit only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={loadPatients} className="mb-0.5">
                  Filter
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-md border">
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
                  rawPatients.map((p) => {
                    const visits = p.consultationCount ?? 0;
                    const isReturning = p.isReturning ?? visits >= 1;
                    const lastConsId = p.lastConsultationId as string | undefined;
                    const showReview = visits === 1 && lastConsId;
                    return (
                      <TableRow key={p.id as string} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{(p.name as string) || 'Unknown'}</TableCell>
                        <TableCell>{p.mobile as string}</TableCell>
                        <TableCell>{p.age ?? '-'}</TableCell>
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
                          <div className="flex justify-end gap-2">
                            {showReview && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReview(p.id as string, lastConsId)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                            <Button size="sm" onClick={() => handleConsult(p.id as string)}>
                              <Stethoscope className="h-4 w-4 mr-1" />
                              Consult
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

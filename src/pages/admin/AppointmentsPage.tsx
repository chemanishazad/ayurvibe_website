import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { api, type AppointmentRequestRow, type AppointmentStatus } from '@/lib/api';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { usePermissions } from '@/hooks/usePermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus, Phone, Mail, Loader2, CalendarCheck } from 'lucide-react';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  booked: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-muted text-muted-foreground border-border',
};

const FILTERS: { value: 'all' | AppointmentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const AppointmentsPage = () => {
  const perms = usePermissions();
  const canEdit = perms.has('appointments.edit');
  const canDelete = perms.has('appointments.delete');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [detail, setDetail] = useState<AppointmentRequestRow | null>(null);

  const { data: rows = [], isLoading } = useQuery<AppointmentRequestRow[]>({
    queryKey: ['appointment-requests'],
    queryFn: () => api.appointments.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['appointment-requests'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.appointments.updateStatus(id, status),
    onSuccess: () => { toast({ title: 'Status updated' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => api.appointments.convert(id),
    onSuccess: (res) => {
      toast({ title: 'Converted to patient', description: `${res.patient.name} is now in Patients.` });
      setDetail(null);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.appointments.delete(id),
    onSuccess: () => { toast({ title: 'Request deleted' }); setDetail(null); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const filtered = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );

  const newCount = useMemo(() => rows.filter((r) => r.status === 'new').length, [rows]);

  const columns: Column<AppointmentRequestRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (r) => (
        <button className="text-left" onClick={() => setDetail(r)}>
          <span className="font-medium hover:underline">{r.name}</span>
          {r.age ? <span className="text-muted-foreground text-xs"> · {r.age}y</span> : null}
        </button>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (r) => (
        <div className="text-sm">
          <a href={`tel:${r.mobile}`} className="flex items-center gap-1.5 hover:text-primary">
            <Phone className="h-3.5 w-3.5" />{r.mobile}
          </a>
          {r.email && (
            <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary mt-0.5">
              <Mail className="h-3.5 w-3.5" />{r.email}
            </a>
          )}
        </div>
      ),
    },
    { key: 'inquiryType', header: 'Inquiry', cell: (r) => <Badge variant="outline">{r.inquiryType}</Badge> },
    {
      key: 'message',
      header: 'Message',
      cell: (r) => <span className="text-sm text-muted-foreground line-clamp-2 max-w-[280px] block">{r.message || '—'}</span>,
    },
    { key: 'createdAt', header: 'Received', cell: (r) => <span className="text-sm whitespace-nowrap">{formatDate(r.createdAt)}</span> },
    {
      key: 'status',
      header: 'Status',
      cell: (r) =>
        canEdit ? (
          <Select value={r.status} onValueChange={(v) => statusMutation.mutate({ id: r.id, status: v as AppointmentStatus })}>
            <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className={STATUS_BADGE[r.status]}>{r.status}</Badge>
        ),
    },
    ...(canEdit || canDelete
      ? [{
          key: 'actions',
          header: 'Actions',
          align: 'right' as const,
          cell: (r: AppointmentRequestRow) => (
            <div className="flex justify-end gap-1">
              {canEdit && !r.convertedPatientId && (
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Convert to patient"
                  disabled={convertMutation.isPending}
                  onClick={() => convertMutation.mutate(r.id)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              {r.convertedPatientId && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Patient</Badge>
              )}
              {canDelete && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"
                  onClick={() => { if (!confirm(`Delete request from "${r.name}"?`)) return; deleteMutation.mutate(r.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Appointments"
        description="Booking & enquiry requests submitted from the website. Triage, convert to patients, and track status."
      >
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | AppointmentStatus)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Website Requests
            {newCount > 0 && <Badge className="bg-primary text-primary-foreground">{newCount} new</Badge>}
          </CardTitle>
          <CardDescription>Submitted via the public booking form. Each one also emails the clinic.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            loading={isLoading}
            emptyMessage="No appointment requests yet."
            minWidthClassName="min-w-[920px]"
          />
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-3">
                  <span>{detail.name}</span>
                  <Badge variant="outline" className={STATUS_BADGE[detail.status]}>{detail.status}</Badge>
                </DialogTitle>
                <DialogDescription>Received {formatDate(detail.createdAt)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground text-xs">Mobile</p><a href={`tel:${detail.mobile}`} className="font-medium hover:text-primary">{detail.mobile}</a></div>
                  <div><p className="text-muted-foreground text-xs">Age</p><p className="font-medium">{detail.age ?? '—'}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Email</p><p className="font-medium break-all">{detail.email || '—'}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Inquiry type</p><p className="font-medium">{detail.inquiryType}</p></div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Message</p>
                  <p className="rounded-lg bg-muted p-3 leading-relaxed whitespace-pre-wrap">{detail.message || '—'}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  {canEdit && !detail.convertedPatientId && (
                    <Button className="flex-1" disabled={convertMutation.isPending} onClick={() => convertMutation.mutate(detail.id)}>
                      {convertMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Convert to patient
                    </Button>
                  )}
                  {detail.convertedPatientId && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 self-center">Already a patient</Badge>
                  )}
                  {canDelete && (
                    <Button variant="outline" className="text-destructive hover:text-destructive"
                      onClick={() => { if (!confirm(`Delete request from "${detail.name}"?`)) return; deleteMutation.mutate(detail.id); }}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;

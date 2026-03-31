import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const clinicNameSchema = z.object({ name: z.string().min(1, 'Clinic name is required').trim() });
type ClinicNameForm = z.infer<typeof clinicNameSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{message}
    </p>
  ) : null;

const ClinicsPage = () => {
  const user = getAuthUser();
  if (user?.role !== 'admin') { return <Navigate to="/admin/dashboard" replace />; }

  const { toast } = useToast();
  const { refreshClinics } = useAdminClinic();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const createForm = useForm<ClinicNameForm>({ resolver: zodResolver(clinicNameSchema), defaultValues: { name: '' } });
  const editForm = useForm<ClinicNameForm>({ resolver: zodResolver(clinicNameSchema), defaultValues: { name: '' } });

  const { data: rows = [], isLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['clinics'],
    queryFn: () => api.clinics.list() as Promise<{ id: string; name: string }[]>,
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['clinics'] }); refreshClinics(); };

  const createMutation = useMutation({
    mutationFn: (d: ClinicNameForm) => api.clinics.create(d.name.trim()),
    onSuccess: () => { toast({ title: 'Clinic created' }); setShowForm(false); createForm.reset(); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (d: ClinicNameForm) => api.clinics.update(editing!.id, { name: d.name.trim() }),
    onSuccess: () => { toast({ title: 'Clinic updated' }); setEditing(null); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (c: { id: string; name: string }) => api.clinics.delete(c.id),
    onSuccess: () => { toast({ title: 'Clinic deleted' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Clinics" description="Locations for inventory, consultations, and staff access." />
        <Card><CardContent className="pt-6">
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}</div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Clinics" description="Locations for inventory, consultations, and staff access.">
        <Button onClick={() => { setShowForm(true); setEditing(null); createForm.reset(); }}>
          <Plus className="mr-2 h-4 w-4" />Add clinic
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>All clinics</CardTitle>
          <CardDescription>Shown in the header clinic selector for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No clinics yet. Create one to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => { setEditing(c); editForm.reset({ name: c.name }); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        onClick={() => { if (!confirm(`Delete clinic "${c.name}"? This removes linked data per database rules.`)) return; deleteMutation.mutate(c); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New clinic</DialogTitle><DialogDescription>Display name only.</DialogDescription></DialogHeader>
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', createForm.formState.errors.name && 'border-destructive')} placeholder="e.g. Perumbakkam" {...createForm.register('name')} />
                <FieldError message={createForm.formState.errors.name?.message} />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename clinic</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', editForm.formState.errors.name && 'border-destructive')} {...editForm.register('name')} />
                <FieldError message={editForm.formState.errors.name?.message} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicsPage;

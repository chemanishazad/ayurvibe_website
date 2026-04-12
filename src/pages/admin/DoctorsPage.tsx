import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Pencil, Trash2, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const doctorNameSchema = z.object({
  name: z.string().min(1, 'Doctor name is required').trim(),
});
type DoctorNameForm = z.infer<typeof doctorNameSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{message}
    </p>
  ) : null;

interface DoctorRow {
  id: string;
  name: string;
  clinicIds?: string[];
}

const DoctorsPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const [createClinicIds, setCreateClinicIds] = useState<string[]>([]);
  const [mapDoctor, setMapDoctor] = useState<DoctorRow | null>(null);
  const [doctorClinics, setDoctorClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [addClinicId, setAddClinicId] = useState('');

  const createForm = useForm<DoctorNameForm>({ resolver: zodResolver(doctorNameSchema), defaultValues: { name: '' } });
  const editForm = useForm<DoctorNameForm>({ resolver: zodResolver(doctorNameSchema), defaultValues: { name: '' } });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<DoctorRow[]>({
    queryKey: ['doctors'],
    queryFn: () => api.doctors.list() as Promise<DoctorRow[]>,
  });

  const { data: clinics = [], isLoading: clinicsLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['clinics'],
    queryFn: () => api.clinics.list() as Promise<{ id: string; name: string }[]>,
  });

  const loading = doctorsLoading || clinicsLoading;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['doctors'] });

  const clinicsNotMapped = useMemo(() => {
    const have = new Set(doctorClinics.map((c) => c.id));
    return clinics.filter((c) => !have.has(c.id));
  }, [clinics, doctorClinics]);

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  const openDoctorMappings = async (d: DoctorRow) => {
    setMapDoctor(d);
    setAddClinicId('');
    try {
      const list = await api.doctors.listClinics(d.id);
      setDoctorClinics(list as { id: string; name: string; mappingId: string }[]);
    } catch {
      setDoctorClinics([]);
    }
  };

  const toggleCreateClinic = (id: string, checked: boolean) => {
    setCreateClinicIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const createMutation = useMutation({
    mutationFn: (data: DoctorNameForm) => api.doctors.create({ name: data.name.trim(), clinicIds: createClinicIds.length > 0 ? createClinicIds : undefined }),
    onSuccess: () => {
      toast({ title: 'Doctor added' }); setShowForm(false); createForm.reset(); setCreateClinicIds([]);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: DoctorNameForm) => api.doctors.update(editing!.id, { name: data.name.trim() }),
    onSuccess: () => { toast({ title: 'Doctor updated' }); setEditing(null); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (d: DoctorRow) => api.doctors.delete(d.id),
    onSuccess: () => { toast({ title: 'Doctor removed' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const handleCreate = (data: DoctorNameForm) => {
    if (clinics.length > 0 && createClinicIds.length === 0) {
      toast({ title: 'Select at least one clinic', description: 'Doctors only appear in consultations for clinics they are assigned to.', variant: 'destructive' });
      return;
    }
    createMutation.mutate(data);
  };

  const openEdit = (d: DoctorRow) => { setEditing(d); editForm.reset({ name: d.name }); };

  if (loading && doctors.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Doctors" description="Assign each doctor to one or more clinics." />
        <Card><CardContent className="pt-6">
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}</div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Doctors"
        description="Assign each doctor to one or more clinics. The consultation form only lists doctors for the clinic you have selected in the header."
      >
        {isAdmin && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              createForm.reset();
              setCreateClinicIds([]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add doctor
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Practitioners</CardTitle>
          <CardDescription>
            Clinic links control who appears in the doctor dropdown and block consultations if the doctor is not assigned to that clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-muted-foreground">
              No doctors yet.{isAdmin && ' Add one and assign clinics so they appear in consultations.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Clinics</th>
                    {isAdmin && <th className="py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="py-2">{d.name}</td>
                      <td className="py-2 text-muted-foreground">
                        {(d.clinicIds?.length ?? 0) === 0
                          ? '—'
                          : (d.clinicIds ?? []).map((id) => clinicName(id)).join(', ')}
                      </td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => openDoctorMappings(d)}><Link2 className="mr-1 h-3.5 w-3.5" />Clinics</Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => { if (!confirm(`Remove doctor "${d.name}"? Fails if they have consultations.`)) return; deleteMutation.mutate(d); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add doctor</DialogTitle><DialogDescription>Display name as it should appear on records.</DialogDescription></DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', createForm.formState.errors.name && 'border-destructive')} placeholder="Dr. …" {...createForm.register('name')} />
                <FieldError message={createForm.formState.errors.name?.message} />
              </div>
              {clinics.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  <Label>Works at</Label>
                  <p className="text-xs text-muted-foreground">Required when you have clinics. This doctor will only appear in consultations for these locations.</p>
                  {clinics.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={createClinicIds.includes(c.id)} onCheckedChange={(ch) => toggleCreateClinic(c.id, ch === true)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              )}
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit doctor</DialogTitle><DialogDescription>Update the display name. Use Clinics to change locations.</DialogDescription></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', editForm.formState.errors.name && 'border-destructive')} {...editForm.register('name')} />
                <FieldError message={editForm.formState.errors.name?.message} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapDoctor} onOpenChange={(o) => !o && setMapDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clinics for {mapDoctor?.name}</DialogTitle>
            <DialogDescription>
              This doctor appears in the consultation dropdown only for linked clinics. Existing records are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ul className="space-y-2 text-sm">
              {doctorClinics.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{c.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      if (!mapDoctor) return;
                      try {
                        await api.doctors.removeClinic(mapDoctor.id, c.id);
                        toast({ title: 'Removed' });
                        await openDoctorMappings(mapDoctor);
                        invalidate();
                      } catch (e) {
                        toast({
                          title: 'Error',
                          description: e instanceof Error ? e.message : 'Failed',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            {clinicsNotMapped.length > 0 ? (
              <div className="flex gap-2">
                <Select value={addClinicId || undefined} onValueChange={setAddClinicId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add clinic…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicsNotMapped.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!addClinicId || !mapDoctor}
                  onClick={async () => {
                    if (!mapDoctor || !addClinicId) return;
                    try {
                      await api.doctors.addClinic(mapDoctor.id, addClinicId);
                      toast({ title: 'Clinic linked' });
                      setAddClinicId('');
                      await openDoctorMappings(mapDoctor);
                      invalidate();
                    } catch (e) {
                      toast({
                        title: 'Error',
                        description: e instanceof Error ? e.message : 'Failed',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All clinics are already linked.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorsPage;

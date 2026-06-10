import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Pencil, Trash2, AlertCircle, Loader2, Boxes } from 'lucide-react';
import { MedicineUnitsDialog } from './MedicineUnitsDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface Medicine {
  id: string;
  name: string;
  uom: string;
  purchasePrice: string;
  sellingPrice: string;
  minStockLevel: number;
  description?: string;
  status?: 'active' | 'pending' | 'archived';
  createdVia?: 'admin' | 'doctor_quick_add' | 'import';
}

type MedicineStatusFilter = 'all' | 'active' | 'pending' | 'archived';

const UOM_OPTIONS = ['tablet', 'capsule', 'syrup', 'bottle', 'strip', 'sachet', 'ml', 'gm', 'kg'];

const UOM_EMPTY = '__empty__';

const medicineFormSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').trim(),
  /** Stored as '' when “Not set” (e.g. auto-created from prescription). */
  uom: z.string().max(50),
  minStockLevel: z.string().regex(/^\d+$/, 'Enter a whole number (e.g. 10)').default('10'),
  description: z.string().optional(),
});
type MedicineForm = z.infer<typeof medicineFormSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{message}
    </p>
  ) : null;

const MedicinesPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [unitsFor, setUnitsFor] = useState<Medicine | null>(null);
  const [statusFilter, setStatusFilter] = useState<MedicineStatusFilter>('all');

  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ['medicines'],
    queryFn: () => api.medicines.list() as Promise<Medicine[]>,
  });

  const filteredMedicines = React.useMemo(() => {
    if (statusFilter === 'all') return medicines;
    return medicines.filter((m) => (m.status ?? 'active') === statusFilter);
  }, [medicines, statusFilter]);

  const pendingCount = React.useMemo(
    () => medicines.filter((m) => m.status === 'pending').length,
    [medicines],
  );

  const makeForm = (defaults?: Partial<MedicineForm>) =>
    useForm<MedicineForm>({
      resolver: zodResolver(medicineFormSchema),
      defaultValues: { name: '', uom: 'tablet', minStockLevel: '10', description: '', ...defaults },
    });

  const createForm = useForm<MedicineForm>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: { name: '', uom: 'tablet', minStockLevel: '10', description: '' },
  });

  const editForm = useForm<MedicineForm>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: { name: '', uom: 'tablet', minStockLevel: '10', description: '' },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['medicines'] });

  const createMutation = useMutation({
    mutationFn: (data: MedicineForm) =>
      api.medicines.create({
        name: data.name.trim(),
        uom: data.uom.trim(),
        minStockLevel: parseInt(data.minStockLevel, 10) || 10,
        description: data.description || undefined,
      }),
    onSuccess: () => { toast({ title: 'Medicine added' }); setShowForm(false); createForm.reset(); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MedicineForm) =>
      api.medicines.update(editing!.id, {
        name: data.name.trim(),
        uom: data.uom.trim(),
        minStockLevel: parseInt(data.minStockLevel, 10) || 10,
        description: data.description || undefined,
      }),
    onSuccess: () => { toast({ title: 'Medicine updated' }); setEditing(null); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.medicines.delete(id),
    onSuccess: () => { toast({ title: 'Medicine deleted' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const openEdit = (m: Medicine) => {
    setEditing(m);
    editForm.reset({
      name: m.name,
      uom: m.uom?.trim() ? m.uom : '',
      minStockLevel: String(m.minStockLevel),
      description: m.description || '',
    });
  };

  const MedicineFormFields = ({ form, isBusy }: { form: ReturnType<typeof makeForm>; isBusy: boolean }) => (
    <div className="space-y-4 pt-4">
      <div>
        <Label>Name <span className="text-destructive">*</span></Label>
        <Input className={cn('mt-1', form.formState.errors.name && 'border-destructive')} placeholder="Medicine name" {...form.register('name')} />
        <FieldError message={form.formState.errors.name?.message} />
      </div>
      <div>
        <Label>Unit of measure</Label>
        <Select
          value={form.watch('uom')?.trim() ? form.watch('uom') : UOM_EMPTY}
          onValueChange={(v) => form.setValue('uom', v === UOM_EMPTY ? '' : v, { shouldValidate: true })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select UOM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UOM_EMPTY}>Not set</SelectItem>
            {UOM_OPTIONS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={form.formState.errors.uom?.message} />
      </div>
      <div>
        <Label>Min Stock Level</Label>
        <Input type="text" inputMode="numeric" className={cn('mt-1', form.formState.errors.minStockLevel && 'border-destructive')} {...form.register('minStockLevel')} />
        <FieldError message={form.formState.errors.minStockLevel?.message} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea className="mt-1" rows={2} {...form.register('description')} />
      </div>
      <Button type="submit" disabled={isBusy} className="w-full">
        {isBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : editing ? 'Update' : 'Add'}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Medicine Master" description="Manage medicine catalog" />
        <Card><CardContent className="pt-6">
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}</div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Medicine Master" description="Manage medicine catalog (Admin only for add/edit)">
        {isAdmin && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button asChild variant="outline" size="sm" className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100">
                <a href="/admin/medicines/pending">{pendingCount} pending review</a>
              </Button>
            )}
            <Button onClick={() => { setShowForm(true); setEditing(null); createForm.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />Add Medicine
            </Button>
          </div>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>Medicines</CardTitle>
              <CardDescription>All medicines in the system</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'active', 'pending', 'archived'] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMedicines.length === 0 ? (
            <p className="text-muted-foreground">{medicines.length === 0 ? 'No medicines. Add one to get started.' : 'No medicines match this filter.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">UOM</th>
                    <th className="text-right py-2">Min Stock</th>
                    {isAdmin && <th className="text-right py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((m) => {
                    const status = m.status ?? 'active';
                    return (
                      <tr key={m.id} className="border-b">
                        <td className="py-2">{m.name}</td>
                        <td className="py-2">
                          {status === 'pending' ? (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                              Pending
                            </span>
                          ) : status === 'archived' ? (
                            <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">{m.uom?.trim() ? m.uom : '—'}</td>
                        <td className="py-2 text-right">{m.minStockLevel}</td>
                        {isAdmin && (
                          <td className="py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              {status === 'pending' && (
                                <Button asChild size="sm" variant="outline">
                                  <a href={`/admin/medicines/pending#${m.id}`}>Complete</a>
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" title="Units (box / strip)" onClick={() => setUnitsFor(m)}><Boxes className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                                onClick={() => { if (!confirm(`Delete "${m.name}"? Fails if in use.`)) return; deleteMutation.mutate(m.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm && !editing} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Medicine</DialogTitle><DialogDescription>Enter medicine details</DialogDescription></DialogHeader>
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}>
            <MedicineFormFields form={createForm} isBusy={createMutation.isPending} />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Medicine</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))}>
            <MedicineFormFields form={editForm} isBusy={updateMutation.isPending} />
          </form>
        </DialogContent>
      </Dialog>

      <MedicineUnitsDialog
        medicineId={unitsFor?.id ?? null}
        medicineName={unitsFor?.name ?? ''}
        onClose={() => setUnitsFor(null)}
      />
    </div>
  );
};

export default MedicinesPage;

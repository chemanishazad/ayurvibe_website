import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface Supplier { id: string; name: string; contact?: string; address?: string; }

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').trim(),
  contact: z.string().optional(),
  address: z.string().optional(),
});
type SupplierForm = z.infer<typeof supplierSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{message}
    </p>
  ) : null;

const SuppliersPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.suppliers.list() as Promise<Supplier[]>,
  });

  const createForm = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contact: '', address: '' },
  });

  const editForm = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contact: '', address: '' },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['suppliers'] });

  const createMutation = useMutation({
    mutationFn: (d: SupplierForm) => api.suppliers.create({ name: d.name.trim(), contact: d.contact || undefined, address: d.address || undefined }),
    onSuccess: () => { toast({ title: 'Supplier added' }); setShowForm(false); createForm.reset(); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (d: SupplierForm) => api.suppliers.update(editing!.id, { name: d.name.trim(), contact: d.contact || undefined, address: d.address || undefined }),
    onSuccess: () => { toast({ title: 'Supplier updated' }); setEditing(null); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.suppliers.delete(id),
    onSuccess: () => { toast({ title: 'Supplier deleted' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const openEdit = (s: Supplier) => {
    setEditing(s);
    editForm.reset({ name: s.name, contact: s.contact || '', address: s.address || '' });
  };

  const FormFields = ({ form, isBusy, label }: { form: ReturnType<typeof useForm<SupplierForm>>; isBusy: boolean; label: string }) => (
    <div className="space-y-4 pt-4">
      <div>
        <Label>Name <span className="text-destructive">*</span></Label>
        <Input className={cn('mt-1', form.formState.errors.name && 'border-destructive')} placeholder="Supplier name" {...form.register('name')} />
        <FieldError message={form.formState.errors.name?.message} />
      </div>
      <div>
        <Label>Contact</Label>
        <Input className="mt-1" placeholder="Phone / email" {...form.register('contact')} />
      </div>
      <div>
        <Label>Address</Label>
        <Textarea className="mt-1" rows={2} placeholder="Address" {...form.register('address')} />
      </div>
      <Button type="submit" disabled={isBusy} className="w-full">
        {isBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : label}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Suppliers" description="Manage suppliers" />
        <Card><CardContent className="pt-6">
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}</div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Suppliers" description="Manage suppliers. Same product can have different prices per supplier.">
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setEditing(null); createForm.reset(); }}>
            <Plus className="h-4 w-4 mr-2" />Add Supplier
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader><CardTitle>Suppliers</CardTitle><CardDescription>All suppliers. Use Purchase flow in Inventory to add stock with supplier & price.</CardDescription></CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground">No suppliers. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Name</th><th className="text-left py-2">Contact</th><th className="text-left py-2">Address</th>{isAdmin && <th className="text-right py-2">Actions</th>}</tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">{s.contact || '—'}</td>
                      <td className="py-2">{s.address || '—'}</td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => { if (!confirm(`Delete supplier "${s.name}"?`)) return; deleteMutation.mutate(s.id); }}>
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

      <Dialog open={showForm && !editing} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle><DialogDescription>Enter supplier details</DialogDescription></DialogHeader>
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}>
            <FormFields form={createForm} isBusy={createMutation.isPending} label="Add" />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Supplier</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))}>
            <FormFields form={editForm} isBusy={updateMutation.isPending} label="Update" />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;

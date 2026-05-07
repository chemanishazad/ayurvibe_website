import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, type PendingMedicineRow } from '@/lib/api';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { AlertCircle, ClipboardList, Loader2 } from 'lucide-react';

const completeSchema = z.object({
  uom: z.string().min(1, 'UOM is required').max(50),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 12.50)'),
  sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 25.00)'),
  category: z.string().optional(),
  minStockLevel: z.string().regex(/^\d+$/, 'Whole number (e.g. 10)').default('10'),
  expiryDate: z.string().optional(),
  description: z.string().optional(),
});
type CompleteForm = z.infer<typeof completeSchema>;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

const PendingMedicinesPage: React.FC = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<PendingMedicineRow | null>(null);

  const { data: pending = [], isLoading } = useQuery<PendingMedicineRow[]>({
    queryKey: ['medicines', 'pending'],
    queryFn: () => api.medicines.listPending(),
  });

  const { data: uomList = [] } = useQuery({
    queryKey: ['uom', 'active'],
    queryFn: () => api.uom.list(),
  });

  // Deep-link support: /admin/medicines/pending#<medicineId> auto-opens that drawer.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || pending.length === 0) return;
    const found = pending.find((p) => p.id === hash);
    if (found) setSelected(found);
  }, [pending]);

  const form = useForm<CompleteForm>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      uom: '',
      purchasePrice: '0.00',
      sellingPrice: '0.00',
      category: '',
      minStockLevel: '10',
      expiryDate: '',
      description: '',
    },
  });

  // Reset form whenever the selected pending row changes.
  useEffect(() => {
    if (!selected) return;
    form.reset({
      uom: selected.uom?.trim() || '',
      purchasePrice: Number(selected.purchasePrice ?? 0).toFixed(2),
      sellingPrice: Number(selected.sellingPrice ?? 0).toFixed(2),
      category: selected.category ?? '',
      minStockLevel: String(selected.minStockLevel ?? 10),
      expiryDate: selected.expiryDate ?? '',
      description: selected.description ?? '',
    });
    // form is stable; selected.id captures the meaningful change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const completeMutation = useMutation({
    mutationFn: (data: CompleteForm) =>
      api.medicines.complete(selected!.id, {
        uom: data.uom.trim(),
        purchasePrice: Number(data.purchasePrice),
        sellingPrice: Number(data.sellingPrice),
        category: data.category?.trim() || undefined,
        minStockLevel: Number(data.minStockLevel) || 10,
        expiryDate: data.expiryDate || undefined,
        description: data.description?.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Medicine activated', description: `${selected?.name} is now ready to use.` });
      setSelected(null);
      qc.invalidateQueries({ queryKey: ['medicines', 'pending'] });
      qc.invalidateQueries({ queryKey: ['medicines'] });
    },
    onError: (e) =>
      toast({
        title: 'Could not complete',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      }),
  });

  const stalenessDays = (createdAt?: string) => {
    if (!createdAt) return null;
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(days) ? days : null;
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Pending medicines"
        description="Medicines added on the fly during a consultation. Fill in master details so they can be sold and stocked."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Awaiting completion
            <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
              {pending.length}
            </span>
          </CardTitle>
          <CardDescription>
            Until completed, these medicines do not deduct inventory and can&apos;t be priced on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground">All caught up. No pending medicines.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Added via</th>
                    <th className="py-2 text-right">Used in</th>
                    <th className="py-2 text-left">Created</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((row) => {
                    const days = stalenessDays(row.createdAt);
                    const stale = typeof days === 'number' && days >= 60;
                    return (
                      <tr key={row.id} className="border-b">
                        <td className="py-2 font-medium">
                          {row.name}
                          {stale && (
                            <span className="ml-2 inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              stale
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {row.createdVia === 'doctor_quick_add' ? 'Doctor quick add' : row.createdVia ?? '—'}
                        </td>
                        <td className="py-2 text-right">{row.usageCount}</td>
                        <td className="py-2 text-muted-foreground">
                          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                          {typeof days === 'number' && (
                            <span className="ml-1 text-xs text-muted-foreground">({days}d ago)</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <Button size="sm" onClick={() => setSelected(row)}>
                            Complete master
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Complete master record</SheetTitle>
            <SheetDescription>
              {selected ? (
                <>
                  Filling details for <span className="font-medium text-foreground">{selected.name}</span>.
                  Saving activates it for sales and inventory.
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          {selected && (
            <form
              onSubmit={form.handleSubmit((d) => completeMutation.mutate(d))}
              className="mt-4 space-y-4"
            >
              <div>
                <Label>Unit of measure <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch('uom')}
                  onValueChange={(v) => form.setValue('uom', v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn('mt-1', form.formState.errors.uom && 'border-destructive')}>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {uomList.map((u) => (
                      <SelectItem key={u.id} value={u.code}>
                        {u.name} ({u.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={form.formState.errors.uom?.message} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Purchase price <span className="text-destructive">*</span></Label>
                  <Input
                    inputMode="decimal"
                    className={cn('mt-1', form.formState.errors.purchasePrice && 'border-destructive')}
                    {...form.register('purchasePrice')}
                  />
                  <FieldError message={form.formState.errors.purchasePrice?.message} />
                </div>
                <div>
                  <Label>Selling price <span className="text-destructive">*</span></Label>
                  <Input
                    inputMode="decimal"
                    className={cn('mt-1', form.formState.errors.sellingPrice && 'border-destructive')}
                    {...form.register('sellingPrice')}
                  />
                  <FieldError message={form.formState.errors.sellingPrice?.message} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input className="mt-1" placeholder="e.g. Tablet, Powder" {...form.register('category')} />
                </div>
                <div>
                  <Label>Min stock level</Label>
                  <Input
                    inputMode="numeric"
                    className={cn('mt-1', form.formState.errors.minStockLevel && 'border-destructive')}
                    {...form.register('minStockLevel')}
                  />
                  <FieldError message={form.formState.errors.minStockLevel?.message} />
                </div>
              </div>

              <div>
                <Label>Expiry date (optional)</Label>
                <Input type="date" className="mt-1" {...form.register('expiryDate')} />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea rows={2} {...form.register('description')} />
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                Already used in <strong>{selected.usageCount}</strong>{' '}
                {selected.usageCount === 1 ? 'place' : 'places'}. Existing prescription lines are NOT
                re-priced — historical bills stay unchanged.
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={completeMutation.isPending}>
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Activate medicine'
                  )}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PendingMedicinesPage;

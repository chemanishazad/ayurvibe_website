import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Plus, Trash2, Loader2 } from 'lucide-react';

type PackDraft = { _key: number; unitCode: string; factorToBase: string };

/**
 * Define a medicine's base unit (smallest dispensed unit) + pack units that convert to it.
 * e.g. base = tablet, packs: strip = 10, box = 100. Stock is kept in base units.
 */
export function MedicineUnitsDialog({
  medicineId,
  medicineName,
  onClose,
}: {
  medicineId: string | null;
  medicineName: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [baseUnit, setBaseUnit] = useState('');
  const [packs, setPacks] = useState<PackDraft[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['medicine-units', medicineId],
    queryFn: () => api.medicines.getUnits(medicineId!),
    enabled: !!medicineId,
  });

  useEffect(() => {
    if (!data) return;
    setBaseUnit(data.baseUnit ?? '');
    const packRows = data.units
      .filter((u) => !u.isBase && u.factorToBase > 1)
      .map((u, i) => ({ _key: i + 1, unitCode: u.unitCode, factorToBase: String(u.factorToBase) }));
    setPacks(packRows);
  }, [data]);

  const addPack = () => setPacks((p) => [...p, { _key: (p[p.length - 1]?._key ?? 0) + 1, unitCode: '', factorToBase: '' }]);
  const removePack = (key: number) => setPacks((p) => p.filter((x) => x._key !== key));
  const updatePack = (key: number, patch: Partial<PackDraft>) =>
    setPacks((p) => p.map((x) => (x._key === key ? { ...x, ...patch } : x)));

  const save = useMutation({
    mutationFn: () => {
      const base = baseUnit.trim();
      if (!base) throw new Error('Base unit is required');
      const cleanPacks = packs
        .map((p) => ({ unitCode: p.unitCode.trim(), factorToBase: parseInt(p.factorToBase, 10) }))
        .filter((p) => p.unitCode.length > 0);
      for (const p of cleanPacks) {
        if (!Number.isFinite(p.factorToBase) || p.factorToBase < 2) {
          throw new Error(`Pack "${p.unitCode || '?'}" must convert to 2 or more ${base}`);
        }
      }
      return api.medicines.setUnits(medicineId!, { baseUnit: base, packs: cleanPacks });
    },
    onSuccess: () => {
      toast({ title: 'Units saved' });
      qc.invalidateQueries({ queryKey: ['medicines'] });
      qc.invalidateQueries({ queryKey: ['medicine-units', medicineId] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  return (
    <Dialog open={!!medicineId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Units — {medicineName}</DialogTitle>
          <DialogDescription>
            Stock is counted in the base unit. Add pack units (box, strip) and how many base units each equals.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="space-y-4 py-1">
            <div>
              <Label>Base unit <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={baseUnit} onChange={(e) => setBaseUnit(e.target.value)} placeholder="e.g. tablet, ml, gm" />
              <p className="mt-1 text-xs text-muted-foreground">Smallest unit you dispense in. All stock is tracked in this.</p>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">Pack units</span>
                <Button type="button" size="sm" variant="outline" onClick={addPack}><Plus className="mr-1 h-3.5 w-3.5" />Add pack</Button>
              </div>
              <div className="space-y-2 p-3">
                {packs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No packs — this medicine is bought & sold only in {baseUnit || 'the base unit'}.</p>
                ) : (
                  packs.map((p) => (
                    <div key={p._key} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Pack name</Label>
                        <Input className="mt-1 h-9" value={p.unitCode} onChange={(e) => updatePack(p._key, { unitCode: e.target.value })} placeholder="box / strip" />
                      </div>
                      <div className="w-40">
                        <Label className="text-xs">1 {p.unitCode || 'pack'} = ? {baseUnit || 'base'}</Label>
                        <Input type="number" min={2} className="mt-1 h-9" value={p.factorToBase} onChange={(e) => updatePack(p._key, { factorToBase: e.target.value })} placeholder="10" />
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removePack(p._key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: base = <strong>tablet</strong>, strip = <strong>10</strong>, box = <strong>100</strong>. Buying 5 box adds 500 tablets to stock.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !baseUnit.trim()}>
            {save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save units'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MedicineUnitsDialog;

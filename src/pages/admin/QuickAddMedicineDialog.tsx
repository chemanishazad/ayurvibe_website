import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { api, type MedicineRow } from '@/lib/api';
import { Plus, Trash2, Loader2 } from 'lucide-react';

type PackDraft = { _key: number; unitCode: string; factorToBase: string };

/**
 * Create a full medicine master inline (without leaving the current page):
 * name + base unit (from UOM master) + optional pack conversions + default prices.
 * On save it creates the medicine, sets its units, and hands the new row back so the
 * caller can select it immediately.
 */
export function QuickAddMedicineDialog({
  open,
  initialName,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (medicine: MedicineRow) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [baseUnit, setBaseUnit] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [packs, setPacks] = useState<PackDraft[]>([]);

  // UOM master drives the base-unit picker (and lets you add a new UOM inline).
  const { data: uoms = [] } = useQuery({
    queryKey: ['uom'],
    queryFn: () => api.uom.list(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setBaseUnit('');
      setCategory('');
      setPurchasePrice('');
      setSellingPrice('');
      setMinStockLevel('10');
      setPacks([]);
    }
  }, [open, initialName]);

  const addPack = () => setPacks((p) => [...p, { _key: (p[p.length - 1]?._key ?? 0) + 1, unitCode: '', factorToBase: '' }]);
  const removePack = (key: number) => setPacks((p) => p.filter((x) => x._key !== key));
  const updatePack = (key: number, patch: Partial<PackDraft>) =>
    setPacks((p) => p.map((x) => (x._key === key ? { ...x, ...patch } : x)));

  const createUom = useMutation({
    mutationFn: (label: string) =>
      api.uom.create({ code: label.trim().toLowerCase(), name: label.trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uom'] }),
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const save = useMutation({
    mutationFn: async (): Promise<MedicineRow> => {
      const cleanName = name.trim();
      const base = baseUnit.trim();
      if (!cleanName) throw new Error('Medicine name is required');
      if (!base) throw new Error('Base unit is required');

      const cleanPacks = packs
        .map((p) => ({ unitCode: p.unitCode.trim(), factorToBase: parseInt(p.factorToBase, 10) }))
        .filter((p) => p.unitCode.length > 0);
      for (const p of cleanPacks) {
        if (!Number.isFinite(p.factorToBase) || p.factorToBase < 2) {
          throw new Error(`Pack "${p.unitCode || '?'}" must convert to 2 or more ${base}`);
        }
      }

      const created = (await api.medicines.create({
        name: cleanName,
        uom: base,
        category: category.trim() || undefined,
        purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
        sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
        minStockLevel: parseInt(minStockLevel, 10) || 10,
      })) as unknown as MedicineRow;

      // Establish base unit + pack conversions on the new master.
      await api.medicines.setUnits(created.id, { baseUnit: base, packs: cleanPacks });
      return created;
    },
    onSuccess: (created) => {
      toast({ title: 'Medicine added', description: `${created.name} is ready to purchase.` });
      qc.invalidateQueries({ queryKey: ['medicines'] });
      qc.invalidateQueries({ queryKey: ['medicine-units', created.id] });
      onCreated(created);
      onClose();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const uomOptions = uoms.map((u) => ({ value: u.code, label: u.name, hint: u.code !== u.name ? u.code : undefined }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new medicine</DialogTitle>
          <DialogDescription>
            Creates a master record with its base unit and pack sizes, then adds it to your bill.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ashwagandha" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Base unit <span className="text-destructive">*</span></Label>
              <div className="mt-1">
                <Combobox
                  options={uomOptions}
                  value={uomOptions.find((o) => o.label === baseUnit || o.value === baseUnit)?.value ?? baseUnit}
                  onChange={(v) => {
                    const picked = uomOptions.find((o) => o.value === v);
                    setBaseUnit(picked ? picked.label : v);
                  }}
                  placeholder="Select unit"
                  searchPlaceholder="Search or add unit…"
                  onCreate={(q) => { createUom.mutate(q); setBaseUnit(q); }}
                  createLabel={(q) => `Add unit “${q}”`}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Smallest unit you dispense in.</p>
            </div>
            <div>
              <Label>Category</Label>
              <Input className="mt-1" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Cost price</Label>
              <Input type="number" min={0} step="0.01" className="mt-1" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Sell price</Label>
              <Input type="number" min={0} step="0.01" className="mt-1" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Min stock</Label>
              <Input type="number" min={0} className="mt-1" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} />
            </div>
          </div>

          {/* Pack units */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
              <span className="text-sm font-medium">Pack units (optional)</span>
              <Button type="button" size="sm" variant="outline" onClick={addPack}><Plus className="mr-1 h-3.5 w-3.5" />Add pack</Button>
            </div>
            <div className="space-y-2 p-3">
              {packs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No packs — bought & sold in {baseUnit || 'the base unit'} only. Add e.g. strip = 10, box = 100.
                </p>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim() || !baseUnit.trim()}>
            {save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Add medicine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddMedicineDialog;

import React, { useEffect, useRef, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type FoodRelation = '' | 'before_food' | 'after_food' | 'along_with_food';

type EditableRow = {
  medicineId: string;
  medicineName: string;
  dosage: string;
  durationDays: string;
  timeMorning: boolean;
  timeAfternoon: boolean;
  timeNight: boolean;
  foodRelation: FoodRelation;
  quantity: string;
  withHotWater: boolean;
  withMilk: boolean;
  withHoney: boolean;
  withGhee: boolean;
  withGingerJuice: boolean;
  withLemonJuice: boolean;
};

const emptyRow = (): EditableRow => ({
  medicineId: '',
  medicineName: '',
  dosage: '',
  durationDays: '',
  timeMorning: false,
  timeAfternoon: false,
  timeNight: false,
  foodRelation: '',
  quantity: '',
  withHotWater: false,
  withMilk: false,
  withHoney: false,
  withGhee: false,
  withGingerJuice: false,
  withLemonJuice: false,
});

const normalizeFoodRelation = (v: unknown): FoodRelation =>
  v === 'before_food' || v === 'after_food' || v === 'along_with_food' ? v : '';

const rowsFromPrescription = (prescription: unknown): EditableRow[] => {
  if (!Array.isArray(prescription)) return [];
  return (prescription as Record<string, unknown>[]).map((p) => ({
    medicineId: String(p.medicineId ?? ''),
    medicineName: String(p.medicineName ?? ''),
    dosage: String(p.dosage ?? ''),
    durationDays: p.durationDays != null ? String(p.durationDays) : '',
    timeMorning: Boolean(p.timeMorning),
    timeAfternoon: Boolean(p.timeAfternoon),
    timeNight: Boolean(p.timeNight),
    foodRelation: normalizeFoodRelation(p.foodRelation),
    quantity: String(p.quantity ?? ''),
    withHotWater: Boolean(p.withHotWater),
    withMilk: Boolean(p.withMilk),
    withHoney: Boolean(p.withHoney),
    withGhee: Boolean(p.withGhee),
    withGingerJuice: Boolean(p.withGingerJuice),
    withLemonJuice: Boolean(p.withLemonJuice),
  }));
};

type Props = {
  consultationId: string;
  prescription: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the updated consultation returned by the API. */
  onSaved: (updated: Record<string, unknown>) => void;
};

/** Admin/doctor edit of an existing consultation's prescription (full replace on save). */
const EditPrescriptionDialog = ({ consultationId, prescription, open, onOpenChange, onSaved }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [medicinesMaster, setMedicinesMaster] = useState<{ id: string; name: string }[]>([]);
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [medicineBusyIndex, setMedicineBusyIndex] = useState<number | null>(null);
  const ensureInFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    setRows(rowsFromPrescription(prescription));
    setPickerOpen(null);
    setPickerSearch('');
    api.medicines
      .list()
      .then((data) =>
        setMedicinesMaster((data as { id: string; name: string }[]).map((m) => ({ id: m.id, name: m.name })))
      )
      .catch(() => setMedicinesMaster([]));
    // Rows intentionally snapshot the prescription only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateRow = (idx: number, patch: Partial<EditableRow>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const selectMedicine = (idx: number, med: { id: string; name: string }) => {
    updateRow(idx, { medicineId: med.id, medicineName: med.name });
    setPickerOpen(null);
    setPickerSearch('');
  };

  const commitMedicineFromSearch = async (idx: number) => {
    const q = pickerSearch.trim();
    if (!q || ensureInFlight.current) return;
    const exact = medicinesMaster.find((m) => m.name.trim().toLowerCase() === q.toLowerCase());
    if (exact) {
      selectMedicine(idx, exact);
      return;
    }
    ensureInFlight.current = true;
    setMedicineBusyIndex(idx);
    try {
      const row = (await api.medicines.findOrCreateByName(q)) as { id: string; name: string };
      setMedicinesMaster((prev) => {
        const next = prev.filter((x) => x.id !== row.id);
        next.push({ id: row.id, name: row.name });
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      selectMedicine(idx, { id: row.id, name: row.name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Try again';
      toast({ title: 'Could not add medicine', description: msg, variant: 'destructive' });
    } finally {
      ensureInFlight.current = false;
      setMedicineBusyIndex(null);
    }
  };

  const handleSave = async () => {
    const filled = rows.filter((r) => r.medicineId || r.medicineName.trim());
    setSaving(true);
    try {
      const payload = filled.map((r) => ({
        ...(r.medicineId ? { medicineId: r.medicineId } : { medicineName: r.medicineName.trim() }),
        dosage: r.dosage || undefined,
        durationDays: r.durationDays.trim() === '' ? undefined : Number(r.durationDays),
        timeMorning: r.timeMorning,
        timeAfternoon: r.timeAfternoon,
        timeNight: r.timeNight,
        foodRelation: r.foodRelation || undefined,
        quantity: r.quantity || undefined,
        withHotWater: r.withHotWater,
        withMilk: r.withMilk,
        withHoney: r.withHoney,
        withGhee: r.withGhee,
        withGingerJuice: r.withGingerJuice,
        withLemonJuice: r.withLemonJuice,
      }));
      const updated = await api.consultations.updatePrescription(consultationId, payload);
      toast({ title: 'Prescription updated' });
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Failed to update prescription',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit prescription</DialogTitle>
          <DialogDescription>
            Changes replace the saved prescription for this consultation and appear on reprints.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
          {rows.length === 0 && (
            <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              No prescription rows. Add a medicine below.
            </p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border bg-gradient-to-b from-white to-emerald-50/20 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Medicine</Label>
                  <div className="mt-1">
                    <Popover
                      open={pickerOpen === i}
                      onOpenChange={(o) => {
                        setPickerOpen(o ? i : null);
                        if (!o) setPickerSearch('');
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" size="sm" className="w-full justify-between gap-2 font-normal">
                          <span className="min-w-0 flex-1 truncate text-left">
                            {r.medicineName?.trim() ? r.medicineName : 'Select or type new medicine'}
                          </span>
                          {medicineBusyIndex === i ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-70" aria-hidden />
                          ) : null}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search or type name — Enter adds to master if new"
                            value={pickerSearch}
                            onValueChange={setPickerSearch}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter') return;
                              const q = pickerSearch.trim();
                              if (!q) return;
                              e.preventDefault();
                              e.stopPropagation();
                              void commitMedicineFromSearch(i);
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              Type a medicine name and press Enter to add it to the master list.
                            </CommandEmpty>
                            <CommandGroup>
                              {medicinesMaster
                                .filter((med) => med.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()))
                                .map((med) => (
                                  <CommandItem key={med.id} value={`${med.name}__${med.id}`} onSelect={() => selectMedicine(i, med)}>
                                    {med.name}
                                  </CommandItem>
                                ))}
                              {(() => {
                                const q = pickerSearch.trim();
                                const exact = medicinesMaster.some(
                                  (m) => m.name.trim().toLowerCase() === q.toLowerCase(),
                                );
                                if (!q || exact) return null;
                                return (
                                  <CommandItem
                                    value={`__new__${q}`}
                                    disabled={medicineBusyIndex === i}
                                    onSelect={() => {
                                      void commitMedicineFromSearch(i);
                                    }}
                                  >
                                    Add &quot;{q}&quot; to master (same as Enter)
                                  </CommandItem>
                                );
                              })()}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  title="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Dosage</Label>
                  <Input className="h-9 mt-1" placeholder="e.g. 1 tab" value={r.dosage} onChange={(e) => updateRow(i, { dosage: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duration (days)</Label>
                  <Input type="number" className="h-9 mt-1" placeholder="e.g. 7" value={r.durationDays} onChange={(e) => updateRow(i, { durationDays: e.target.value })} min={0} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <Input className="h-9 mt-1" placeholder="e.g. 10 tabs" value={r.quantity} onChange={(e) => updateRow(i, { quantity: e.target.value })} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-white/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Time</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ['Morning', 'timeMorning'],
                      ['Afternoon', 'timeAfternoon'],
                      ['Night', 'timeNight'],
                    ] as const).map(([label, key]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={r[key]} onCheckedChange={(v) => updateRow(i, { [key]: Boolean(v) } as Partial<EditableRow>)} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border bg-white/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Route of administration</p>
                  <RadioGroup
                    value={r.foodRelation || 'none'}
                    onValueChange={(v) => updateRow(i, { foodRelation: (v === 'none' ? '' : v) as FoodRelation })}
                    className="grid grid-cols-1 gap-2"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="before_food" />
                      Before food
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="after_food" />
                      After food
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="along_with_food" />
                      Along with food
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RadioGroupItem value="none" />
                      External use
                    </label>
                  </RadioGroup>
                </div>

                <div className="rounded-lg border bg-white/60 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">With</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['Hot water', 'withHotWater'],
                      ['Milk', 'withMilk'],
                      ['Honey', 'withHoney'],
                      ['Ghee', 'withGhee'],
                      ['Ginger juice', 'withGingerJuice'],
                      ['Lemon juice', 'withLemonJuice'],
                    ] as const).map(([label, key]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={r[key]} onCheckedChange={(v) => updateRow(i, { [key]: Boolean(v) } as Partial<EditableRow>)} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button size="sm" variant="outline" onClick={() => setRows((rs) => [...rs, emptyRow()])}>
            <Plus className="h-4 w-4 mr-1" /> Add medicine
          </Button>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t pt-3 sm:justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block self-center">
            {rows.filter((r) => r.medicineId || r.medicineName.trim()).length} medicine(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Save prescription'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPrescriptionDialog;

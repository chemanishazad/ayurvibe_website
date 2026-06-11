import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, type ExpiringBatchRow } from '@/lib/api';
import { localDateYmd, formatIsoDateToApp } from '@/lib/datetime';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { MedicineBatchPanel } from '@/components/admin/MedicineBatchPanel';
import { AlertTriangle, Plus, Truck, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const InventoryPage = () => {
  const { effectiveClinicId: targetClinicId } = useAdminClinic();
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [medicines, setMedicines] = useState<{ id: string; name: string; uom: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [uoms, setUoms] = useState<{ id: string; code: string; name: string }[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [lowStock, setLowStock] = useState<Record<string, unknown>[]>([]);
  const [expiring, setExpiring] = useState<ExpiringBatchRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [form, setForm] = useState({ medicineId: '', quantity: '', purchasePrice: '', sellingPrice: '', uomCode: '' });
  const [purchaseForm, setPurchaseForm] = useState({
    medicineId: '',
    supplierId: '',
    quantity: '',
    unitPurchasePrice: '',
    sellingPrice: '',
    purchaseDate: localDateYmd(),
    expiryDate: '',
    batchNumber: '',
    uomCode: '',
  });
  const { toast } = useToast();

  const selectedPurchaseMedicine = useMemo(
    () => medicines.find((m) => m.id === purchaseForm.medicineId) || null,
    [medicines, purchaseForm.medicineId]
  );
  const selectedManualMedicine = useMemo(
    () => medicines.find((m) => m.id === form.medicineId) || null,
    [medicines, form.medicineId]
  );
  const selectedPurchaseUom = useMemo(
    () => uoms.find((u) => u.code === purchaseForm.uomCode) || null,
    [uoms, purchaseForm.uomCode]
  );
  const selectedManualUom = useMemo(
    () => uoms.find((u) => u.code === form.uomCode) || null,
    [uoms, form.uomCode]
  );

  useEffect(() => {
    api.clinics.list().then(setClinics).catch(() => setClinics([]));
    api.medicines
      .list()
      .then((data) => setMedicines(data as { id: string; name: string; uom: string }[]))
      .catch(() => setMedicines([]));
    api.suppliers.list().then((data) => setSuppliers(data as { id: string; name: string }[])).catch(() => setSuppliers([]));
    api.uom.list().then(setUoms).catch(() => setUoms([]));
  }, []);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
      api.inventory.lowStock(targetClinicId).then(setLowStock).catch(() => setLowStock([]));
      api.inventory.expiring(targetClinicId, 90).then(setExpiring).catch(() => setExpiring([]));
    } else {
      setInventory([]);
      setLowStock([]);
      setExpiring([]);
    }
    setExpandedId(null);
  }, [targetClinicId]);

  const handleAddStock = async () => {
    if (!targetClinicId || !form.medicineId) {
      toast({ title: 'Clinic and medicine required', variant: 'destructive' });
      return;
    }
    const qty = parseInt(form.quantity, 10) || 0;
    if (qty < 1) {
      toast({ title: 'Quantity must be at least 1', variant: 'destructive' });
      return;
    }
    try {
      await api.inventory.update({
        clinicId: targetClinicId,
        medicineId: form.medicineId,
        quantity: qty,
        purchasePrice: form.purchasePrice || '0',
        sellingPrice: form.sellingPrice || '0',
      });
      toast({ title: 'Stock added' });
      setShowForm(false);
      setForm({ medicineId: '', quantity: '', purchasePrice: '', sellingPrice: '', uomCode: '' });
      api.inventory.list(targetClinicId).then(setInventory);
      api.inventory.lowStock(targetClinicId).then(setLowStock);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const handlePurchase = async () => {
    if (!targetClinicId || !purchaseForm.medicineId || !purchaseForm.supplierId || !purchaseForm.quantity || !purchaseForm.unitPurchasePrice) {
      toast({ title: 'Clinic, medicine, supplier, quantity and purchase price required', variant: 'destructive' });
      return;
    }
    try {
      await api.purchases.create({
        clinicId: targetClinicId,
        medicineId: purchaseForm.medicineId,
        supplierId: purchaseForm.supplierId,
        quantity: parseInt(purchaseForm.quantity, 10) || 0,
        unitPurchasePrice: parseFloat(purchaseForm.unitPurchasePrice) || 0,
        sellingPrice: purchaseForm.sellingPrice ? parseFloat(purchaseForm.sellingPrice) : undefined,
        purchaseDate: purchaseForm.purchaseDate || undefined,
        expiryDate: purchaseForm.expiryDate || undefined,
        batchNumber: purchaseForm.batchNumber.trim() || undefined,
      });
      toast({ title: 'Purchase recorded' });
      setShowPurchase(false);
      setPurchaseForm({
        medicineId: '',
        supplierId: '',
        quantity: '',
        unitPurchasePrice: '',
        sellingPrice: '',
        purchaseDate: localDateYmd(),
        expiryDate: '',
        batchNumber: '',
        uomCode: '',
      });
      api.inventory.list(targetClinicId).then(setInventory);
      api.inventory.lowStock(targetClinicId).then(setLowStock);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Inventory" description="Clinic-wise medicine stock">
        <div className="flex items-center gap-2">
          {targetClinicId && (
            <>
              <Button variant="default" onClick={() => setShowPurchase(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Purchase (Supplier)
              </Button>
              <Button variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Stock
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((l, i) => (
                <span key={i} className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
                  {(l as { medicineName: string }).medicineName} – {(l as { currentStock: number }).currentStock} left
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {expiring.length > 0 && (() => {
        const todayYmd = localDateYmd();
        const expiredCount = expiring.filter((e) => e.expiryDate && e.expiryDate < todayYmd).length;
        const ordered = [...expiring].sort((a, b) => (a.expiryDate ?? '') < (b.expiryDate ?? '') ? -1 : 1);
        return (
          <Card className="overflow-hidden border-amber-300/70">
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Expiry attention</span>
              <span className="ml-auto flex items-center gap-2 text-xs">
                {expiredCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">{expiredCount} expired</span>
                )}
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">{expiring.length - expiredCount} within 90 days</span>
              </span>
            </div>
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-2">
                {ordered.map((e) => {
                  const isExpired = !!e.expiryDate && e.expiryDate < todayYmd;
                  return (
                    <span
                      key={e.id}
                      className={
                        isExpired
                          ? 'inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700'
                          : 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800'
                      }
                      title={`${e.batchNumber ?? 'No batch'} · ${e.remainingQuantity} left · ${e.supplierName ?? ''}`}
                    >
                      <span className="font-semibold">{e.medicineName}</span>
                      <span className="opacity-70">·</span>
                      <span>{formatIsoDateToApp(e.expiryDate)}</span>
                      <span className="opacity-70">·</span>
                      <span>{e.remainingQuantity} left</span>
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle>Stock by Clinic</CardTitle>
          <CardDescription>Current inventory levels — click a row to see its batches, costs &amp; movement.</CardDescription>
        </CardHeader>
        <CardContent>
          {!targetClinicId ? (
            <p className="text-muted-foreground">
              Choose a clinic from the header dropdown, or add a clinic under Administration → Clinics.
            </p>
          ) : inventory.length === 0 ? (
            <p className="text-muted-foreground">No inventory. Add stock for medicines.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="w-8 py-2" />
                    <th className="text-left py-2">Medicine</th>
                    <th className="text-left py-2">UOM</th>
                    <th className="text-right py-2">Stock</th>
                    <th className="text-right py-2">Min</th>
                    <th className="text-right py-2">Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => {
                    const row = inv as {
                      id: string; medicineId: string; medicineName: string; uom: string;
                      currentStock: number; minStockLevel: number; sellingPrice: string;
                      baseUnit?: string | null; stockBreakdown?: string;
                    };
                    const base = row.baseUnit || row.uom || 'unit';
                    const open = expandedId === row.id;
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className="border-b cursor-pointer hover:bg-muted/30"
                          onClick={() => setExpandedId(open ? null : row.id)}
                        >
                          <td className="py-2 pl-1 text-muted-foreground">
                            <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="py-2 font-medium">{row.medicineName}</td>
                          <td className="py-2">{row.uom}</td>
                          <td className="py-2 text-right">
                            {row.currentStock}
                            {row.stockBreakdown && row.stockBreakdown !== `${row.currentStock} ${base}` ? (
                              <div className="text-xs text-muted-foreground">{row.stockBreakdown}</div>
                            ) : null}
                          </td>
                          <td className="py-2 text-right">{row.minStockLevel}</td>
                          <td className="py-2 text-right">₹{row.sellingPrice}</td>
                        </tr>
                        {open && (
                          <tr className="border-b bg-muted/10">
                            <td colSpan={6} className="p-3">
                              {targetClinicId && (
                                <MedicineBatchPanel clinicId={targetClinicId} medicineId={row.medicineId} baseUnit={base} />
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase from Supplier</DialogTitle>
            <DialogDescription>Add stock with supplier. FIFO: first bought first sold.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Medicine</Label>
              <Select value={purchaseForm.medicineId} onValueChange={(v) => setPurchaseForm((f) => ({ ...f, medicineId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.uom ? `(${m.uom})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPurchaseMedicine && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Default UOM: <span className="font-medium">{selectedPurchaseMedicine.uom}</span>
                </p>
              )}
            </div>
            <div>
              <Label>UOM for this purchase</Label>
              <Select
                value={purchaseForm.uomCode || selectedPurchaseMedicine?.uom || ''}
                onValueChange={(v) => setPurchaseForm((f) => ({ ...f, uomCode: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uoms.map((u) => (
                    <SelectItem key={u.id} value={u.code}>
                      {u.name} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPurchaseUom && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selectedPurchaseUom.name}</span>
                </p>
              )}
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={purchaseForm.supplierId} onValueChange={(v) => setPurchaseForm((f) => ({ ...f, supplierId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Quantity
                {selectedPurchaseUom?.code
                  ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (in {selectedPurchaseUom.code})
                    </span>
                  )
                  : selectedPurchaseMedicine?.uom ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (in {selectedPurchaseMedicine.uom})
                    </span>
                  ) : null}
                </Label>
                <Input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  value={purchaseForm.unitPurchasePrice}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, unitPurchasePrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={purchaseForm.sellingPrice}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch number</Label>
                <Input
                  value={purchaseForm.batchNumber}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="Manufacturer batch / lot"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={purchaseForm.expiryDate}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePurchase}>Record Purchase</Button>
              <Button variant="outline" onClick={() => setShowPurchase(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Stock</DialogTitle>
            <DialogDescription>Add quantity to stock (no supplier tracking). Purchase and selling only update stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Medicine</Label>
              <Select value={form.medicineId} onValueChange={(v) => setForm((f) => ({ ...f, medicineId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.uom ? `(${m.uom})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedManualMedicine && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Default UOM: <span className="font-medium">{selectedManualMedicine.uom}</span>
                </p>
              )}
            </div>
            <div>
              <Label>UOM for this stock</Label>
              <Select
                value={form.uomCode || selectedManualMedicine?.uom || ''}
                onValueChange={(v) => setForm((f) => ({ ...f, uomCode: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uoms.map((u) => (
                    <SelectItem key={u.id} value={u.code}>
                      {u.name} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedManualUom && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selectedManualUom.name}</span>
                </p>
              )}
            </div>
            <div>
              <Label>
                Quantity to Add
                {selectedManualUom?.code
                  ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (in {selectedManualUom.code})
                  </span>
                  )
                  : selectedManualMedicine?.uom ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (in {selectedManualMedicine.uom})
                    </span>
                  ) : null}
              </Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                />
              </div>
              <div>
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={form.sellingPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStock}>Add Stock</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;

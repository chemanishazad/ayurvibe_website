import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { AlertTriangle, Plus } from 'lucide-react';

const InventoryPage = () => {
  const user = getAuthUser();
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [medicines, setMedicines] = useState<{ id: string; name: string }[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [lowStock, setLowStock] = useState<Record<string, unknown>[]>([]);
  const [clinicId, setClinicId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medicineId: '', currentStock: '', purchasePrice: '', sellingPrice: '' });
  const { toast } = useToast();

  const targetClinicId = user?.role === 'admin' ? clinicId : user?.clinicId;

  useEffect(() => {
    api.clinics.list().then(setClinics).catch(() => setClinics([]));
    api.medicines.list().then((data) => setMedicines(data as { id: string; name: string }[])).catch(() => setMedicines([]));
  }, []);

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
      api.inventory.lowStock(targetClinicId).then(setLowStock).catch(() => setLowStock([]));
    } else {
      setInventory([]);
      setLowStock([]);
    }
  }, [targetClinicId]);

  const handleAddStock = async () => {
    if (!targetClinicId || !form.medicineId) {
      toast({ title: 'Clinic and medicine required', variant: 'destructive' });
      return;
    }
    try {
      await api.inventory.update({
        clinicId: targetClinicId,
        medicineId: form.medicineId,
        currentStock: parseInt(form.currentStock, 10) || 0,
        purchasePrice: form.purchasePrice || '0',
        sellingPrice: form.sellingPrice || '0',
      });
      toast({ title: 'Inventory updated' });
      setShowForm(false);
      setForm({ medicineId: '', currentStock: '', purchasePrice: '', sellingPrice: '' });
      api.inventory.list(targetClinicId).then(setInventory);
      api.inventory.lowStock(targetClinicId).then(setLowStock);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Clinic-wise medicine stock</p>
        </div>
        {user?.role === 'admin' && clinics.length > 1 && (
          <Select value={clinicId} onValueChange={setClinicId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {targetClinicId && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add / Update Stock
          </Button>
        )}
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Stock by Clinic</CardTitle>
          <CardDescription>Current inventory levels</CardDescription>
        </CardHeader>
        <CardContent>
          {!targetClinicId ? (
            <p className="text-muted-foreground">Select a clinic to view inventory</p>
          ) : inventory.length === 0 ? (
            <p className="text-muted-foreground">No inventory. Add stock for medicines.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Medicine</th>
                    <th className="text-left py-2">UOM</th>
                    <th className="text-right py-2">Stock</th>
                    <th className="text-right py-2">Min</th>
                    <th className="text-right py-2">Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => (
                    <tr key={(inv as { id: string }).id} className="border-b">
                      <td className="py-2">{(inv as { medicineName: string }).medicineName}</td>
                      <td className="py-2">{(inv as { uom: string }).uom}</td>
                      <td className="py-2 text-right">{(inv as { currentStock: number }).currentStock}</td>
                      <td className="py-2 text-right">{(inv as { minStockLevel: number }).minStockLevel}</td>
                      <td className="py-2 text-right">₹{(inv as { sellingPrice: string }).sellingPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add / Update Stock</CardTitle>
            <CardDescription>Set stock for a medicine at this clinic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Medicine</Label>
              <Select value={form.medicineId} onValueChange={(v) => setForm((f) => ({ ...f, medicineId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Stock</Label>
              <Input
                type="number"
                value={form.currentStock}
                onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))}
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
              <Button onClick={handleAddStock}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryPage;

import React, { useState, useEffect } from 'react';
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
import { api } from '@/lib/api';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const DirectSalesPage = () => {
  const { effectiveClinicId } = useAdminClinic();
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [sales, setSales] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState('');
  const [form, setForm] = useState({
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    customerName: '',
    customerMobile: '',
    items: [] as { inventoryId: string; medicineId: string; medicineName: string; quantity: number; unitPrice: number }[],
  });
  const { toast } = useToast();

  const targetClinicId = effectiveClinicId ?? undefined;

  useEffect(() => {
    if (targetClinicId) {
      api.inventory.list(targetClinicId).then(setInventory).catch(() => setInventory([]));
      api.directSales.list({ clinicId: targetClinicId, from: form.saleDate, to: form.saleDate }).then(setSales).catch(() => setSales([]));
    } else {
      setInventory([]);
      setSales([]);
    }
  }, [targetClinicId, form.saleDate]);

  const addItem = () => {
    const inv = inventory[0] as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
    if (!inv) return;
    setForm((f) => ({
      ...f,
      items: [...f.items, { inventoryId: inv.id, medicineId: inv.medicineId, medicineName: inv.medicineName || 'Medicine', quantity: 1, unitPrice: parseFloat(inv.sellingPrice as string) || 0 }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: number | string) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const totalAmount = form.items.reduce((s, m) => s + m.quantity * m.unitPrice, 0);

  const handleSubmit = async () => {
    if (!targetClinicId || form.items.length === 0) {
      toast({ title: 'Missing data', description: 'Select clinic and add at least one medicine', variant: 'destructive' });
      return;
    }
    const customerName = form.customerName.trim();
    if (!customerName) {
      toast({ title: 'Customer name required', description: 'Enter a name for this walk-in sale.', variant: 'destructive' });
      return;
    }
    const mobileDigits = form.customerMobile.replace(/\D/g, '');
    if (form.customerMobile.trim() && mobileDigits.length !== 10) {
      toast({ title: 'Invalid mobile', description: 'Enter a 10-digit mobile number or leave it blank.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.directSales.create({
        clinicId: targetClinicId,
        saleDate: form.saleDate,
        customerName,
        customerMobile: mobileDigits.length === 10 ? mobileDigits : undefined,
        items: form.items.map((m) => ({
          inventoryId: m.inventoryId,
          medicineId: m.medicineId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      });
      toast({ title: 'Sale recorded', description: `Total: ₹${totalAmount}` });
      setForm((f) => ({ ...f, items: [], customerMobile: '' }));
      api.directSales.list({ clinicId: targetClinicId, from: form.saleDate, to: form.saleDate }).then(setSales);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Direct Medicine Sales" description="Walk-in sales (without consultation)" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
            <CardDescription>Record walk-in medicine sale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sale Date</Label>
              <Input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Customer name</Label>
                <Input
                  placeholder="e.g. Walk-in customer"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Mobile (optional)</Label>
                <Input
                  placeholder="10-digit number"
                  inputMode="numeric"
                  value={form.customerMobile}
                  onChange={(e) => setForm((f) => ({ ...f, customerMobile: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button size="sm" variant="outline" onClick={addItem} disabled={!targetClinicId || inventory.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {form.items.length > 0 && (
                <div className="mt-2 space-y-2">
                  {form.items.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center rounded border p-2">
                      <Select
                        value={m.inventoryId}
                        onValueChange={(v) => {
                          const inv = inventory.find((x) => (x as { id: string }).id === v) as { id: string; medicineId: string; medicineName: string; sellingPrice: string };
                          if (inv) {
                            updateItem(i, 'inventoryId', v);
                            updateItem(i, 'medicineId', inv.medicineId);
                            updateItem(i, 'medicineName', inv.medicineName || '');
                            updateItem(i, 'unitPrice', parseFloat(inv.sellingPrice) || 0);
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((inv) => (
                            <SelectItem key={(inv as { id: string }).id} value={(inv as { id: string }).id}>
                              {(inv as { medicineName: string }).medicineName} ({(inv as { currentStock: number }).currentStock} left)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-16"
                        value={m.quantity}
                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)}
                        min={1}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        value={m.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)}
                      />
                      <span className="text-sm">= ₹{m.quantity * m.unitPrice}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={loading || !targetClinicId || form.items.length === 0} className="w-full">
              {loading ? 'Saving...' : 'Record Sale'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Direct Sales</CardTitle>
            <CardDescription>Walk-in sales for selected date</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p className="text-muted-foreground">No direct sales for this date</p>
            ) : (
              <div className="space-y-2">
                {sales.map((s) => (
                  <div key={s.id as string} className="flex justify-between rounded border p-3 text-sm">
                    <div>
                      <p className="font-medium">{s.medicineName as string}</p>
                      <p className="text-muted-foreground">
                        {(s.quantity as number)} × ₹{s.unitPrice as string}
                        {(s.customerName as string) ? ` · ${s.customerName as string}` : ''}
                      </p>
                    </div>
                    <span className="font-medium">₹{s.total as string}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectSalesPage;

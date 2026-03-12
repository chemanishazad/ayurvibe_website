import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { Plus, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Medicine {
  id: string;
  name: string;
  uom: string;
  purchasePrice: string;
  sellingPrice: string;
  minStockLevel: number;
  description?: string;
}

const MedicinesPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({
    name: '',
    uom: 'tablet',
    purchasePrice: '',
    sellingPrice: '',
    minStockLevel: '10',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    api.medicines.list().then((data) => setMedicines(data as Medicine[])).catch(() => setMedicines([])).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.medicines.create({
        name: form.name.trim(),
        uom: form.uom,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        minStockLevel: parseInt(form.minStockLevel, 10) || 10,
        description: form.description || undefined,
      });
      toast({ title: 'Medicine added' });
      setShowForm(false);
      setForm({ name: '', uom: 'tablet', purchasePrice: '', sellingPrice: '', minStockLevel: '10', description: '' });
      api.medicines.list().then((data) => setMedicines(data as Medicine[]));
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      await api.medicines.update(editing.id, {
        name: form.name.trim(),
        uom: form.uom,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        minStockLevel: parseInt(form.minStockLevel, 10) || 10,
        description: form.description || undefined,
      });
      toast({ title: 'Medicine updated' });
      setEditing(null);
      api.medicines.list().then((data) => setMedicines(data as Medicine[]));
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({
      name: m.name,
      uom: m.uom,
      purchasePrice: m.purchasePrice,
      sellingPrice: m.sellingPrice,
      minStockLevel: String(m.minStockLevel),
      description: m.description || '',
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Medicine Master" description="Manage medicine catalog (Admin only for add/edit)">
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', uom: 'tablet', purchasePrice: '', sellingPrice: '', minStockLevel: '10', description: '' }); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Medicines</CardTitle>
          <CardDescription>All medicines in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : medicines.length === 0 ? (
            <p className="text-muted-foreground">No medicines. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">UOM</th>
                    <th className="text-right py-2">Purchase</th>
                    <th className="text-right py-2">Selling</th>
                    <th className="text-right py-2">Min Stock</th>
                    {isAdmin && <th className="text-right py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2">{m.name}</td>
                      <td className="py-2">{m.uom}</td>
                      <td className="py-2 text-right">₹{m.purchasePrice}</td>
                      <td className="py-2 text-right">₹{m.sellingPrice}</td>
                      <td className="py-2 text-right">{m.minStockLevel}</td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
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
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
            <DialogDescription>Enter medicine details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Medicine name" />
            </div>
            <div>
              <Label>UOM</Label>
              <Input value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} placeholder="tablet, bottle, strip" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} />
              </div>
              <div>
                <Label>Selling Price (₹)</Label>
                <Input type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input type="number" value={form.minStockLevel} onChange={(e) => setForm((f) => ({ ...f, minStockLevel: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>UOM</Label>
              <Input value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} />
              </div>
              <div>
                <Label>Selling Price (₹)</Label>
                <Input type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Min Stock Level</Label>
              <Input type="number" value={form.minStockLevel} onChange={(e) => setForm((f) => ({ ...f, minStockLevel: e.target.value }))} />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicinesPage;

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
import FullScreenLoader from '@/components/FullScreenLoader';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
}

const SuppliersPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', address: '' });
  const { toast } = useToast();

  useEffect(() => {
    api.suppliers.list().then((data) => setSuppliers(data as Supplier[])).catch(() => setSuppliers([])).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.suppliers.create({
        name: form.name.trim(),
        contact: form.contact || undefined,
        address: form.address || undefined,
      });
      toast({ title: 'Supplier added' });
      setShowForm(false);
      setForm({ name: '', contact: '', address: '' });
      api.suppliers.list().then((data) => setSuppliers(data as Supplier[]));
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
      await api.suppliers.update(editing.id, {
        name: form.name.trim(),
        contact: form.contact || undefined,
        address: form.address || undefined,
      });
      toast({ title: 'Supplier updated' });
      setEditing(null);
      api.suppliers.list().then((data) => setSuppliers(data as Supplier[]));
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.name}"? This fails if they have purchase history.`)) return;
    try {
      await api.suppliers.delete(s.id);
      toast({ title: 'Supplier deleted' });
      api.suppliers.list().then((data) => setSuppliers(data as Supplier[]));
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact: s.contact || '',
      address: s.address || '',
    });
  };

  if (loading) {
    return <FullScreenLoader label="Loading suppliers..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Suppliers" description="Manage suppliers. Same product can have different prices per supplier.">
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', contact: '', address: '' }); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>All suppliers. Use Purchase flow in Inventory to add stock with supplier & price.</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground">No suppliers. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Contact</th>
                    <th className="text-left py-2">Address</th>
                    {isAdmin && <th className="text-right py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">{s.contact || '—'}</td>
                      <td className="py-2">{s.address || '—'}</td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s)}>
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
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Enter supplier details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Supplier name" />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Phone / email" />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} placeholder="Address" />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;

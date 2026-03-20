import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';

type UomRow = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

const UomAdminPage = () => {
  const user = getAuthUser();
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [rows, setRows] = useState<UomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UomRow | null>(null);
  const [form, setForm] = useState({ code: '', name: '', sortOrder: '0' });
  const { toast } = useToast();

  const refresh = () =>
    api.uom.listAll().then((data) => setRows(data as UomRow[])).catch(() => setRows([]));

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: 'Code and name required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.uom.create({
        code: form.code.trim(),
        name: form.name.trim(),
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: true,
      });
      toast({ title: 'Unit created' });
      setShowForm(false);
      setForm({ code: '', name: '', sortOrder: '0' });
      await refresh();
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
      await api.uom.update(editing.id, {
        code: form.code.trim() || undefined,
        name: form.name.trim() || undefined,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      });
      toast({ title: 'Unit updated' });
      setEditing(null);
      await refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (r: UomRow) => {
    try {
      await api.uom.update(r.id, { isActive: !r.isActive });
      toast({
        title: r.isActive ? 'Hidden from new dropdowns' : 'Shown in dropdowns again',
      });
      await refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (r: UomRow) => {
    if (!confirm(`Delete unit "${r.code}"? Fails if still referenced.`)) return;
    try {
      await api.uom.delete(r.id);
      toast({ title: 'Deleted' });
      await refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  if (loading && rows.length === 0) {
    return <FullScreenLoader label="Loading units..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Units (UOM)"
        description="Short codes for medicines and stock (tablet, ml, strip, …). Active units appear in dropdowns when adding inventory; inactive ones stay on old records only."
      >
        <Button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setForm({ code: '', name: '', sortOrder: '0' });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add unit
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Master list</CardTitle>
          <CardDescription>
            <strong>Active</strong> = offered when you pick a unit for medicines or inventory. <strong>Inactive</strong> = hidden from those lists;
            existing lines that already use the unit are not changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Code</th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-right">Sort</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 font-mono text-xs">{r.code}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right">{r.sortOrder}</td>
                    <td className="py-2">
                      {r.isActive ? (
                        <Badge variant="secondary">In dropdowns</Badge>
                      ) : (
                        <Badge variant="outline">Hidden from lists</Badge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
                          {r.isActive ? 'Hide from lists' : 'Show in lists'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(r);
                            setForm({
                              code: r.code,
                              name: r.name,
                              sortOrder: String(r.sortOrder),
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New unit</DialogTitle>
            <DialogDescription>Short code must be unique (e.g. tablet, ml).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UomAdminPage;

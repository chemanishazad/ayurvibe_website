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
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import FullScreenLoader from '@/components/FullScreenLoader';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ClinicsPage = () => {
  const user = getAuthUser();
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [rows, setRows] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState('');
  const { toast } = useToast();
  const { refreshClinics } = useAdminClinic();

  const refresh = () =>
    api.clinics
      .list()
      .then(setRows)
      .catch(() => setRows([]));

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.clinics.create(name.trim());
      toast({ title: 'Clinic created' });
      setShowForm(false);
      setName('');
      await refresh();
      refreshClinics();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    setLoading(true);
    try {
      await api.clinics.update(editing.id, { name: name.trim() });
      toast({ title: 'Clinic updated' });
      setEditing(null);
      await refresh();
      refreshClinics();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (c: { id: string; name: string }) => {
    if (!confirm(`Delete clinic "${c.name}"? This removes linked data per database rules.`)) return;
    try {
      await api.clinics.delete(c.id);
      toast({ title: 'Clinic deleted' });
      await refresh();
      refreshClinics();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  if (loading && rows.length === 0) {
    return <FullScreenLoader label="Loading clinics..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Clinics" description="Locations for inventory, consultations, and staff access.">
        <Button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setName('');
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add clinic
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>All clinics</CardTitle>
          <CardDescription>Shown in the header clinic selector for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No clinics yet. Create one to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(c);
                              setName(c.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(c)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New clinic</DialogTitle>
            <DialogDescription>Display name only.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perumbakkam" />
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
            <DialogTitle>Rename clinic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
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

export default ClinicsPage;

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import FullScreenLoader from '@/components/FullScreenLoader';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DoctorRow {
  id: string;
  name: string;
  clinicIds?: string[];
}

const DoctorsPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [createClinicIds, setCreateClinicIds] = useState<string[]>([]);
  const [mapDoctor, setMapDoctor] = useState<DoctorRow | null>(null);
  const [doctorClinics, setDoctorClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [addClinicId, setAddClinicId] = useState('');
  const { toast } = useToast();

  const refresh = () =>
    api.doctors
      .list()
      .then((data) => setDoctors(data as DoctorRow[]))
      .catch(() => setDoctors([]));

  useEffect(() => {
    Promise.all([refresh(), api.clinics.list().then(setClinics).catch(() => setClinics([]))]).finally(() =>
      setLoading(false),
    );
  }, []);

  const clinicsNotMapped = useMemo(() => {
    const have = new Set(doctorClinics.map((c) => c.id));
    return clinics.filter((c) => !have.has(c.id));
  }, [clinics, doctorClinics]);

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  const openDoctorMappings = async (d: DoctorRow) => {
    setMapDoctor(d);
    setAddClinicId('');
    try {
      const list = await api.doctors.listClinics(d.id);
      setDoctorClinics(list as { id: string; name: string; mappingId: string }[]);
    } catch {
      setDoctorClinics([]);
    }
  };

  const toggleCreateClinic = (id: string, checked: boolean) => {
    setCreateClinicIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (clinics.length > 0 && createClinicIds.length === 0) {
      toast({
        title: 'Select at least one clinic',
        description: 'Doctors only appear in consultations for clinics they are assigned to.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await api.doctors.create({
        name: form.name.trim(),
        clinicIds: createClinicIds.length > 0 ? createClinicIds : undefined,
      });
      toast({ title: 'Doctor added' });
      setShowForm(false);
      setForm({ name: '' });
      setCreateClinicIds([]);
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
      await api.doctors.update(editing.id, { name: form.name.trim() });
      toast({ title: 'Doctor updated' });
      setEditing(null);
      await refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (d: DoctorRow) => {
    if (!confirm(`Remove doctor "${d.name}"? Fails if they have consultations.`)) return;
    try {
      await api.doctors.delete(d.id);
      toast({ title: 'Doctor removed' });
      await refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const openEdit = (d: DoctorRow) => {
    setEditing(d);
    setForm({ name: d.name });
  };

  if (loading && doctors.length === 0) {
    return <FullScreenLoader label="Loading doctors..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Doctors"
        description="Assign each doctor to one or more clinics. The consultation form only lists doctors for the clinic you have selected in the header."
      >
        {isAdmin && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({ name: '' });
              setCreateClinicIds([]);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add doctor
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Practitioners</CardTitle>
          <CardDescription>
            Clinic links control who appears in the doctor dropdown and block consultations if the doctor is not assigned to that clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-muted-foreground">
              No doctors yet.{isAdmin && ' Add one and assign clinics so they appear in consultations.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Clinics</th>
                    {isAdmin && <th className="py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="py-2">{d.name}</td>
                      <td className="py-2 text-muted-foreground">
                        {(d.clinicIds?.length ?? 0) === 0
                          ? '—'
                          : (d.clinicIds ?? []).map((id) => clinicName(id)).join(', ')}
                      </td>
                      {isAdmin && (
                        <td className="py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => openDoctorMappings(d)}>
                              <Link2 className="mr-1 h-3.5 w-3.5" />
                              Clinics
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(d)}
                            >
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add doctor</DialogTitle>
            <DialogDescription>Display name as it should appear on records.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="Dr. …" />
            </div>
            {clinics.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                <Label>Works at</Label>
                <p className="text-xs text-muted-foreground">
                  Required when you have clinics. This doctor will only appear in consultations for these locations.
                </p>
                {clinics.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={createClinicIds.includes(c.id)}
                      onCheckedChange={(ch) => toggleCreateClinic(c.id, ch === true)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit doctor</DialogTitle>
            <DialogDescription>Update the display name. Use Clinics to change locations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapDoctor} onOpenChange={(o) => !o && setMapDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clinics for {mapDoctor?.name}</DialogTitle>
            <DialogDescription>
              This doctor appears in the consultation dropdown only for linked clinics. Existing records are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ul className="space-y-2 text-sm">
              {doctorClinics.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{c.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      if (!mapDoctor) return;
                      try {
                        await api.doctors.removeClinic(mapDoctor.id, c.id);
                        toast({ title: 'Removed' });
                        await openDoctorMappings(mapDoctor);
                        await refresh();
                      } catch (e) {
                        toast({
                          title: 'Error',
                          description: e instanceof Error ? e.message : 'Failed',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            {clinicsNotMapped.length > 0 ? (
              <div className="flex gap-2">
                <Select value={addClinicId || undefined} onValueChange={setAddClinicId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add clinic…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicsNotMapped.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!addClinicId || !mapDoctor}
                  onClick={async () => {
                    if (!mapDoctor || !addClinicId) return;
                    try {
                      await api.doctors.addClinic(mapDoctor.id, addClinicId);
                      toast({ title: 'Clinic linked' });
                      setAddClinicId('');
                      await openDoctorMappings(mapDoctor);
                      await refresh();
                    } catch (e) {
                      toast({
                        title: 'Error',
                        description: e instanceof Error ? e.message : 'Failed',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All clinics are already linked.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorsPage;

import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import FullScreenLoader from '@/components/FullScreenLoader';
import { Plus, Pencil, Trash2, KeyRound, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UserRow = { id: string; username: string; role: string; createdAt: string };

const UsersAdminPage = () => {
  const me = getAuthUser();
  if (me?.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [users, setUsers] = useState<UserRow[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    clinicIds: [] as string[],
  });
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [pwdUser, setPwdUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [mapUser, setMapUser] = useState<UserRow | null>(null);
  const [userClinics, setUserClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [addClinicId, setAddClinicId] = useState('');
  const { toast } = useToast();

  const refreshUsers = () =>
    api.users.list().then((data) => setUsers(data as UserRow[])).catch(() => setUsers([]));

  useEffect(() => {
    Promise.all([refreshUsers(), api.clinics.list().then(setClinics).catch(() => setClinics([]))]).finally(() =>
      setLoading(false),
    );
  }, []);

  const clinicsNotMapped = useMemo(() => {
    const have = new Set(userClinics.map((c) => c.id));
    return clinics.filter((c) => !have.has(c.id));
  }, [clinics, userClinics]);

  const openMappings = async (u: UserRow) => {
    setMapUser(u);
    setAddClinicId('');
    try {
      const list = await api.users.listClinics(u.id);
      setUserClinics(list as { id: string; name: string; mappingId: string }[]);
    } catch {
      setUserClinics([]);
    }
  };

  const handleCreate = async () => {
    if (!createForm.username.trim() || createForm.password.length < 6) {
      toast({ title: 'Username and password (6+ chars) required', variant: 'destructive' });
      return;
    }
    if (createForm.role === 'user' && createForm.clinicIds.length === 0) {
      toast({ title: 'Staff users need at least one clinic', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.users.create({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role,
        clinicIds: createForm.role === 'user' ? createForm.clinicIds : undefined,
      });
      toast({ title: 'User created' });
      setShowCreate(false);
      setCreateForm({ username: '', password: '', role: 'user', clinicIds: [] });
      await refreshUsers();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !editUsername.trim()) return;
    setLoading(true);
    try {
      await api.users.update(editing.id, { username: editUsername.trim(), role: editRole });
      toast({ title: 'User updated' });
      setEditing(null);
      await refreshUsers();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (u.id === me?.id) {
      toast({ title: 'You cannot delete yourself', variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete user "${u.username}"?`)) return;
    try {
      await api.users.delete(u.id);
      toast({ title: 'User deleted' });
      await refreshUsers();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleSetPassword = async () => {
    if (!pwdUser || newPassword.length < 6) {
      toast({ title: 'Password at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      await api.users.setPassword(pwdUser.id, newPassword);
      toast({ title: 'Password updated' });
      setPwdUser(null);
      setNewPassword('');
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    }
  };

  const toggleCreateClinic = (id: string, checked: boolean) => {
    setCreateForm((f) => ({
      ...f,
      clinicIds: checked ? [...f.clinicIds, id] : f.clinicIds.filter((x) => x !== id),
    }));
  };

  if (loading && users.length === 0) {
    return <FullScreenLoader label="Loading users..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users & access"
        description="Administrator and staff logins. Staff must be mapped to one or more clinics to sign in."
      >
        <Button
          onClick={() => {
            setShowCreate(true);
            setCreateForm({ username: '', password: '', role: 'user', clinicIds: [] });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Roles: <strong>admin</strong> (full access, no clinic mapping) or <strong>staff</strong> (clinic-scoped).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Username</th>
                  <th className="py-2 text-left">Role</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 font-medium">{u.username}</td>
                    <td className="py-2 capitalize">{u.role}</td>
                    <td className="py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {u.role === 'user' && (
                          <Button size="sm" variant="outline" onClick={() => openMappings(u)}>
                            <Link2 className="mr-1 h-3.5 w-3.5" />
                            Clinics
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(u);
                            setEditUsername(u.username);
                            setEditRole(u.role === 'admin' ? 'admin' : 'user');
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPwdUser(u)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === me?.id}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Staff users need clinic access to log in.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Username</Label>
              <Input
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as 'admin' | 'user' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staff (clinic user)</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.role === 'user' && (
              <div className="space-y-2 rounded-lg border p-3">
                <Label>Clinic access</Label>
                {clinics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Create clinics first.</p>
                ) : (
                  clinics.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={createForm.clinicIds.includes(c.id)}
                        onCheckedChange={(ch) => toggleCreateClinic(c.id, ch === true)}
                      />
                      {c.name}
                    </label>
                  ))
                )}
              </div>
            )}
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              Create user
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Username</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as 'admin' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>User: {pwdUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button onClick={handleSetPassword} className="w-full">
              Update password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapUser} onOpenChange={(o) => !o && setMapUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clinic mapping</DialogTitle>
            <DialogDescription>Staff: {mapUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ul className="space-y-2 text-sm">
              {userClinics.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{c.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      if (!mapUser) return;
                      try {
                        await api.users.removeClinic(mapUser.id, c.id);
                        toast({ title: 'Removed' });
                        await openMappings(mapUser);
                        await refreshUsers();
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
                  disabled={!addClinicId || !mapUser}
                  onClick={async () => {
                    if (!mapUser || !addClinicId) return;
                    try {
                      await api.users.addClinic(mapUser.id, addClinicId);
                      toast({ title: 'Clinic linked' });
                      setAddClinicId('');
                      await openMappings(mapUser);
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

export default UsersAdminPage;

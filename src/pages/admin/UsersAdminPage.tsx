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
import { ADMIN_NAV_CATALOG } from '@/lib/nav-access';
import { Plus, Pencil, Trash2, KeyRound, Link2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UserRow = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  allowedNavPaths?: string[] | null;
  staffRole?: string | null;
};

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
  const [editNavRestricted, setEditNavRestricted] = useState(false);
  const [editNavPaths, setEditNavPaths] = useState<string[]>([]);
  const [editStaffKind, setEditStaffKind] = useState<'full' | 'nurse'>('full');
  const [pwdUser, setPwdUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [mapUser, setMapUser] = useState<UserRow | null>(null);
  const [userClinics, setUserClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [mapClinicIdsDraft, setMapClinicIdsDraft] = useState<string[]>([]);
  const [mappingSaving, setMappingSaving] = useState(false);
  const { toast } = useToast();

  const refreshUsers = () =>
    api.users.list().then((data) => setUsers(data as UserRow[])).catch(() => setUsers([]));

  useEffect(() => {
    Promise.all([refreshUsers(), api.clinics.list().then(setClinics).catch(() => setClinics([]))]).finally(() =>
      setLoading(false),
    );
  }, []);

  const openMappings = async (u: UserRow) => {
    setMapUser(u);
    try {
      const list = await api.users.listClinics(u.id);
      const mapped = list as { id: string; name: string; mappingId: string }[];
      setUserClinics(mapped);
      setMapClinicIdsDraft(mapped.map((c) => c.id));
    } catch {
      setUserClinics([]);
      setMapClinicIdsDraft([]);
    }
  };

  const toggleDraftClinic = (clinicId: string, checked: boolean) => {
    setMapClinicIdsDraft((prev) =>
      checked ? [...new Set([...prev, clinicId])] : prev.filter((id) => id !== clinicId)
    );
  };

  const handleSaveMappings = async () => {
    if (!mapUser) return;
    if (mapClinicIdsDraft.length === 0) {
      toast({
        title: 'At least one clinic required',
        description: 'Staff user must have at least one clinic access.',
        variant: 'destructive',
      });
      return;
    }
    const current = new Set(userClinics.map((c) => c.id));
    const draft = new Set(mapClinicIdsDraft);
    const toAdd = [...draft].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !draft.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      toast({ title: 'No changes' });
      return;
    }

    setMappingSaving(true);
    try {
      for (const clinicId of toAdd) {
        await api.users.addClinic(mapUser.id, clinicId);
      }
      for (const clinicId of toRemove) {
        await api.users.removeClinic(mapUser.id, clinicId);
      }
      toast({ title: 'Clinic access updated' });
      await openMappings(mapUser);
      await refreshUsers();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update clinic mapping',
        variant: 'destructive',
      });
    } finally {
      setMappingSaving(false);
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
      const allowedNavPaths: string[] | null | undefined =
        editRole === 'user'
          ? editNavRestricted && editNavPaths.length > 0
            ? [...new Set(editNavPaths)]
            : null
          : undefined;
      await api.users.update(editing.id, {
        username: editUsername.trim(),
        role: editRole,
        ...(editRole === 'user' ? { allowedNavPaths } : {}),
        ...(editRole === 'user' ? { staffRole: editStaffKind === 'nurse' ? 'nurse' : null } : {}),
      });
      toast({ title: 'User updated' });
      setEditing(null);
      await refreshUsers();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleEditNavPath = (path: string, checked: boolean) => {
    setEditNavPaths((prev) => (checked ? [...prev, path] : prev.filter((p) => p !== path)));
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
                    <td className="py-2 capitalize">
                      {u.role}
                      {u.role === 'user' && u.staffRole === 'nurse' ? (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                          vitals only
                        </span>
                      ) : null}
                    </td>
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
                            const paths = u.allowedNavPaths;
                            setEditNavRestricted(Boolean(paths && paths.length > 0));
                            setEditNavPaths(paths && paths.length > 0 ? [...paths] : []);
                            setEditStaffKind(u.staffRole === 'nurse' ? 'nurse' : 'full');
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
              <Select
                value={editRole}
                onValueChange={(v) => {
                  setEditRole(v as 'admin' | 'user');
                  if (v === 'admin') {
                    setEditNavRestricted(false);
                    setEditNavPaths([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === 'user' && (
              <div>
                <Label>Consultation form</Label>
                <Select value={editStaffKind} onValueChange={(v) => setEditStaffKind(v as 'full' | 'nurse')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full (doctor / staff)</SelectItem>
                    <SelectItem value="nurse">Nurse — vitals only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nurses only see beneficiary + vitals; visit time is set when saving; doctor is auto-assigned.
                </p>
              </div>
            )}
            {editRole === 'user' && (
              <div className="space-y-3 rounded-lg border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={editNavRestricted}
                    onCheckedChange={(ch) => {
                      const on = ch === true;
                      setEditNavRestricted(on);
                      if (!on) setEditNavPaths([]);
                    }}
                  />
                  Custom sidebar (pick sections)
                </label>
                <p className="text-xs text-muted-foreground">
                  Leave off for the default staff menu (clinical + inventory; no masters). Turn on to grant only checked items—e.g. nurses: Patients, Consultations, Pharmacy.
                </p>
                {editNavRestricted && (
                  <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-2">
                    {ADMIN_NAV_CATALOG.map((item) => (
                      <label key={item.path} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={editNavPaths.includes(item.path)}
                          onCheckedChange={(ch) => toggleEditNavPath(item.path, ch === true)}
                        />
                        <span>
                          {item.label}{' '}
                          <span className="text-muted-foreground">({item.group})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
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

      <Dialog
        open={!!mapUser}
        onOpenChange={(o) => {
          if (!o) {
            setMapUser(null);
            setMapClinicIdsDraft([]);
            setUserClinics([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clinic mapping</DialogTitle>
            <DialogDescription>Staff: {mapUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Selected: <strong>{mapClinicIdsDraft.length}</strong> / {clinics.length}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMapClinicIdsDraft(clinics.map((c) => c.id))}
                  disabled={clinics.length === 0}
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMapClinicIdsDraft([])}
                  disabled={clinics.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-2">
              {clinics.length === 0 ? (
                <p className="px-2 py-1 text-sm text-muted-foreground">Create clinics first.</p>
              ) : (
                clinics.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40">
                    <Checkbox
                      checked={mapClinicIdsDraft.includes(c.id)}
                      onCheckedChange={(ch) => toggleDraftClinic(c.id, ch === true)}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
            <Button onClick={handleSaveMappings} disabled={!mapUser || mappingSaving} className="w-full">
              {mappingSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving clinic access...
                </>
              ) : (
                'Save clinic access'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdminPage;

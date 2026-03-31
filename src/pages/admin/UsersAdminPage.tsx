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
  linkedDoctorId?: string | null;
  linkedDoctorName?: string | null;
  clinicAccessNames?: string[];
};

type AccountRole = 'admin' | 'doctor' | 'nurse';

const UsersAdminPage = () => {
  const me = getAuthUser();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string; clinicIds?: string[] }[]>([]);
  const [userClinicNamesByUserId, setUserClinicNamesByUserId] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    accountRole: 'doctor' as AccountRole,
    clinicIds: [] as string[],
    linkedDoctorId: 'none',
  });
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editAccountRole, setEditAccountRole] = useState<AccountRole>('doctor');
  const [editNavRestricted, setEditNavRestricted] = useState(false);
  const [editNavPaths, setEditNavPaths] = useState<string[]>([]);
  const [editLinkedDoctorId, setEditLinkedDoctorId] = useState<string>('none');
  const [editUserClinicIds, setEditUserClinicIds] = useState<string[]>([]);
  const [pwdUser, setPwdUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [mapUser, setMapUser] = useState<UserRow | null>(null);
  const [userClinics, setUserClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [mapClinicIdsDraft, setMapClinicIdsDraft] = useState<string[]>([]);
  const [mappingSaving, setMappingSaving] = useState(false);
  const { toast } = useToast();

  const refreshUsers = async () => {
    try {
      const data = (await api.users.list()) as UserRow[];
      setUsers(data);
      setUserClinicNamesByUserId(
        Object.fromEntries(
          data
            .filter((u) => u.role !== 'admin')
            .map((u) => [u.id, u.clinicAccessNames ?? []] as const),
        ),
      );
    } catch {
      setUsers([]);
      setUserClinicNamesByUserId({});
    }
  };

  useEffect(() => {
    Promise.all([
      refreshUsers(),
      api.clinics.list().then(setClinics).catch(() => setClinics([])),
      api.doctors.list().then((list) => setDoctors(list as { id: string; name: string; clinicIds?: string[] }[])).catch(() => setDoctors([])),
    ]).finally(() => setLoading(false));
  }, []);

  const doctorNameById = useMemo(
    () => Object.fromEntries(doctors.map((d) => [d.id, d.name] as const)),
    [doctors],
  );

  const editDoctorOptions = useMemo(() => {
    if (editAccountRole === 'admin') return [];
    if (editUserClinicIds.length === 0) return doctors;
    return doctors.filter((d) => {
      const assignedClinics = d.clinicIds || [];
      if (assignedClinics.length === 0) return true;
      return assignedClinics.some((cid) => editUserClinicIds.includes(cid));
    });
  }, [doctors, editAccountRole, editUserClinicIds]);

  const createDoctorOptions = useMemo(() => {
    if (createForm.accountRole === 'admin') return [];
    if (createForm.clinicIds.length === 0) return doctors;
    return doctors.filter((d) => {
      const assignedClinics = d.clinicIds || [];
      if (assignedClinics.length === 0) return true;
      return assignedClinics.some((cid) => createForm.clinicIds.includes(cid));
    });
  }, [doctors, createForm.accountRole, createForm.clinicIds]);

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

  const openEditUser = async (u: UserRow) => {
    setEditing(u);
    setEditUsername(u.username);
    setEditAccountRole(u.role === 'admin' ? 'admin' : u.role === 'nurse' ? 'nurse' : 'doctor');
    const paths = u.allowedNavPaths;
    setEditNavRestricted(Boolean(paths && paths.length > 0));
    setEditNavPaths(paths && paths.length > 0 ? [...paths] : []);
    setEditLinkedDoctorId(u.linkedDoctorId || 'none');

    if (u.role !== 'admin') {
      try {
        const mapped = await api.users.listClinics(u.id);
        setEditUserClinicIds((mapped as { id: string; name: string; mappingId: string }[]).map((c) => c.id));
      } catch {
        setEditUserClinicIds([]);
      }
    } else {
      setEditUserClinicIds([]);
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
        description: 'Doctor/Nurse user must have at least one clinic access.',
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
    if (createForm.accountRole !== 'admin' && createForm.clinicIds.length === 0) {
      toast({ title: 'Doctor/Nurse users need at least one clinic', variant: 'destructive' });
      return;
    }
    if (createForm.accountRole === 'doctor' && createForm.linkedDoctorId === 'none') {
      toast({ title: 'Doctor user must be mapped to a doctor name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.users.create({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.accountRole,
        clinicIds: createForm.accountRole !== 'admin' ? createForm.clinicIds : undefined,
        linkedDoctorId:
          createForm.accountRole !== 'admin' && createForm.linkedDoctorId !== 'none'
            ? createForm.linkedDoctorId
            : null,
      });
      toast({ title: 'User created' });
      setShowCreate(false);
      setCreateForm({ username: '', password: '', accountRole: 'doctor', clinicIds: [], linkedDoctorId: 'none' });
      await refreshUsers();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !editUsername.trim()) return;
    if (editAccountRole === 'doctor' && editLinkedDoctorId === 'none') {
      toast({ title: 'Doctor user must be mapped to a doctor name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const allowedNavPaths: string[] | null | undefined =
        editAccountRole !== 'admin'
          ? editNavRestricted && editNavPaths.length > 0
            ? [...new Set(editNavPaths)]
            : null
          : undefined;
      await api.users.update(editing.id, {
        username: editUsername.trim(),
        role: editAccountRole,
        ...(editAccountRole !== 'admin' ? { allowedNavPaths } : {}),
        ...(editAccountRole !== 'admin'
          ? { linkedDoctorId: editLinkedDoctorId === 'none' ? null : editLinkedDoctorId }
          : { linkedDoctorId: null }),
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

  if (me?.role !== 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (loading && users.length === 0) {
    return <FullScreenLoader label="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & access"
        description="Administrator, doctor, and nurse logins. Doctor/Nurse users must be mapped to one or more clinics to sign in."
      >
        <Button
          onClick={() => {
            setShowCreate(true);
            setCreateForm({ username: '', password: '', accountRole: 'doctor', clinicIds: [], linkedDoctorId: 'none' });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </PageHeader>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Manage login users, assign roles, and control clinic-level access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinic access</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{u.username}</div>
                    </td>
                    <td className="px-4 py-3 align-top capitalize">
                      <span className="inline-flex rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs font-medium">
                        {u.role}
                      </span>
                      {u.role !== 'admin' && u.linkedDoctorId ? (
                        <span className="ml-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-normal text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                          {u.linkedDoctorName || doctorNameById[u.linkedDoctorId] || 'Assigned'}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-muted-foreground">All clinics</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(userClinicNamesByUserId[u.id] || []).slice(0, 2).map((clinicName) => (
                            <span key={clinicName} className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-xs">
                              {clinicName}
                            </span>
                          ))}
                          {(userClinicNamesByUserId[u.id] || []).length > 2 ? (
                            <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                              +{(userClinicNamesByUserId[u.id] || []).length - 2}
                            </span>
                          ) : null}
                          {(userClinicNamesByUserId[u.id] || []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">No clinics mapped</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {u.role !== 'admin' && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => openMappings(u)}>
                            <Link2 className="mr-1 h-3.5 w-3.5" />
                            Clinics
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={`Edit ${u.username}`}
                          onClick={() => void openEditUser(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title={`Reset password for ${u.username}`} onClick={() => setPwdUser(u)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={`Delete ${u.username}`}
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
            <DialogDescription>Doctor/Nurse users need clinic access to log in.</DialogDescription>
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
                value={createForm.accountRole}
                onValueChange={(v) =>
                  setCreateForm((f) => ({
                    ...f,
                    accountRole: v as AccountRole,
                    linkedDoctorId: v === 'admin' ? 'none' : f.linkedDoctorId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.accountRole !== 'admin' && (
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
            {createForm.accountRole !== 'admin' && (
              <div>
                <Label>{createForm.accountRole === 'nurse' ? 'Linked doctor (optional)' : 'Mapped doctor (required)'}</Label>
                <Select
                  value={createForm.linkedDoctorId}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, linkedDoctorId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No linked doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {createForm.accountRole === 'nurse' ? <SelectItem value="none">No linked doctor</SelectItem> : null}
                    {createDoctorOptions.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                    {createForm.linkedDoctorId !== 'none' && !createDoctorOptions.some((d) => d.id === createForm.linkedDoctorId) ? (
                      <SelectItem value={createForm.linkedDoctorId}>
                        {doctorNameById[createForm.linkedDoctorId] || 'Current linked doctor'}
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
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
                value={editAccountRole}
                onValueChange={(v) => {
                  const nextRole = v as AccountRole;
                  setEditAccountRole(nextRole);
                  if (v === 'admin') {
                    setEditNavRestricted(false);
                    setEditNavPaths([]);
                    setEditLinkedDoctorId('none');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editAccountRole !== 'admin' && (
              <div>
                <Label>{editAccountRole === 'nurse' ? 'Linked doctor (optional)' : 'Mapped doctor (required)'}</Label>
                <Select value={editLinkedDoctorId} onValueChange={setEditLinkedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No linked doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {editAccountRole === 'nurse' ? <SelectItem value="none">No linked doctor</SelectItem> : null}
                    {editDoctorOptions.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                    {editLinkedDoctorId !== 'none' && !editDoctorOptions.some((d) => d.id === editLinkedDoctorId) ? (
                      <SelectItem value={editLinkedDoctorId}>
                        {doctorNameById[editLinkedDoctorId] || 'Current linked doctor'}
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Doctors are filtered by this user&apos;s clinic access.
                </p>
              </div>
            )}
            {editAccountRole !== 'admin' && (
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
                  Leave off for the default doctor/nurse menu (clinical + inventory; no masters). Turn on to grant only checked items.
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
            <DialogDescription>User: {mapUser?.username}</DialogDescription>
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

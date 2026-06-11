import React, { useState, useMemo } from 'react';
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
import { ADMIN_NAV_CATALOG, NAV_PRESETS, type AllowedNavPreset } from '@/lib/nav-access';
import { Plus, Pencil, Trash2, KeyRound, Link2, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRow = {
  id: string;
  username: string;
  role: string;
  roleId?: string | null;
  roleName?: string | null;
  displayName?: string | null;
  createdAt: string;
  allowedNavPaths?: string[] | null;
  clinicAccessNames?: string[];
};
type AccountRole = 'admin' | 'doctor' | 'nurse';

// ─── Zod schemas ─────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
});
type EditUserForm = z.infer<typeof editUserSchema>;

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── FieldError component ─────────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

// ─── Page ───────────────────────────────────────────────────────────────────
const UsersAdminPage = () => {
  const me = getAuthUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [createAccountRole, setCreateAccountRole] = useState<AccountRole>('doctor');
  const [createRoleId, setCreateRoleId] = useState<string>('');
  const [createClinicIds, setCreateClinicIds] = useState<string[]>([]);
  /** Doctor role: friendly name shown on consultations & prints. */
  const [createDoctorDisplayName, setCreateDoctorDisplayName] = useState('');

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editAccountRole, setEditAccountRole] = useState<AccountRole>('doctor');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [editNavRestricted, setEditNavRestricted] = useState(false);
  const [editNavPaths, setEditNavPaths] = useState<string[]>([]);
  const [editDoctorDisplayName, setEditDoctorDisplayName] = useState('');

  const [pwdUser, setPwdUser] = useState<UserRow | null>(null);
  const [mapUser, setMapUser] = useState<UserRow | null>(null);
  const [userClinics, setUserClinics] = useState<{ id: string; name: string; mappingId: string }[]>([]);
  const [mapClinicIdsDraft, setMapClinicIdsDraft] = useState<string[]>([]);
  const [mappingSaving, setMappingSaving] = useState(false);

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', password: '' },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { username: '' },
  });

  const pwdForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '' },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const data = (await api.users.list()) as UserRow[];
      return data;
    },
  });

  const { data: clinics = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['clinics'],
    queryFn: () => api.clinics.list() as Promise<{ id: string; name: string }[]>,
  });

  const { data: roleOptions = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.roles.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const userClinicNamesByUserId = useMemo(() =>
    Object.fromEntries(
      users
        .filter((u) => u.role !== 'admin')
        .map((u) => [u.id, u.clinicAccessNames ?? []] as const),
    ),
    [users],
  );

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      if (createAccountRole !== 'admin' && createClinicIds.length === 0)
        throw new Error('Doctor/Nurse users need at least one clinic');
      if (createAccountRole === 'doctor' && !createDoctorDisplayName.trim())
        throw new Error('Doctor display name is required');
      return api.users.create({
        username: data.username.trim(),
        password: data.password,
        role: createAccountRole,
        ...(createRoleId ? { roleId: createRoleId } : {}),
        clinicIds: createAccountRole !== 'admin' ? createClinicIds : undefined,
        ...(createAccountRole === 'doctor'
          ? { displayName: createDoctorDisplayName.trim() }
          : {}),
      });
    },
    onSuccess: () => {
      toast({ title: 'User created' });
      setShowCreate(false);
      createForm.reset();
      setCreateClinicIds([]);
      setCreateDoctorDisplayName('');
      setCreateAccountRole('doctor');
      setCreateRoleId('');
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!editing) return;
      if (editAccountRole === 'doctor' && !editDoctorDisplayName.trim())
        throw new Error('Doctor display name is required');
      const allowedNavPaths: string[] | null | undefined =
        editAccountRole !== 'admin'
          ? editNavRestricted && editNavPaths.length > 0
            ? [...new Set(editNavPaths)]
            : null
          : undefined;
      return api.users.update(editing.id, {
        username: data.username.trim(),
        role: editAccountRole,
        roleId: editRoleId || null,
        ...(editAccountRole !== 'admin' ? { allowedNavPaths } : {}),
        ...(editAccountRole === 'doctor'
          ? { displayName: editDoctorDisplayName.trim() }
          : { displayName: null }),
      });
    },
    onSuccess: () => {
      toast({ title: 'User updated' });
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (u: UserRow) => api.users.delete(u.id),
    onSuccess: () => { toast({ title: 'User deleted' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const pwdMutation = useMutation({
    mutationFn: (data: PasswordForm) => api.users.setPassword(pwdUser!.id, data.newPassword),
    onSuccess: () => { toast({ title: 'Password updated' }); setPwdUser(null); pwdForm.reset(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const openEditUser = async (u: UserRow) => {
    setEditing(u);
    editForm.reset({ username: u.username });
    setEditRoleId(u.roleId ?? '');
    setEditAccountRole(u.role === 'admin' ? 'admin' : u.role === 'nurse' ? 'nurse' : 'doctor');
    const paths = u.allowedNavPaths;
    setEditNavRestricted(Boolean(paths && paths.length > 0));
    setEditNavPaths(paths && paths.length > 0 ? [...paths] : []);
    setEditDoctorDisplayName(u.role === 'doctor' ? (u.displayName || u.username) : '');
  };

  const openMappings = async (u: UserRow) => {
    setMapUser(u);
    try {
      const list = await api.users.listClinics(u.id);
      const mapped = list as { id: string; name: string; mappingId: string }[];
      setUserClinics(mapped);
      setMapClinicIdsDraft(mapped.map((c) => c.id));
    } catch { setUserClinics([]); setMapClinicIdsDraft([]); }
  };

  const toggleDraftClinic = (clinicId: string, checked: boolean) =>
    setMapClinicIdsDraft((prev) => checked ? [...new Set([...prev, clinicId])] : prev.filter((id) => id !== clinicId));

  const toggleCreateClinic = (id: string, checked: boolean) =>
    setCreateClinicIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));

  const toggleEditNavPath = (path: string, checked: boolean) =>
    setEditNavPaths((prev) => (checked ? [...prev, path] : prev.filter((p) => p !== path)));

  const handleSaveMappings = async () => {
    if (!mapUser) return;
    if (mapClinicIdsDraft.length === 0) {
      toast({ title: 'At least one clinic required', description: 'Doctor/Nurse user must have at least one clinic access.', variant: 'destructive' });
      return;
    }
    const current = new Set(userClinics.map((c) => c.id));
    const draft = new Set(mapClinicIdsDraft);
    const toAdd = [...draft].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !draft.has(id));
    if (toAdd.length === 0 && toRemove.length === 0) { toast({ title: 'No changes' }); return; }
    setMappingSaving(true);
    try {
      for (const clinicId of toAdd) await api.users.addClinic(mapUser.id, clinicId);
      for (const clinicId of toRemove) await api.users.removeClinic(mapUser.id, clinicId);
      toast({ title: 'Clinic access updated' });
      await openMappings(mapUser);
      invalidate();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update clinic mapping', variant: 'destructive' });
    } finally { setMappingSaving(false); }
  };

  if (me?.role !== 'admin') return <Navigate to="/admin/dashboard" replace />;

  if (usersLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users & access" description="Administrator, doctor, and nurse logins." />
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & access"
        description="Administrator, doctor, and nurse logins. Doctor/Nurse users must be mapped to one or more clinics to sign in."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => { setShowCreate(true); createForm.reset(); setCreateClinicIds([]); setCreateDoctorDisplayName(''); setCreateAccountRole('doctor'); setCreateRoleId(''); }}>
            <Plus className="mr-2 h-4 w-4" />Add user
          </Button>
        </div>
      </PageHeader>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Manage login users, assign roles, and control clinic-level access.</CardDescription>
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
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{u.username}</div>
                      {u.role === 'doctor' && u.displayName ? (
                        <div className="text-xs text-muted-foreground">{u.displayName}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top capitalize">
                      <span className="inline-flex rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs font-medium">{u.roleName || u.role}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-muted-foreground">All clinics</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(userClinicNamesByUserId[u.id] || []).slice(0, 2).map((clinicName) => (
                            <span key={clinicName} className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-xs">{clinicName}</span>
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
                            <Link2 className="mr-1 h-3.5 w-3.5" />Clinics
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" title={`Edit ${u.username}`} onClick={() => void openEditUser(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title={`Reset password for ${u.username}`} onClick={() => { setPwdUser(u); pwdForm.reset(); }}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                          title={`Delete ${u.username}`}
                          onClick={() => {
                            if (u.id === me?.id) { toast({ title: 'You cannot delete yourself', variant: 'destructive' }); return; }
                            if (!confirm(`Delete user "${u.username}"?`)) return;
                            deleteMutation.mutate(u);
                          }}
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
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Username <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', createForm.formState.errors.username && 'border-destructive')} autoComplete="off" {...createForm.register('username')} />
                <FieldError message={createForm.formState.errors.username?.message} />
              </div>
              <div>
                <Label>Password <span className="text-destructive">*</span></Label>
                <Input type="password" className={cn('mt-1', createForm.formState.errors.password && 'border-destructive')} autoComplete="new-password" {...createForm.register('password')} />
                <FieldError message={createForm.formState.errors.password?.message} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={createAccountRole} onValueChange={(v) => { setCreateAccountRole(v as AccountRole); if (v === 'admin') { setCreateClinicIds([]); setCreateDoctorDisplayName(''); } }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Base behavior (clinic scope, doctor pickers). Pick a custom role below for fine-grained permissions.</p>
              </div>
              <div>
                <Label>Custom role <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={createRoleId || '__none__'} onValueChange={(v) => setCreateRoleId(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Default for base role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Default for base role</SelectItem>
                    {roleOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Controls exactly which pages & actions this user gets. Manage roles on the Roles & permissions page.</p>
              </div>
              {createAccountRole === 'doctor' && (
                <div>
                  <Label>Doctor display name <span className="text-destructive">*</span></Label>
                  <Input
                    className="mt-1"
                    placeholder="Dr. …"
                    value={createDoctorDisplayName}
                    onChange={(e) => setCreateDoctorDisplayName(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Shown on consultations and prescriptions.</p>
                </div>
              )}
              {createAccountRole !== 'admin' && (
                <div className="space-y-2 rounded-lg border p-3">
                  <Label>Clinic access <span className="text-destructive">*</span></Label>
                  {clinics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Create clinics first.</p>
                  ) : (
                    clinics.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={createClinicIds.includes(c.id)} onCheckedChange={(ch) => toggleCreateClinic(c.id, ch === true)} />
                        {c.name}
                      </label>
                    ))
                  )}
                </div>
              )}
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create user'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Username <span className="text-destructive">*</span></Label>
                <Input className={cn('mt-1', editForm.formState.errors.username && 'border-destructive')} {...editForm.register('username')} />
                <FieldError message={editForm.formState.errors.username?.message} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editAccountRole} onValueChange={(v) => {
                  const nextRole = v as AccountRole;
                  setEditAccountRole(nextRole);
                  if (v === 'admin') { setEditNavRestricted(false); setEditNavPaths([]); setEditDoctorDisplayName(''); }
                }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Custom role <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={editRoleId || '__none__'} onValueChange={(v) => setEditRoleId(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Default for base role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Default for base role</SelectItem>
                    {roleOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Drives this user's page & action permissions.</p>
              </div>
              {editAccountRole === 'doctor' && (
                <div>
                  <Label>Doctor display name <span className="text-destructive">*</span></Label>
                  <Input
                    className="mt-1"
                    placeholder="Dr. …"
                    value={editDoctorDisplayName}
                    onChange={(e) => setEditDoctorDisplayName(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Saving updates the printed name on consultations and prescriptions.</p>
                </div>
              )}
              {editAccountRole !== 'admin' && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick role presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(NAV_PRESETS) as AllowedNavPreset[]).map((key) => {
                        const preset = NAV_PRESETS[key];
                        return (
                          <Button
                            key={key}
                            type="button"
                            variant="outline"
                            size="sm"
                            title={preset.description}
                            onClick={() => {
                              setEditNavRestricted(true);
                              setEditNavPaths([...preset.paths]);
                            }}
                          >
                            {preset.label}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">Click a preset to fill the sidebar checklist below; you can still tweak individual items.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox checked={editNavRestricted} onCheckedChange={(ch) => { const on = ch === true; setEditNavRestricted(on); if (!on) setEditNavPaths([]); }} />
                    Custom sidebar (pick sections)
                  </label>
                  <p className="text-xs text-muted-foreground">Leave off for the default doctor/nurse menu. Turn on to grant only checked items.</p>
                  {editNavRestricted && (
                    <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-2">
                      {ADMIN_NAV_CATALOG.map((item) => (
                        <label key={item.path} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox checked={editNavPaths.includes(item.path)} onCheckedChange={(ch) => toggleEditNavPath(item.path, ch === true)} />
                          <span>{item.label} <span className="text-muted-foreground">({item.group})</span></span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>User: {pwdUser?.username}</DialogDescription>
          </DialogHeader>
          <form onSubmit={pwdForm.handleSubmit((d) => pwdMutation.mutate(d))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>New password <span className="text-destructive">*</span></Label>
                <Input type="password" className={cn('mt-1', pwdForm.formState.errors.newPassword && 'border-destructive')} autoComplete="new-password" {...pwdForm.register('newPassword')} />
                <FieldError message={pwdForm.formState.errors.newPassword?.message} />
              </div>
              <Button type="submit" disabled={pwdMutation.isPending} className="w-full">
                {pwdMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : 'Update password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mapUser} onOpenChange={(o) => { if (!o) { setMapUser(null); setMapClinicIdsDraft([]); setUserClinics([]); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clinic mapping</DialogTitle>
            <DialogDescription>User: {mapUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Selected: <strong>{mapClinicIdsDraft.length}</strong> / {clinics.length}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setMapClinicIdsDraft(clinics.map((c) => c.id))} disabled={clinics.length === 0}>Select all</Button>
                <Button size="sm" variant="outline" onClick={() => setMapClinicIdsDraft([])} disabled={clinics.length === 0}>Clear</Button>
              </div>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-2">
              {clinics.length === 0 ? (
                <p className="px-2 py-1 text-sm text-muted-foreground">Create clinics first.</p>
              ) : (
                clinics.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40">
                    <Checkbox checked={mapClinicIdsDraft.includes(c.id)} onCheckedChange={(ch) => toggleDraftClinic(c.id, ch === true)} />
                    {c.name}
                  </label>
                ))
              )}
            </div>
            <Button onClick={handleSaveMappings} disabled={!mapUser || mappingSaving} className="w-full">
              {mappingSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving clinic access...</> : 'Save clinic access'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdminPage;

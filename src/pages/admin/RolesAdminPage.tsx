import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api, type RoleRow, type BaseRole, type PermissionModuleDef } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { groupModules, permKey, ACTION_LABELS, type PermissionAction } from '@/lib/permissions';
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_ROLES: { value: BaseRole; label: string; hint: string }[] = [
  { value: 'doctor', label: 'Doctor', hint: 'Clinical access; appears in doctor pickers.' },
  { value: 'receptionist', label: 'Receptionist', hint: 'Front-desk staff.' },
  { value: 'nurse', label: 'Nurse', hint: 'Vitals/intake; consultations hidden by default.' },
  { value: 'admin', label: 'Administrator', hint: 'Full access (implies all permissions).' },
];

type DraftRole = {
  id?: string;
  name: string;
  description: string;
  baseRole: BaseRole;
  isSystem: boolean;
  keys: Set<string>;
};

const RolesAdminPage = () => {
  const me = getAuthUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<DraftRole | null>(null);

  const { data: catalog } = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => api.roles.catalog(),
  });
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.roles.list(),
  });

  const modules: PermissionModuleDef[] = catalog?.modules ?? [];
  const grouped = useMemo(() => groupModules(modules), [modules]);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roles'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (draft: DraftRole) => {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        baseRole: draft.baseRole,
        permissionKeys: [...draft.keys],
      };
      if (draft.id) return api.roles.update(draft.id, payload);
      return api.roles.create(payload);
    },
    onSuccess: () => {
      toast({ title: editing?.id ? 'Role updated' : 'Role created' });
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (r: RoleRow) => api.roles.delete(r.id),
    onSuccess: () => { toast({ title: 'Role deleted' }); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const openNew = () =>
    setEditing({ name: '', description: '', baseRole: 'receptionist', isSystem: false, keys: new Set() });
  const openEdit = (r: RoleRow) =>
    setEditing({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      baseRole: r.baseRole,
      isSystem: r.isSystem,
      keys: new Set(r.permissionKeys),
    });

  const toggleKey = (key: string, on: boolean) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.keys);
      if (on) next.add(key);
      else next.delete(key);
      return { ...prev, keys: next };
    });

  const toggleModuleAll = (mod: PermissionModuleDef, on: boolean) =>
    setEditing((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.keys);
      for (const a of mod.actions) {
        const k = permKey(mod.key, a);
        if (on) next.add(k);
        else next.delete(k);
      }
      return { ...prev, keys: next };
    });

  if (me?.role !== 'admin') return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Create custom roles and control exactly what each one can view and do. Built-in roles can be tuned but not deleted."
      >
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New role</Button>
      </PageHeader>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Roles</CardTitle>
          <CardDescription>Assign these to users on the Users & access page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3 text-center">Permissions</th>
                  <th className="px-4 py-3 text-center">Users</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && roles.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
                ) : roles.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No roles yet.</td></tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.id} className="border-b transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          {r.name}
                          {r.isSystem && <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"><Lock className="h-2.5 w-2.5" />built-in</span>}
                        </div>
                        {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                      </td>
                      <td className="px-4 py-3 align-top capitalize">{r.baseRole}</td>
                      <td className="px-4 py-3 text-center align-top">{r.baseRole === 'admin' ? 'All' : r.permissionKeys.length}</td>
                      <td className="px-4 py-3 text-center align-top">{r.userCount ?? 0}</td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="flex justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title={r.isSystem ? 'Built-in roles cannot be deleted' : 'Delete role'}
                            disabled={r.isSystem}
                            onClick={() => {
                              if (!confirm(`Delete role "${r.name}"?`)) return;
                              deleteMutation.mutate(r);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit role' : 'New role'}</DialogTitle>
            <DialogDescription>Pick what this role can do. View controls page access; the rest gate actions.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Role name <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" value={editing.name} disabled={editing.isSystem}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Senior Receptionist" />
                  {editing.isSystem && <p className="mt-1 text-xs text-muted-foreground">Built-in role name is locked.</p>}
                </div>
                <div>
                  <Label>Base behavior</Label>
                  <Select value={editing.baseRole} onValueChange={(v) => setEditing({ ...editing, baseRole: v as BaseRole })} disabled={editing.isSystem}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BASE_ROLES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">{BASE_ROLES.find((b) => b.value === editing.baseRole)?.hint}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Optional" />
              </div>

              {editing.baseRole === 'admin' ? (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Administrator roles have full access to every module — no need to pick permissions.
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</Label>
                  {grouped.map(({ group, modules: mods }) => (
                    <div key={group} className="rounded-lg border">
                      <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-semibold">{group}</div>
                      <div className="divide-y">
                        {mods.map((mod) => {
                          const all = mod.actions.every((a) => editing.keys.has(permKey(mod.key, a)));
                          return (
                            <div key={mod.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
                              <label className="flex min-w-[160px] cursor-pointer items-center gap-2 font-medium">
                                <Checkbox checked={all} onCheckedChange={(c) => toggleModuleAll(mod, c === true)} />
                                {mod.label}
                              </label>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {(['view', 'create', 'edit', 'delete'] as PermissionAction[])
                                  .filter((a) => mod.actions.includes(a))
                                  .map((a) => {
                                    const k = permKey(mod.key, a);
                                    return (
                                      <label key={k} className={cn('flex cursor-pointer items-center gap-1.5 text-sm', a === 'delete' && 'text-destructive')}>
                                        <Checkbox checked={editing.keys.has(k)} onCheckedChange={(c) => toggleKey(k, c === true)} />
                                        {ACTION_LABELS[a]}
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !editing?.name.trim()}
            >
              {saveMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesAdminPage;

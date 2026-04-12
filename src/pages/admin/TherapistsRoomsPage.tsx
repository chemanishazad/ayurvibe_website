import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { ADMIN_ALL_CLINICS_VALUE, useAdminClinic } from '@/contexts/AdminClinicContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, DoorOpen, Loader2, Plus, UserRound } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const TherapistsRoomsPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clinics, selectedClinicId, setSelectedClinicId } = useAdminClinic();

  const clinicFilterValue = selectedClinicId || ADMIN_ALL_CLINICS_VALUE;
  const effectiveClinicId = selectedClinicId || null;

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', effectiveClinicId, 'includeInactive'],
    enabled: isAdmin && !!effectiveClinicId,
    queryFn: () =>
      api.clinicManagement.listRooms({
        clinicId: effectiveClinicId!,
        includeInactive: true,
      }),
  });

  const { data: therapists = [], isLoading: therapistsLoading } = useQuery({
    queryKey: ['therapists', effectiveClinicId],
    enabled: isAdmin && !!effectiveClinicId,
    queryFn: () => api.clinicManagement.listTherapists({ clinicId: effectiveClinicId! }),
  });

  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [therapistName, setTherapistName] = useState('');
  const [therapistPhone, setTherapistPhone] = useState('');
  const [mapClinics, setMapClinics] = useState<string[]>([]);

  useEffect(() => {
    if (effectiveClinicId) setMapClinics([effectiveClinicId]);
  }, [effectiveClinicId]);

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  const createRoomMutation = useMutation({
    mutationFn: () =>
      api.clinicManagement.createRoom({
        clinicId: effectiveClinicId!,
        roomNumber: roomNumber.trim(),
        name: roomName.trim() || null,
        isActive: true,
      }),
    onSuccess: () => {
      toast({ title: 'Room added' });
      setRoomNumber('');
      setRoomName('');
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const createTherapistMutation = useMutation({
    mutationFn: () =>
      api.clinicManagement.createTherapist({
        name: therapistName.trim(),
        phone: therapistPhone.trim() || null,
        clinicIds: mapClinics.length > 0 ? mapClinics : [effectiveClinicId!],
      }),
    onSuccess: () => {
      toast({ title: 'Therapist added' });
      setTherapistName('');
      setTherapistPhone('');
      if (effectiveClinicId) setMapClinics([effectiveClinicId]);
      qc.invalidateQueries({ queryKey: ['therapists'] });
    },
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const toggleRoomActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.clinicManagement.updateRoom(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: (e) => toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }),
  });

  const canSubmitRoom = effectiveClinicId && roomNumber.trim().length > 0;
  const canSubmitTherapist = therapistName.trim().length > 0 && mapClinics.length > 0 && !!effectiveClinicId;

  const loading = (roomsLoading || therapistsLoading) && !!effectiveClinicId;

  const headerRight = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Branch</span>
        <Select
          value={clinicFilterValue}
          onValueChange={(v) => setSelectedClinicId(v === ADMIN_ALL_CLINICS_VALUE ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[min(72vw,260px)]">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ADMIN_ALL_CLINICS_VALUE}>All branches (pick one below)</SelectItem>
            {clinics.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ),
    [clinicFilterValue, clinics, setSelectedClinicId],
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Administrator access required.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title="Therapists & rooms" description="Map therapists and therapy rooms to each branch. Used when scheduling treatment sessions.">
        {headerRight}
      </PageHeader>

      {!effectiveClinicId && (
        <Card className="border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Select a branch
            </CardTitle>
            <CardDescription>
              Choose a clinic in the header or above to manage therapists and rooms for that location. This mirrors how doctors are assigned per branch.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {effectiveClinicId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Rooms at {clinicName(effectiveClinicId)}
              </CardTitle>
              <CardDescription>Room numbers are unique within each branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1 min-w-[200px]">
                  <div>
                    <Label htmlFor="room-num">Room no.</Label>
                    <Input
                      id="room-num"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 3"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-name">Label (optional)</Label>
                    <Input
                      id="room-name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g. Abhyanga"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canSubmitRoom || createRoomMutation.isPending}
                    onClick={() => createRoomMutation.mutate()}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add room
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && rooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : rooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No rooms yet. Add one above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rooms.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.roomNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{r.name || '—'}</TableCell>
                          <TableCell>
                            {r.isActive ? (
                              <Badge variant="secondary">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() =>
                                toggleRoomActiveMutation.mutate({ id: r.id, isActive: !r.isActive })
                              }
                            >
                              {r.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Therapists
              </CardTitle>
              <CardDescription>
                New therapists can be linked to this branch only, or to multiple branches (like doctors).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="th-name">Name</Label>
                <Input
                  id="th-name"
                  value={therapistName}
                  onChange={(e) => setTherapistName(e.target.value)}
                  placeholder="Therapist name"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-phone">Phone (optional)</Label>
                <Input
                  id="th-phone"
                  value={therapistPhone}
                  onChange={(e) => setTherapistPhone(e.target.value)}
                  placeholder="Mobile"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Also assign to branches</p>
                <div className="grid gap-2 max-h-40 overflow-y-auto rounded-md border p-2">
                  {clinics.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={mapClinics.includes(c.id) || (c.id === effectiveClinicId && mapClinics.length === 0)}
                        onCheckedChange={(checked) => {
                          setMapClinics((prev) => {
                            if (checked) return prev.includes(c.id) ? prev : [...prev, c.id];
                            return prev.filter((x) => x !== c.id);
                          });
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Select at least one branch (defaults to the branch you picked above).</p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!canSubmitTherapist || createTherapistMutation.isPending}
                onClick={() => createTherapistMutation.mutate()}
              >
                <Plus className="h-4 w-4 mr-1" /> Add therapist
              </Button>

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {therapists.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                          No therapists mapped to this branch yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      therapists.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">{t.phone || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TherapistsRoomsPage;

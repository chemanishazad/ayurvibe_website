import React, { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import { formatAppDate } from '@/lib/datetime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { CalendarClock, Search } from 'lucide-react';

interface UpcomingFollowUp {
  id: string;
  date: string;
  time?: string;
  patientName: string;
  patientMobile?: string;
  clinicName?: string;
  doctorName?: string;
  notes?: string;
}

const UpcomingFollowUpsPage: React.FC = () => {
  const { effectiveClinicId } = useAdminClinic();
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('7d');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<UpcomingFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        let fromDate = today.toISOString().slice(0, 10);
        let toDate: string | undefined;
        if (dateRange === '7d') {
          const d = new Date(today);
          d.setDate(d.getDate() + 7);
          toDate = d.toISOString().slice(0, 10);
        } else if (dateRange === '30d') {
          const d = new Date(today);
          d.setDate(d.getDate() + 30);
          toDate = d.toISOString().slice(0, 10);
        }

        const data = await api.followUps.upcoming({
          clinicId: effectiveClinicId || undefined,
          fromDate,
          toDate,
        });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Failed to load upcoming follow ups.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange, effectiveClinicId]);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.patientName.toLowerCase().includes(q) ||
      (item.patientMobile && item.patientMobile.toLowerCase().includes(q)) ||
      (item.doctorName && item.doctorName.toLowerCase().includes(q))
    );
  });

  const selected = filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Upcoming Follow Ups</h1>
            <p className="text-sm text-muted-foreground">
              View all patients with upcoming follow ups and their details.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex flex-wrap items-center gap-3 justify-between">
            <span>Follow Up Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'today' | '7d' | '30d')}
            >
              <option value="today">Today</option>
              <option value="7d">Next 7 days</option>
              <option value="30d">Next 30 days</option>
            </select>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by patient, mobile, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr] flex-1 min-h-0">
        <Card className="min-h-0 border-none shadow-sm">
          <CardContent className="pt-4 h-full flex flex-col min-h-0">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading upcoming follow ups...</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming follow ups found for the selected filters.</p>
            ) : (
              <div className="rounded-md border bg-card overflow-hidden flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Clinic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const d = parseISO(item.date);
                      const dateLabel = isNaN(d.getTime()) ? item.date : formatAppDate(d);
                      const isActive = selected?.id === item.id;
                      return (
                        <TableRow
                          key={item.id}
                          className={isActive ? 'bg-muted/70 hover:bg-muted cursor-pointer' : 'hover:bg-muted/40 cursor-pointer'}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <TableCell className="whitespace-nowrap font-medium">{dateLabel}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.time || '-'}</TableCell>
                          <TableCell className="font-medium">{item.patientName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.doctorName || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.clinicName || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Follow Up Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!selected ? (
              <p className="text-muted-foreground">Select a follow up from the list to see full details.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patient</p>
                  <p className="mt-0.5 text-base font-semibold">{selected.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selected.patientMobile || 'No mobile number'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</p>
                    <p className="mt-0.5">
                      {(() => {
                        const d = parseISO(selected.date);
                        return isNaN(d.getTime()) ? selected.date : formatAppDate(d);
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</p>
                    <p className="mt-0.5">{selected.time || 'Not specified'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Doctor</p>
                    <p className="mt-0.5">{selected.doctorName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clinic</p>
                    <p className="mt-0.5">{selected.clinicName || 'Current clinic'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes / Diagnosis</p>
                  <p className="mt-1 rounded-md border bg-muted/40 px-3 py-2 leading-relaxed">
                    {selected.notes || 'No notes recorded for this follow up.'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpcomingFollowUpsPage;


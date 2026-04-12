import React, { useMemo } from 'react';
import { Wallet, Clock3, User } from 'lucide-react';

export type DailyScheduleItem = {
  appointmentId: string;
  therapistId: string;
  therapistName: string;
  roomNumber: string;
  patientName: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  balanceDue?: number;
};

const statusChipClass: Record<DailyScheduleItem['status'], string> = {
  SCHEDULED: 'bg-amber-50 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-300',
  NO_SHOW: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function DailyScheduleView({ items, dateLabel }: { items: DailyScheduleItem[]; dateLabel: string }) {
  const grouped = useMemo(() => {
    const m = new Map<string, DailyScheduleItem[]>();
    for (const item of items) {
      const key = `${item.therapistName}::${item.roomNumber}`;
      const arr = m.get(key) ?? [];
      arr.push(item);
      m.set(key, arr.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)));
    }
    return Array.from(m.entries());
  }, [items]);

  return (
    <section className="space-y-4 rounded-xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-900">Daily Schedule</h3>
        <p className="text-xs text-muted-foreground">{dateLabel}</p>
      </div>
      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-green-200 bg-amber-50/30 p-6 text-center text-sm text-muted-foreground">
          No active appointments for selected date.
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([key, rows]) => {
            const [therapistName, roomNumber] = key.split('::');
            return (
              <div key={key} className="rounded-lg border border-green-100">
                <div className="flex items-center justify-between border-b bg-green-50 px-3 py-2">
                  <p className="text-sm font-semibold text-green-900">
                    <User className="mr-1 inline h-4 w-4" />
                    {therapistName}
                  </p>
                  <p className="text-xs text-muted-foreground">Room {roomNumber}</p>
                </div>
                <div className="divide-y">
                  {rows.map((row) => (
                    <div key={row.appointmentId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{row.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                          {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusChipClass[row.status]}`}>
                          {row.status}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${row.balanceDue && row.balanceDue > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                          <Wallet className="mr-1 inline h-3.5 w-3.5" />
                          {row.balanceDue && row.balanceDue > 0 ? `Pending Rs. ${row.balanceDue.toLocaleString()}` : 'Paid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

import React, { useMemo } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export type AvailabilitySlot = {
  appointmentId: string;
  therapistId: string;
  therapistName: string;
  roomNumber: string;
  patientName: string;
  startTime: string;
  endTime: string;
};

type Props = {
  slots: AvailabilitySlot[];
  rangeLabel: string;
};

const TIME_COLUMNS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function timeToMinutes(timeLike: string) {
  const d = new Date(timeLike);
  return d.getHours() * 60 + d.getMinutes();
}

export default function TherapistAvailabilityDashboard({ slots, rangeLabel }: Props) {
  const therapists = useMemo(
    () => Array.from(new Map(slots.map((s) => [s.therapistId, s.therapistName])).entries()),
    [slots],
  );

  const slotsByTherapist = useMemo(() => {
    const m = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      const arr = m.get(slot.therapistId) ?? [];
      arr.push(slot);
      m.set(slot.therapistId, arr);
    }
    return m;
  }, [slots]);

  return (
    <section className="space-y-3 rounded-xl border border-green-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-900">Therapist Availability Dashboard</h3>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
      </div>
      <div className="overflow-auto rounded-md border border-green-100">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[180px_repeat(11,minmax(0,1fr))] border-b bg-green-50 text-xs font-semibold text-green-900">
            <div className="border-r px-3 py-2">Therapist</div>
            {TIME_COLUMNS.map((c) => (
              <div key={c} className="border-r px-2 py-2 text-center last:border-r-0">
                {c}
              </div>
            ))}
          </div>
          {therapists.map(([therapistId, therapistName]) => {
            const rowSlots = slotsByTherapist.get(therapistId) ?? [];
            return (
              <div key={therapistId} className="grid grid-cols-[180px_repeat(11,minmax(0,1fr))] border-b last:border-b-0">
                <div className="border-r bg-amber-50/40 px-3 py-3 text-sm font-medium">{therapistName}</div>
                <div className="col-span-11 px-2 py-2">
                  <div className="relative h-12 rounded bg-amber-50/30">
                    {rowSlots.map((slot) => {
                      const startMin = timeToMinutes(slot.startTime);
                      const endMin = timeToMinutes(slot.endTime);
                      const dayStart = 8 * 60;
                      const dayEnd = 19 * 60;
                      const leftPct = ((startMin - dayStart) / (dayEnd - dayStart)) * 100;
                      const widthPct = ((endMin - startMin) / (dayEnd - dayStart)) * 100;
                      return (
                        <div
                          key={slot.appointmentId}
                          className="absolute top-1 rounded bg-green-700 px-2 py-1 text-[11px] text-white shadow"
                          style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.max(7, widthPct)}%` }}
                          title={`${slot.patientName} · Room ${slot.roomNumber}`}
                        >
                          <p className="truncate">{slot.patientName}</p>
                          <p className="truncate text-[10px] opacity-90">
                            <Clock className="mr-1 inline h-3 w-3" />
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Rm {slot.roomNumber}
                          </p>
                        </div>
                      );
                    })}
                    {rowSlots.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No bookings</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        Conflicts are blocked by backend anti-collapse engine before save.
      </div>
    </section>
  );
}

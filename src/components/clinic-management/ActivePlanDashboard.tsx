import React from 'react';
import { User, Wallet, Clock } from 'lucide-react';

type PlanDayStatus = 'PENDING' | 'COMPLETED' | 'NO_SHOW';

export type ActivePlanDashboardModel = {
  planId: string;
  patientName: string;
  therapistName?: string | null;
  totalCost: number;
  advancePaid: number;
  balanceDue: number;
  startDate: string;
  endDate: string;
  isFinalPaymentPending: boolean;
  days: Array<{
    id: string;
    dayNumber: number;
    date: string;
    status: PlanDayStatus;
    therapistName?: string | null;
  }>;
};

const statusClass: Record<PlanDayStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  NO_SHOW: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function ActivePlanDashboard({ plan }: { plan: ActivePlanDashboardModel }) {
  return (
    <section className="space-y-4 rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-amber-50 p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-green-100 bg-white p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <User className="h-4 w-4 text-green-700" />
            Patient
          </div>
          <p className="mt-1 text-sm font-semibold">{plan.patientName}</p>
          <p className="text-xs text-muted-foreground">{plan.therapistName || 'Therapist pending assignment'}</p>
        </div>
        <div className="rounded-lg border border-green-100 bg-white p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Wallet className="h-4 w-4 text-green-700" />
            Total Cost
          </div>
          <p className="mt-1 text-lg font-semibold">Rs. {plan.totalCost.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-green-100 bg-white p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Wallet className="h-4 w-4 text-green-700" />
            Advance Paid
          </div>
          <p className="mt-1 text-lg font-semibold text-emerald-700">Rs. {plan.advancePaid.toLocaleString()}</p>
        </div>
        <div className={`rounded-lg border p-3 ${plan.balanceDue > 0 ? 'border-rose-200 bg-rose-50' : 'border-green-100 bg-white'}`}>
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Clock className="h-4 w-4 text-rose-700" />
            Balance Due
          </div>
          <p className="mt-1 text-lg font-semibold">Rs. {plan.balanceDue.toLocaleString()}</p>
          {plan.isFinalPaymentPending ? (
            <p className="text-xs font-medium text-rose-700">Final payment pending (highlight on Day 7)</p>
          ) : (
            <p className="text-xs text-emerald-700">Fully paid</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-green-100 bg-white p-3">
        <h3 className="text-sm font-semibold text-green-900">7-Day Status Tracker</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {plan.days.map((day) => (
            <div key={day.id} className={`rounded-md border px-2 py-2 text-xs ${statusClass[day.status]}`}>
              <p className="font-semibold">Day {day.dayNumber}</p>
              <p>{day.date}</p>
              <p className="mt-1">{day.status}</p>
              <p className="truncate text-[11px] opacity-90">{day.therapistName || 'Therapist TBD'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

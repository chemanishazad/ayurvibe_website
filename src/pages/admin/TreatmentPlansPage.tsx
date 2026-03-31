import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatIsoDateToApp } from '@/lib/datetime';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { Plus } from 'lucide-react';

function parseMoney(v: unknown): number {
  const n = parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TreatmentPlansPage = () => {
  const { effectiveClinicId } = useAdminClinic();
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const params = effectiveClinicId ? { clinicId: effectiveClinicId } : undefined;
    api.treatmentPlans
      .list(params)
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [effectiveClinicId]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Treatment Plans"
        description="Package total, advance, and balance are stored per plan. Use the header clinic selector to filter the list by branch."
      >
        <Button asChild>
          <Link to="/admin/treatment-plans/new">
            <Plus className="h-4 w-4 mr-2" />
            New treatment plan
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>All treatment plans</CardTitle>
          <CardDescription>Recent plans for your accessible clinics</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-muted-foreground">No treatment plans yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => {
                const total = parseMoney(p.totalCost);
                const advance = parseMoney(p.advancePaid);
                const balance = parseMoney(p.balanceDue);
                return (
                  <div key={p.id as string} className="rounded-lg border p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2 font-medium">
                      <span>{p.name as string}</span>
                      <span className="text-muted-foreground shrink-0">{(p.durationDays as number)} days</span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      {(p.patientName as string)}
                      {p.consultationDate
                        ? ` · OP ${formatIsoDateToApp(String(p.consultationDate).slice(0, 10))}`
                        : ` · from ${formatIsoDateToApp(String(p.startDate ?? '').slice(0, 10))}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatIsoDateToApp(String(p.startDate ?? '').slice(0, 10))} –{' '}
                      {formatIsoDateToApp(String(p.endDate ?? '').slice(0, 10))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-xs tabular-nums">
                      <span>
                        <span className="text-muted-foreground">Total </span>
                        <span className="font-medium text-foreground">{formatInr(total)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Advance </span>
                        <span className="font-medium text-foreground">{formatInr(advance)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Balance </span>
                        <span className={`font-medium ${balance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                          {formatInr(balance)}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentPlansPage;

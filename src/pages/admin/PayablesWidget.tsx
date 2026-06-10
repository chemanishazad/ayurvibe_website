import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatIsoDateToApp } from '@/lib/datetime';
import { formatINR } from '@/lib/money';
import { AlertTriangle, CalendarClock, Wallet, ArrowRight } from 'lucide-react';

const inr = (v: string | number | null | undefined) => formatINR(v, { decimals: 0 });

/**
 * Dashboard reminder for agency payables: total outstanding, overdue, and bills due soon.
 * Self-contained (own query), so it can be dropped into any dashboard branch.
 */
export function PayablesWidget({ dueDays = 7 }: { dueDays?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['payables-summary', dueDays],
    queryFn: () => api.payables.summary(dueDays),
  });

  if (isLoading) {
    return <Card className="border-border/60"><CardContent className="pt-6"><div className="h-20 animate-pulse rounded bg-muted" /></CardContent></Card>;
  }
  if (!data) return null;

  const nothingDue = data.overdue.count === 0 && data.dueSoon.count === 0;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-primary" />
          Agency payables
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link to="/admin/purchase-bills" className="gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Outstanding</div>
            <div className="text-lg font-semibold">{inr(data.totalOutstanding)}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" />Overdue</div>
            <div className="text-lg font-semibold text-red-700">{inr(data.overdue.amount)}</div>
            <div className="text-xs text-red-600/80">{data.overdue.count} bill{data.overdue.count === 1 ? '' : 's'}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-1 text-xs text-amber-600"><CalendarClock className="h-3.5 w-3.5" />Due ≤{dueDays}d</div>
            <div className="text-lg font-semibold text-amber-700">{inr(data.dueSoon.amount)}</div>
            <div className="text-xs text-amber-600/80">{data.dueSoon.count} bill{data.dueSoon.count === 1 ? '' : 's'}</div>
          </div>
        </div>

        {nothingDue ? (
          <p className="text-sm text-muted-foreground">No bills overdue or due soon. 🎉</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {[...data.overdue.bills, ...data.dueSoon.bills].slice(0, 5).map((b) => {
              const overdue = !!b.dueDate && b.dueDate < new Date().toISOString().slice(0, 10);
              return (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{b.supplierName ?? '—'}</span>
                    <span className="text-muted-foreground"> · {b.billNumber || 'no bill no.'}</span>
                    <div className={overdue ? 'text-xs text-red-600' : 'text-xs text-amber-600'}>
                      Due {b.dueDate ? formatIsoDateToApp(b.dueDate) : '—'}{overdue ? ' · overdue' : ''}
                    </div>
                  </div>
                  <span className="font-medium">{inr(b.pending)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default PayablesWidget;

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatIsoDateToApp, localDateYmd } from '@/lib/datetime';
import { formatINR as inr, toAmount as money } from '@/lib/money';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine, Layers, ScrollText } from 'lucide-react';

function expiryTone(expiry: string | null): { label: string; cls: string } | null {
  if (!expiry) return null;
  const today = localDateYmd();
  if (expiry < today) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  if (expiry <= soon.toISOString().slice(0, 10)) return { label: 'Expiring soon', cls: 'bg-amber-100 text-amber-800' };
  return null;
}

/**
 * Per-medicine FIFO monitor: batch-by-batch cost/sell/margin/expiry, plus an
 * optional stock-movement ledger (purchases in, sales out, running balance, profit).
 * Reused on the Inventory expand row and the dedicated Batches & Costing page.
 */
export function MedicineBatchPanel({
  clinicId,
  medicineId,
  baseUnit,
  showLedger = true,
}: {
  clinicId: string;
  medicineId: string;
  baseUnit?: string | null;
  showLedger?: boolean;
}) {
  const [tab, setTab] = useState<'batches' | 'ledger'>('batches');

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['medicine-batches', clinicId, medicineId],
    queryFn: () => api.inventory.medicineBatches(clinicId, medicineId),
    enabled: !!clinicId && !!medicineId,
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['medicine-ledger', clinicId, medicineId],
    queryFn: () => api.inventory.ledger(clinicId, medicineId),
    enabled: showLedger && tab === 'ledger' && !!clinicId && !!medicineId,
  });

  const unit = baseUnit || 'unit';

  const totals = useMemo(() => {
    let stockValue = 0;
    let remaining = 0;
    for (const b of batches) {
      stockValue += money(b.stockValue);
      remaining += b.remainingQuantity;
    }
    const live = batches.filter((b) => !b.isDepleted);
    const costs = live.map((b) => money(b.unitPurchasePrice));
    const sells = live.map((b) => money(b.effectiveSellingPrice));
    return {
      stockValue,
      remaining,
      liveBatches: live.length,
      costRange: costs.length ? [Math.min(...costs), Math.max(...costs)] : null,
      sellRange: sells.length ? [Math.min(...sells), Math.max(...sells)] : null,
    };
  }, [batches]);

  return (
    <div className="space-y-3">
      {/* Mini summary */}
      <div className="grid gap-2 sm:grid-cols-4">
        <SummaryCell label={`In stock (${unit})`} value={String(totals.remaining)} />
        <SummaryCell label="Stock value (at cost)" value={inr(totals.stockValue)} />
        <SummaryCell
          label="Cost / unit range"
          value={totals.costRange ? (totals.costRange[0] === totals.costRange[1] ? inr(totals.costRange[0]) : `${inr(totals.costRange[0])}–${inr(totals.costRange[1])}`) : '—'}
        />
        <SummaryCell
          label="Sell / unit range"
          value={totals.sellRange ? (totals.sellRange[0] === totals.sellRange[1] ? inr(totals.sellRange[0]) : `${inr(totals.sellRange[0])}–${inr(totals.sellRange[1])}`) : '—'}
        />
      </div>

      {showLedger && (
        <div className="flex gap-1">
          <TabButton active={tab === 'batches'} onClick={() => setTab('batches')} icon={<Layers className="h-3.5 w-3.5" />}>Batches</TabButton>
          <TabButton active={tab === 'ledger'} onClick={() => setTab('ledger')} icon={<ScrollText className="h-3.5 w-3.5" />}>Movement ledger</TabButton>
        </div>
      )}

      {tab === 'batches' ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Batch / Supplier</th>
                <th className="px-3 py-2">Purchased</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2 text-right">Qty (rem/total)</th>
                <th className="px-3 py-2 text-right">Cost/unit</th>
                <th className="px-3 py-2 text-right">Sell/unit</th>
                <th className="px-3 py-2 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {batchesLoading ? (
                <tr><td colSpan={7} className="px-3 py-4"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No batches recorded for this medicine.</td></tr>
              ) : (
                batches.map((b) => {
                  const tone = expiryTone(b.expiryDate);
                  const marginNeg = money(b.margin) < 0;
                  return (
                    <tr key={b.id} className={cn('border-b last:border-0', b.isDepleted && 'opacity-50')}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{b.batchNumber || '(no batch no.)'}</div>
                        <div className="text-xs text-muted-foreground">{b.supplierName ?? '—'}</div>
                      </td>
                      <td className="px-3 py-2">{formatIsoDateToApp(b.purchaseDate)}</td>
                      <td className="px-3 py-2">
                        {b.expiryDate ? (
                          <span className="flex flex-col gap-0.5">
                            <span>{formatIsoDateToApp(b.expiryDate)}</span>
                            {tone && <span className={cn('w-fit rounded px-1.5 py-0.5 text-[10px] font-medium', tone.cls)}>{tone.label}</span>}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {b.isDepleted ? <span className="text-muted-foreground">0 / {b.quantity}</span> : <><span className="font-medium">{b.remainingQuantity}</span> / {b.quantity}</>}
                      </td>
                      <td className="px-3 py-2 text-right">{inr(b.unitPurchasePrice)}</td>
                      <td className="px-3 py-2 text-right">{inr(b.effectiveSellingPrice)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn('font-medium', marginNeg ? 'text-red-600' : 'text-emerald-700')}>
                          {inr(b.margin)}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">{b.marginPct}%</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <LedgerView loading={ledgerLoading} ledger={ledger} />
      )}
    </div>
  );
}

function LedgerView({ loading, ledger }: { loading: boolean; ledger: import('@/lib/api').StockLedger | undefined }) {
  if (loading || !ledger) return <div className="h-24 animate-pulse rounded bg-muted" />;
  const { entries, summary } = ledger;
  return (
    <div className="space-y-3">
      {summary && (
        <div className="grid gap-2 sm:grid-cols-4">
          <SummaryCell label="Total in" value={String(summary.totalIn)} />
          <SummaryCell label="Total out" value={String(summary.totalOut)} />
          <SummaryCell label="Sales value" value={inr(summary.salesValue)} />
          <SummaryCell label="Profit (sell − cost)" value={inr(summary.totalProfit)} tone={money(summary.totalProfit) >= 0 ? 'pos' : 'neg'} />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Party / Batch</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit price</th>
              <th className="px-3 py-2 text-right">Profit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No stock movements yet.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={`${e.type}-${e.id}`} className="border-b last:border-0">
                  <td className="px-3 py-2">{formatIsoDateToApp(e.date)}</td>
                  <td className="px-3 py-2">
                    {e.type === 'in' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><ArrowDownToLine className="h-3.5 w-3.5" />In</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700"><ArrowUpFromLine className="h-3.5 w-3.5" />Out</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div>{e.party ?? '—'}</div>
                    {e.batchNumber && <div className="text-xs text-muted-foreground">{e.batchNumber}</div>}
                  </td>
                  <td className="px-3 py-2 text-right">{e.type === 'in' ? '+' : '−'}{e.quantity}</td>
                  <td className="px-3 py-2 text-right">{inr(e.unitPrice)}</td>
                  <td className="px-3 py-2 text-right">
                    {e.profit != null ? <span className={money(e.profit) >= 0 ? 'text-emerald-700' : 'text-red-600'}>{inr(e.profit)}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{e.balance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-semibold', tone === 'pos' && 'text-emerald-700', tone === 'neg' && 'text-red-600')}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
      )}
    >
      {icon}{children}
    </button>
  );
}

export default MedicineBatchPanel;

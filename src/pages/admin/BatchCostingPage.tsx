import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { MedicineBatchPanel } from '@/components/admin/MedicineBatchPanel';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import { formatIsoDateToApp, localDateYmd } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { AlertTriangle, Layers, PackageSearch } from 'lucide-react';

const BatchCostingPage = () => {
  const perms = usePermissions();
  const canView = perms.has('inventory.view');
  const { effectiveClinicId, clinics } = useAdminClinic();
  const clinicId = effectiveClinicId || (clinics.length === 1 ? clinics[0].id : '');

  const [medicineId, setMedicineId] = useState<string>('');

  const { data: medicines = [] } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => api.medicines.list(),
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-batches', clinicId],
    queryFn: () => api.inventory.expiring(clinicId, 90),
    enabled: !!clinicId,
  });

  const medicineOptions = useMemo<ComboboxOption[]>(
    () =>
      medicines
        .filter((m) => m.status !== 'archived')
        .map((m) => ({ value: m.id, label: m.name, hint: m.baseUnit || m.uom || undefined, keywords: m.category ?? '' })),
    [medicines],
  );

  const selected = medicines.find((m) => m.id === medicineId);

  if (!canView) return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches & Costing"
        description="Track every batch's buy/sell price, margin, expiry and stock movement — FIFO, oldest sold first."
      />

      {!clinicId ? (
        <Card><CardContent className="pt-6 text-muted-foreground">Choose a clinic from the header dropdown to view batches.</CardContent></Card>
      ) : (
        <>
          {/* Expiry alert — expired (red) and expiring-soon (amber), click a chip to inspect. */}
          {expiring.length > 0 && (() => {
            const todayYmd = localDateYmd();
            const expired = expiring.filter((e) => e.expiryDate && e.expiryDate < todayYmd);
            const soon = expiring.filter((e) => !e.expiryDate || e.expiryDate >= todayYmd);
            return (
              <Card className="overflow-hidden border-amber-300/70">
                <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Expiry attention
                  </span>
                  <span className="ml-auto flex items-center gap-2 text-xs">
                    {expired.length > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">{expired.length} expired</span>
                    )}
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">{soon.length} within 90 days</span>
                  </span>
                </div>
                <CardContent className="space-y-2 py-3">
                  <div className="flex flex-wrap gap-2">
                    {[...expired, ...soon].map((e) => {
                      const isExpired = !!e.expiryDate && e.expiryDate < todayYmd;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setMedicineId(e.medicineId)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            isExpired
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
                          )}
                          title={`${e.batchNumber ?? 'No batch'} · ${e.remainingQuantity} left · ${e.supplierName ?? ''}`}
                        >
                          <span className="font-semibold">{e.medicineName}</span>
                          <span className="opacity-70">·</span>
                          <span>{formatIsoDateToApp(e.expiryDate)}</span>
                          <span className="opacity-70">·</span>
                          <span>{e.remainingQuantity} left</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pick a medicine</CardTitle>
              <CardDescription>Search the catalog to inspect its batches and movement history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Combobox
                  options={medicineOptions}
                  value={medicineId || undefined}
                  onChange={setMedicineId}
                  placeholder="Search medicines…"
                  searchPlaceholder="Type a medicine name…"
                />
              </div>
            </CardContent>
          </Card>

          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {selected.name}
                  {selected.baseUnit || selected.uom ? <span className="text-sm font-normal text-muted-foreground">({selected.baseUnit || selected.uom})</span> : null}
                </CardTitle>
                <CardDescription>Batches sell oldest-first. Margin = sell − cost per unit.</CardDescription>
              </CardHeader>
              <CardContent>
                <MedicineBatchPanel clinicId={clinicId} medicineId={selected.id} baseUnit={selected.baseUnit || selected.uom} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <PackageSearch className="h-8 w-8" />
                <p>Select a medicine above to see its batch-level cost, price and stock movement.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BatchCostingPage;

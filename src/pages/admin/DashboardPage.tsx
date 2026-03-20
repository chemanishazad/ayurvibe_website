import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import {
  Building2,
  Users,
  Stethoscope,
  Pill,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  FileText,
  ShoppingCart,
  Wallet,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import { useAdminClinic } from '@/contexts/AdminClinicContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function getDateRangeForPeriod(period: 'daily' | 'weekly' | 'monthly') {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  if (period === 'daily') return { from: todayStr, to: todayStr };
  if (period === 'weekly') return { from: format(subDays(today, 7), 'yyyy-MM-dd'), to: todayStr };
  return { from: format(subDays(today, 30), 'yyyy-MM-dd'), to: todayStr };
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: 'default' | 'success' | 'warning';
}) => (
  <Card className="group border border-border/60 bg-card shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-border hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      <div
        className={`rounded-lg p-2 transition-colors ${accent === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : accent === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}
      >
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent className="pb-4 pt-0">
      <div className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);

const dateInputClass =
  'h-9 rounded-md border border-input bg-background px-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

const FilterBar = ({
  chartPeriod,
  dateFrom,
  dateTo,
  onPeriodChange,
  onDateFromChange,
  onDateToChange,
  onApply,
  loading,
}: {
  chartPeriod: 'daily' | 'weekly' | 'monthly';
  dateFrom: string;
  dateTo: string;
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly') => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onApply: () => void;
  loading: boolean;
}) => (
  <section
    className="rounded-xl border border-border/60 bg-muted/25 shadow-sm dark:bg-muted/15"
    aria-label="Dashboard date range"
  >
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarRange className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Date range</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Preset or custom dates, then apply to refresh figures.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Preset</span>
          <div className="flex flex-wrap gap-1.5">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={chartPeriod === p ? 'default' : 'outline'}
                className="h-8 rounded-md px-3 text-xs"
                onClick={() => onPeriodChange(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="dash-date-from" className="text-[11px] font-medium text-muted-foreground">
              From
            </label>
            <input
              id="dash-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className={dateInputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dash-date-to" className="text-[11px] font-medium text-muted-foreground">
              To
            </label>
            <input
              id="dash-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className={dateInputClass}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 shrink-0 gap-1.5 px-3 sm:ml-1"
            onClick={onApply}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const DashboardPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { effectiveClinicId, clinics } = useAdminClinic();
  const adminFilterClinicName = effectiveClinicId ? clinics.find((c) => c.id === effectiveClinicId)?.name : null;
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const initialRange = getDateRangeForPeriod('daily');
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);
  const [adminData, setAdminData] = useState<Awaited<ReturnType<typeof api.dashboard.admin>> | null>(null);
  const [clinicData, setClinicData] = useState<Awaited<ReturnType<typeof api.dashboard.clinic>> | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Awaited<ReturnType<typeof api.dashboard.analytics>> | null>(null);
  const [medicineSalesData, setMedicineSalesData] = useState<{ medicineName: string; quantity: number; total: number }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateParams = { from: appliedFrom, to: appliedTo };
      if (isAdmin) {
        const clinicOpt = effectiveClinicId || undefined;
        if (effectiveClinicId) {
          const [clinic, analytics, medicineSales] = await Promise.all([
            api.dashboard.clinic(effectiveClinicId, dateParams),
            api.dashboard.analytics({
              clinicId: clinicOpt,
              period: chartPeriod,
              from: appliedFrom,
              to: appliedTo,
            }),
            api.reports.medicineSales({ clinicId: clinicOpt, from: appliedFrom, to: appliedTo }),
          ]);
          setAdminData(null);
          setClinicData(clinic);
          setAnalyticsData(analytics);
          setMedicineSalesData(medicineSales);
        } else {
          const [admin, analytics, medicineSales] = await Promise.all([
            api.dashboard.admin(dateParams),
            api.dashboard.analytics({
              clinicId: undefined,
              period: chartPeriod,
              from: appliedFrom,
              to: appliedTo,
            }),
            api.reports.medicineSales({ clinicId: undefined, from: appliedFrom, to: appliedTo }),
          ]);
          setAdminData(admin);
          setClinicData(null);
          setAnalyticsData(analytics);
          setMedicineSalesData(medicineSales);
        }
      } else {
        const clinicId = user?.clinicId;
        const [clinic, analytics, medicineSales] = await Promise.all([
          api.dashboard.clinic(clinicId, dateParams),
          api.dashboard.analytics({ clinicId, period: chartPeriod, from: appliedFrom, to: appliedTo }),
          api.reports.medicineSales({ clinicId, from: appliedFrom, to: appliedTo }),
        ]);
        setClinicData(clinic);
        setAnalyticsData(analytics);
        setMedicineSalesData(medicineSales);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.clinicId, effectiveClinicId, chartPeriod, appliedFrom, appliedTo]);

  const handlePeriodChange = useCallback((period: 'daily' | 'weekly' | 'monthly') => {
    setChartPeriod(period);
    const range = getDateRangeForPeriod(period);
    setDateFrom(range.from);
    setDateTo(range.to);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
  }, []);

  const handleApply = useCallback(() => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateRangeLabel = appliedFrom === appliedTo ? appliedFrom : `${appliedFrom} to ${appliedTo}`;

  if (error) {
    return (
      <div className="space-y-5 pb-6">
        <PageHeader title="Dashboard" description="Error loading data" />
        <FilterBar
          chartPeriod={chartPeriod}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onPeriodChange={handlePeriodChange}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApply={handleApply}
          loading={false}
        />
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin && adminData && typeof adminData.totalClinics === 'number') {
    const clinicChartData = adminData.clinicWiseRevenue.map((r) => ({
      name: r.clinicName,
      revenue: r.revenue,
    }));

    const revenueBreakdown = [
      { name: 'Consultation Fees', value: adminData.consultationAmount, color: CHART_COLORS[0] },
      { name: 'Prescription Medicine', value: adminData.prescriptionMedicineSales, color: CHART_COLORS[1] },
      { name: 'Direct Medicine Sales', value: adminData.directMedicineSales, color: CHART_COLORS[2] },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6 pb-6">
        <PageHeader
          title="Admin dashboard"
          description="All clinics combined. Use the header clinic filter to see one location only."
        />

        <FilterBar
          chartPeriod={chartPeriod}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onPeriodChange={handlePeriodChange}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApply={handleApply}
          loading={loading}
        />

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/60">
                <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted animate-pulse rounded" /></CardHeader>
                <CardContent><div className="h-8 w-32 bg-muted animate-pulse rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="scroll-mt-4">
              <h2 className="mb-3 border-b border-border/60 pb-2 text-base font-semibold tracking-tight">
                Overview — <span className="text-muted-foreground font-normal">{dateRangeLabel}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard title="Total Clinics" value={adminData.totalClinics} icon={Building2} />
                <StatCard title="Total Patients" value={adminData.totalPatients} subtitle="All registered" icon={Users} />
                <StatCard title="Consultations" value={adminData.dailyConsultations} subtitle={adminData.newPatientRegistrationsToday != null ? `New: ${adminData.newPatientRegistrationsToday}` : undefined} icon={Stethoscope} />
                <StatCard title="Total Revenue" value={`₹${adminData.totalRevenue.toLocaleString()}`} icon={IndianRupee} accent="success" />
                <StatCard title="Medicine Sales" value={`₹${adminData.medicineSales.toLocaleString()}`} icon={Pill} />
                <StatCard title="Total Profit" value={`₹${adminData.totalProfit.toLocaleString()}`} icon={TrendingUp} accent="success" />
              </div>
            </div>

            <div className="scroll-mt-4">
              <h2 className="mb-3 border-b border-border/60 pb-2 text-base font-semibold tracking-tight">Revenue breakdown</h2>
              <div className="grid gap-3 lg:grid-cols-4">
                <StatCard title="Consultation Fees" value={`₹${adminData.consultationAmount.toLocaleString()}`} icon={FileText} />
                <StatCard title="Prescription Medicine" value={`₹${adminData.prescriptionMedicineSales.toLocaleString()}`} icon={Pill} />
                <StatCard title="Direct Medicine Sales" value={`₹${adminData.directMedicineSales.toLocaleString()}`} icon={ShoppingCart} />
                <StatCard title="Total Revenue" value={`₹${adminData.dailyRevenue.toLocaleString()}`} icon={Wallet} accent="success" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue sources</CardTitle>
                  <CardDescription>Consultation vs medicine sales</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueBreakdown.length > 0 ? (
                    <div className="h-[min(18rem,50vw)] min-h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {revenueBreakdown.map((_, i) => <Cell key={i} fill={revenueBreakdown[i].color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  ) : (
                    <p className="text-muted-foreground py-12 text-center">No revenue data for this period</p>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Clinic-wise revenue</CardTitle>
                  <CardDescription>Distribution across locations</CardDescription>
                </CardHeader>
                <CardContent>
                  {clinicChartData.length > 0 ? (
                    <div className="h-[min(18rem,50vw)] min-h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clinicChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-12 text-center">No clinic revenue data for this period</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {analyticsData && analyticsData.chartData.length > 0 && (
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Visits & revenue</CardTitle>
                      <CardDescription>Over the selected range</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                        <Button key={p} size="sm" variant={chartPeriod === p ? 'default' : 'outline'} onClick={() => handlePeriodChange(p)} className="rounded-lg">
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[min(22rem,55vw)] min-h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.chartData.map((d) => ({ ...d, name: d.date }))}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" tickFormatter={(v) => v.toString()} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number, name: string) => (name === 'revenue' ? [`₹${value.toLocaleString()}`, 'Revenue'] : [value, 'Visits'])} labelFormatter={(label) => `Date: ${label}`} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="visits" stroke={CHART_COLORS[0]} fill="url(#colorVisits)" name="Visits" strokeWidth={2} />
                        <Area yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} fill="url(#colorRevenue)" name="Revenue" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {medicineSalesData && medicineSalesData.length > 0 && (
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Medicine sales</CardTitle>
                  <CardDescription>Top items — {dateRangeLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[min(22rem,55vw)] min-h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={medicineSalesData.slice(0, 10).map((m) => ({ name: m.medicineName.length > 18 ? m.medicineName.slice(0, 18) + '…' : m.medicineName, fullName: m.medicineName, ...m }))} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{payload[0].payload.fullName}</p>
                            <p className="text-sm text-muted-foreground">₹{payload[0].payload.total?.toLocaleString()} ({payload[0].payload.quantity} units)</p>
                          </div>
                        ) : null} />
                        <Bar dataKey="total" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  if (clinicData && typeof clinicData.consultationsCount === 'number') {
    const revenueBreakdown = [
      { name: 'Consultation Fees', value: clinicData.consultationAmount, color: CHART_COLORS[0] },
      { name: 'Prescription Medicine', value: clinicData.prescriptionMedicineSales, color: CHART_COLORS[1] },
      { name: 'Direct Medicine Sales', value: clinicData.directMedicineSales, color: CHART_COLORS[2] },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6 pb-6">
        <PageHeader
          title={isAdmin && adminFilterClinicName ? `Clinic · ${adminFilterClinicName}` : 'Clinic dashboard'}
          description={
            isAdmin && adminFilterClinicName
              ? 'Filtered to this clinic only. Choose “All clinics” in the header for a full-network view.'
              : 'Overview by date range'
          }
        />

        <FilterBar
          chartPeriod={chartPeriod}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onPeriodChange={handlePeriodChange}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onApply={handleApply}
          loading={loading}
        />

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/60">
                <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted animate-pulse rounded" /></CardHeader>
                <CardContent><div className="h-8 w-32 bg-muted animate-pulse rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="scroll-mt-4">
              <h2 className="mb-3 border-b border-border/60 pb-2 text-base font-semibold tracking-tight">
                Summary — <span className="text-muted-foreground font-normal">{dateRangeLabel}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Patients" value={clinicData.todayPatients} icon={Users} />
                <StatCard title="Consultations" value={clinicData.consultationsCount} icon={Stethoscope} />
                <StatCard title="Total Revenue" value={`₹${clinicData.dailyRevenue.toLocaleString()}`} icon={IndianRupee} accent="success" />
                <StatCard title="Medicine Sales" value={`₹${clinicData.medicineSales.toLocaleString()}`} icon={Pill} />
              </div>
            </div>

            <div className="scroll-mt-4">
              <h2 className="mb-3 border-b border-border/60 pb-2 text-base font-semibold tracking-tight">Revenue breakdown</h2>
              <div className="grid gap-3 lg:grid-cols-3">
                <StatCard title="Consultation Fees" value={`₹${clinicData.consultationAmount.toLocaleString()}`} icon={FileText} />
                <StatCard title="Prescription Medicine" value={`₹${clinicData.prescriptionMedicineSales.toLocaleString()}`} icon={Pill} />
                <StatCard title="Direct Medicine Sales" value={`₹${clinicData.directMedicineSales.toLocaleString()}`} icon={ShoppingCart} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue sources</CardTitle>
                  <CardDescription>Consultation vs medicine sales</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueBreakdown.length > 0 ? (
                    <div className="h-[min(18rem,50vw)] min-h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {revenueBreakdown.map((_, i) => <Cell key={i} fill={revenueBreakdown[i].color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Amount']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-12 text-center">No revenue data for this period</p>
                  )}
                </CardContent>
              </Card>

              {analyticsData && analyticsData.chartData.length > 0 && (
                <Card className="overflow-hidden border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">Visits & revenue</CardTitle>
                        <CardDescription>Over the selected range</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                          <Button key={p} size="sm" variant={chartPeriod === p ? 'default' : 'outline'} onClick={() => handlePeriodChange(p)} className="rounded-lg">
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[min(18rem,50vw)] min-h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.chartData.map((d) => ({ ...d, name: d.date }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number, name: string) => (name === 'revenue' ? [`₹${v.toLocaleString()}`, 'Revenue'] : [v, 'Visits'])} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="visits" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} name="Visits" />
                          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {medicineSalesData && medicineSalesData.length > 0 && (
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Medicine sales</CardTitle>
                  <CardDescription>Top items — {dateRangeLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[min(18rem,50vw)] min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={medicineSalesData.slice(0, 8).map((m) => ({ name: m.medicineName.length > 15 ? m.medicineName.slice(0, 15) + '…' : m.medicineName, fullName: m.medicineName, ...m }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{payload[0].payload.fullName}</p>
                            <p className="text-sm text-muted-foreground">₹{payload[0].payload.total?.toLocaleString()} ({payload[0].payload.quantity} units)</p>
                          </div>
                        ) : null} />
                        <Bar dataKey="total" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {clinicData.lowStockAlerts.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Medicines below minimum stock level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {clinicData.lowStockAlerts.map((a, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg bg-white dark:bg-muted/50 px-4 py-2.5 text-sm">
                        <span>{a.medicineName}</span>
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          {a.currentStock} of {a.minStockLevel} min
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeader title="Dashboard" description="Loading or no data available" />
      <FilterBar
        chartPeriod={chartPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPeriodChange={handlePeriodChange}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={handleApply}
        loading={false}
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No dashboard data to display. Try refreshing the page.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

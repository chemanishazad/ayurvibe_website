import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { getAuthUser } from '@/pages/Login';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DashboardPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const outletContext = useOutletContext<{ filterClinicId?: string }>();
  const filterClinicId = outletContext?.filterClinicId ?? '__all__';
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [adminData, setAdminData] = useState<Awaited<ReturnType<typeof api.dashboard.admin>> | null>(null);
  const [clinicData, setClinicData] = useState<Awaited<ReturnType<typeof api.dashboard.clinic>> | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Awaited<ReturnType<typeof api.dashboard.analytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin) {
          const [admin, analytics] = await Promise.all([
            api.dashboard.admin(),
            api.dashboard.analytics({ clinicId: filterClinicId !== '__all__' ? filterClinicId : undefined, period: chartPeriod }),
          ]);
          setAdminData(admin);
          setAnalyticsData(analytics);
        } else {
          const clinicId = user?.clinicId || (filterClinicId !== '__all__' ? filterClinicId : undefined);
          const [clinic, analytics] = await Promise.all([
            api.dashboard.clinic(clinicId),
            api.dashboard.analytics({ clinicId, period: chartPeriod }),
          ]);
          setClinicData(clinic);
          setAnalyticsData(analytics);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, filterClinicId, user?.clinicId, chartPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isAdmin && adminData) {
    const chartData = adminData.clinicWiseRevenue.map((r) => ({
      name: r.clinicName,
      revenue: r.revenue,
    }));

    return (
      <div className="space-y-8">
        <PageHeader title="Admin Dashboard" description="Global overview of all clinics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clinics</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.totalClinics}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.totalPatients}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Consultations</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData.dailyConsultations}</div>
              {adminData.newPatientRegistrationsToday != null && (
                <p className="text-xs text-muted-foreground mt-1">New registrations today: {adminData.newPatientRegistrationsToday}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Medicine Sales</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{adminData.medicineSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{adminData.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{adminData.totalProfit.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Clinic-wise Revenue</CardTitle>
            <CardDescription>Revenue distribution across clinics</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
        {analyticsData && analyticsData.chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Visits</CardTitle>
                  <CardDescription>Daily / weekly / monthly visit trends</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                    <Button key={p} size="sm" variant={chartPeriod === p ? 'default' : 'outline'} onClick={() => setChartPeriod(p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.chartData.map((d) => ({ ...d, name: d.date }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => [v, 'Visits']} />
                    <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="visits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (clinicData) {
    return (
      <div className="space-y-8">
        <PageHeader title="Clinic Dashboard" description="Today's overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinicData.todayPatients}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Consultations</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinicData.consultationsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Medicine Sales</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{clinicData.medicineSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{clinicData.dailyRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        {analyticsData && analyticsData.chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Visits</CardTitle>
                  <CardDescription>Visit trends</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                    <Button key={p} size="sm" variant={chartPeriod === p ? 'default' : 'outline'} onClick={() => setChartPeriod(p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.chartData.map((d) => ({ ...d, name: d.date }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => [v, 'Visits']} />
                    <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {clinicData.lowStockAlerts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Medicines below minimum stock level</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {clinicData.lowStockAlerts.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                    <span>{a.medicineName}</span>
                    <span className="font-medium text-amber-700">
                      {a.currentStock} of {a.minStockLevel} min
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Loading or no data available" />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No dashboard data to display. Try refreshing the page.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

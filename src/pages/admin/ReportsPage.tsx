import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';

const ReportsPage = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const { effectiveClinicId } = useAdminClinic();
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyCons, setDailyCons] = useState<{ date: string; count: number; revenue: number }[]>([]);
  const [medicineSales, setMedicineSales] = useState<{ medicineName: string; quantity: number; total: number }[]>([]);
  const [clinicRevenue, setClinicRevenue] = useState<{ clinicId: string; clinicName: string; revenue: number; consultations: number }[]>([]);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [lowStock, setLowStock] = useState<Record<string, unknown>[]>([]);
  const [profit, setProfit] = useState<{ dailyProfit: number; monthlyProfit: number; clinicProfit: { clinicId: string; clinicName: string; profit: number }[] } | null>(null);

  const targetClinicId = effectiveClinicId ?? undefined;

  const loadReports = () => {
    const params = { clinicId: targetClinicId || undefined, from, to };
    api.reports.dailyConsultations(params).then(setDailyCons).catch(() => setDailyCons([]));
    api.reports.medicineSales(params).then(setMedicineSales).catch(() => setMedicineSales([]));
    api.reports.clinicRevenue({ from, to }).then(setClinicRevenue).catch(() => setClinicRevenue([]));
    api.reports.inventory(targetClinicId || undefined).then(setInventory).catch(() => setInventory([]));
    api.reports.lowStock(targetClinicId || undefined).then(setLowStock).catch(() => setLowStock([]));
    if (isAdmin) {
      api.reports.profit().then(setProfit).catch(() => setProfit(null));
    }
  };

  useEffect(() => {
    loadReports();
  }, [targetClinicId, from, to]);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Analytics and reports">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 items-center">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="flex gap-2 items-center">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" onClick={loadReports}>Refresh</Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Consultations</TabsTrigger>
          <TabsTrigger value="medicine">Medicine Sales</TabsTrigger>
          <TabsTrigger value="revenue">Clinic Revenue</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
          {isAdmin && <TabsTrigger value="profit">Profit (Admin)</TabsTrigger>}
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Consultation Report</CardTitle>
              <CardDescription>Consultations and revenue by date</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyCons.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyCons.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Consultations" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicine" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Sales Report</CardTitle>
              <CardDescription>Quantity and revenue by medicine</CardDescription>
            </CardHeader>
            <CardContent>
              {medicineSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Medicine</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicineSales.map((m, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">{m.medicineName}</td>
                          <td className="py-2 text-right">{m.quantity}</td>
                          <td className="py-2 text-right">₹{m.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Revenue Report</CardTitle>
              <CardDescription>Revenue and consultations by clinic</CardDescription>
            </CardHeader>
            <CardContent>
              {clinicRevenue.length > 0 ? (
                <>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clinicRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="clinicName" />
                        <YAxis />
                        <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Clinic</th>
                        <th className="text-right py-2">Consultations</th>
                        <th className="text-right py-2">Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicRevenue.map((r) => (
                        <tr key={r.clinicId} className="border-b">
                          <td className="py-2">{r.clinicName}</td>
                          <td className="py-2 text-right">{r.consultations}</td>
                          <td className="py-2 text-right">₹{r.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>Current stock by clinic and medicine</CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Clinic</th>
                        <th className="text-left py-2">Medicine</th>
                        <th className="text-right py-2">Stock</th>
                        <th className="text-right py-2">Min</th>
                        <th className="text-right py-2">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((inv, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">{(inv as { clinicName: string }).clinicName}</td>
                          <td className="py-2">{(inv as { medicineName: string }).medicineName}</td>
                          <td className="py-2 text-right">{(inv as { currentStock: number }).currentStock}</td>
                          <td className="py-2 text-right">{(inv as { minStockLevel: number }).minStockLevel}</td>
                          <td className="py-2 text-right">₹{(inv as { sellingPrice: string }).sellingPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowstock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Report</CardTitle>
              <CardDescription>Medicines below minimum level</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Clinic</th>
                        <th className="text-left py-2">Medicine</th>
                        <th className="text-right py-2">Current</th>
                        <th className="text-right py-2">Min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((l, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">{(l as { clinicName: string }).clinicName}</td>
                          <td className="py-2">{(l as { medicineName: string }).medicineName}</td>
                          <td className="py-2 text-right text-amber-600">{(l as { currentStock: number }).currentStock}</td>
                          <td className="py-2 text-right">{(l as { minStockLevel: number }).minStockLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No low stock items</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="profit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit Report (Admin Only)</CardTitle>
                <CardDescription>Profit = (Selling - Purchase) × Quantity</CardDescription>
              </CardHeader>
              <CardContent>
                {profit ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Daily Profit</p>
                        <p className="text-2xl font-bold text-green-600">₹{profit.dailyProfit.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Monthly Profit</p>
                        <p className="text-2xl font-bold text-green-600">₹{profit.monthlyProfit.toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Clinic-wise Profit</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={profit.clinicProfit}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="clinicName" />
                            <YAxis />
                            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Profit']} />
                            <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No profit data</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ReportsPage;

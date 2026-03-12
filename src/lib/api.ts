const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    switchClinic: (clinicId: string) =>
      fetchApi<{ token: string; user: { id: string; username: string; role: string; clinicId: string } }>('/api/auth/switch-clinic', {
        method: 'POST',
        body: JSON.stringify({ clinicId }),
      }),
  },
  clinics: {
    list: () => fetchApi<{ id: string; name: string }[]>('/api/clinics'),
    create: (name: string) => fetchApi<{ id: string; name: string }>('/api/clinics', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  patients: {
    search: (mobile: string) => fetchApi<{ exists: boolean; patient: Record<string, unknown> | null }>(`/api/patients?mobile=${encodeURIComponent(mobile)}`),
    list: (params?: { name?: string; mobile?: string; search?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams({ list: '1', ...(params as Record<string, string>) });
      return fetchApi<Array<Record<string, unknown> & { isReturning?: boolean; consultationCount?: number }>>(`/api/patients?${q}`);
    },
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/patients/${id}`),
    history: (id: string) => fetchApi<Record<string, unknown>[]>(`/api/patients/${id}/history`),
  },
  doctors: {
    list: () => fetchApi<{ id: string; name: string }[]>('/api/doctors'),
    create: (name: string) => fetchApi<{ id: string; name: string }>('/api/doctors', { method: 'POST', body: JSON.stringify({ name }) }),
  },
  medicines: {
    list: () => fetchApi<{ id: string; name: string; uom: string; purchasePrice: string; sellingPrice: string; minStockLevel: number }[]>('/api/medicines'),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/medicines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchApi<Record<string, unknown>>(`/api/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  inventory: {
    list: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/inventory${clinicId ? `?clinicId=${clinicId}` : ''}`),
    lowStock: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/inventory/low-stock${clinicId ? `?clinicId=${clinicId}` : ''}`),
    update: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
  },
  consultations: {
    list: (params?: { clinicId?: string; patientId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/consultations${q ? `?${q}` : ''}`);
    },
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/consultations/${id}`),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/consultations', { method: 'POST', body: JSON.stringify(data) }),
  },
  directSales: {
    list: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/direct-sales${q ? `?${q}` : ''}`);
    },
    create: (data: { clinicId: string; saleDate: string; items: Array<{ inventoryId: string; medicineId: string; quantity: number; unitPrice: number }> }) =>
      fetchApi<Record<string, unknown>>('/api/direct-sales', { method: 'POST', body: JSON.stringify(data) }),
  },
  treatmentPlans: {
    list: (consultationId?: string) => fetchApi<Record<string, unknown>[]>(`/api/treatment-plans${consultationId ? `?consultationId=${consultationId}` : ''}`),
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/treatment-plans/${id}`),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/treatment-plans', { method: 'POST', body: JSON.stringify(data) }),
  },
  dashboard: {
    admin: () => fetchApi<{
      totalClinics: number;
      totalPatients: number;
      dailyConsultations: number;
      newPatientRegistrationsToday?: number;
      medicineSales: number;
      totalRevenue: number;
      totalProfit: number;
      dailyRevenue: number;
      clinicWiseRevenue: { clinicId: string; clinicName: string; revenue: number }[];
    }>('/api/dashboard/admin'),
    analytics: (params?: { clinicId?: string; period?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<{ period: string; chartData: { date: string; visits: number; revenue: number }[] }>(`/api/dashboard/analytics${q ? `?${q}` : ''}`);
    },
    clinic: (clinicId?: string) => fetchApi<{
      todayPatients: number;
      consultationsCount: number;
      medicineSales: number;
      dailyRevenue: number;
      lowStockAlerts: { medicineName: string; currentStock: number; minStockLevel: number; message: string }[];
    }>(`/api/dashboard/clinic${clinicId ? `?clinicId=${clinicId}` : ''}`),
  },
  reports: {
    dailyConsultations: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<{ date: string; count: number; revenue: number }[]>(`/api/reports/daily-consultations${q ? `?${q}` : ''}`);
    },
    medicineSales: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<{ medicineName: string; quantity: number; total: number }[]>(`/api/reports/medicine-sales${q ? `?${q}` : ''}`);
    },
    clinicRevenue: (params?: { from?: string; to?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<{ clinicId: string; clinicName: string; revenue: number; consultations: number }[]>(`/api/reports/clinic-revenue${q ? `?${q}` : ''}`);
    },
    inventory: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/reports/inventory${clinicId ? `?clinicId=${clinicId}` : ''}`),
    lowStock: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/reports/low-stock${clinicId ? `?clinicId=${clinicId}` : ''}`),
    profit: () => fetchApi<{ dailyProfit: number; monthlyProfit: number; clinicProfit: { clinicId: string; clinicName: string; profit: number }[] }>('/api/reports/profit'),
  },
};

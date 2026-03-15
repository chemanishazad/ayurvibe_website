const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
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
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams({ list: '1', ...p } as Record<string, string>).toString();
      return fetchApi<Array<Record<string, unknown> & { isReturning?: boolean; consultationCount?: number }>>(`/api/patients?${q}`);
    },
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/patients/${id}`),
    update: (id: string, data: Record<string, unknown>) => fetchApi<Record<string, unknown>>(`/api/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/medicines/${id}`, { method: 'DELETE' }),
  },
  suppliers: {
    list: () => fetchApi<{ id: string; name: string; contact?: string; address?: string }[]>('/api/suppliers'),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchApi<Record<string, unknown>>(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/suppliers/${id}`, { method: 'DELETE' }),
  },
  purchases: {
    create: (data: { clinicId: string; medicineId: string; supplierId: string; quantity: number; unitPurchasePrice: number | string; sellingPrice?: number | string; purchaseDate?: string; expiryDate?: string }) =>
      fetchApi<Record<string, unknown>>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    list: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/inventory${clinicId ? `?clinicId=${clinicId}` : ''}`),
    lowStock: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/inventory/low-stock${clinicId ? `?clinicId=${clinicId}` : ''}`),
    update: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
  },
  consultations: {
    list: (params?: { clinicId?: string; patientId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/consultations${q ? `?${q}` : ''}`);
    },
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/consultations/${id}`),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/consultations', { method: 'POST', body: JSON.stringify(data) }),
    addPharmacy: (id: string, payload: {
      items: Array<{ inventoryId: string; medicineId: string; quantity: number; unitPrice?: number }>;
      consultationFee?: number;
      treatments?: Array<{ name: string; price: number }>;
    }) =>
      fetchApi<Record<string, unknown>>(`/api/consultations/${id}/pharmacy`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  directSales: {
    list: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
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
    admin: (params?: { from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<{
      totalClinics: number;
      totalPatients: number;
      dailyConsultations: number;
      newPatientRegistrationsToday?: number;
      medicineSales: number;
      totalRevenue: number;
      totalProfit: number;
      dailyRevenue: number;
      consultationAmount: number;
      prescriptionMedicineSales: number;
      directMedicineSales: number;
      dailyConsultationAmount: number;
      dailyPrescriptionMedicine: number;
      dailyDirectMedicine: number;
      clinicWiseRevenue: { clinicId: string; clinicName: string; revenue: number }[];
    }>(`/api/dashboard/admin${q ? `?${q}` : ''}`);
    },
    analytics: (params?: { clinicId?: string; period?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<{ period: string; chartData: { date: string; visits: number; revenue: number }[] }>(`/api/dashboard/analytics${q ? `?${q}` : ''}`);
    },
    clinic: (clinicId?: string, params?: { from?: string; to?: string }) => {
      const p: Record<string, string> = {};
      if (clinicId) p.clinicId = clinicId;
      if (params?.from) p.from = params.from;
      if (params?.to) p.to = params.to;
      const q = new URLSearchParams(p).toString();
      return fetchApi<{
      todayPatients: number;
      consultationsCount: number;
      medicineSales: number;
      dailyRevenue: number;
      consultationAmount: number;
      prescriptionMedicineSales: number;
      directMedicineSales: number;
      lowStockAlerts: { medicineName: string; currentStock: number; minStockLevel: number; message: string }[];
    }>(`/api/dashboard/clinic${q ? `?${q}` : ''}`);
    },
  },
  reports: {
    dailyConsultations: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<{ date: string; count: number; revenue: number }[]>(`/api/reports/daily-consultations${q ? `?${q}` : ''}`);
    },
    medicineSales: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<{ medicineName: string; quantity: number; total: number }[]>(`/api/reports/medicine-sales${q ? `?${q}` : ''}`);
    },
    clinicRevenue: (params?: { from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<{ clinicId: string; clinicName: string; revenue: number; consultations: number }[]>(`/api/reports/clinic-revenue${q ? `?${q}` : ''}`);
    },
    inventory: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/reports/inventory${clinicId ? `?clinicId=${clinicId}` : ''}`),
    lowStock: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/reports/low-stock${clinicId ? `?clinicId=${clinicId}` : ''}`),
    profit: () => fetchApi<{ dailyProfit: number; monthlyProfit: number; clinicProfit: { clinicId: string; clinicName: string; profit: number }[] }>('/api/reports/profit'),
  },
};

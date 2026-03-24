const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function getToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

function clearSessionAndRedirectToLogin(): void {
  try {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  } catch {
    // ignore storage errors
  }
  // Force a clean auth state by reloading the login route.
  if (window.location.pathname !== '/admin') {
    window.location.assign('/admin');
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
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
  if (!res.ok) {
    const message = (data?.error as string | undefined) || res.statusText || 'Request failed';
    const code = (data?.code as string | undefined) || undefined;

    // Only 401 means the session token is invalid. Do not logout on generic 403
    // (e.g. WhatsApp or feature flags) — that was logging users out in the admin tab.
    if (res.status === 401) {
      clearSessionAndRedirectToLogin();
    }

    throw new ApiError(message, res.status, code);
  }
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
  uom: {
    list: () => fetchApi<{ id: string; code: string; name: string }[]>('/api/uom'),
    listAll: () =>
      fetchApi<{ id: string; code: string; name: string; sortOrder: number; isActive: boolean }[]>('/api/uom/all'),
    create: (data: { code: string; name: string; sortOrder?: number; isActive?: boolean }) =>
      fetchApi<Record<string, unknown>>('/api/uom', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ code: string; name: string; sortOrder: number; isActive: boolean }>) =>
      fetchApi<Record<string, unknown>>(`/api/uom/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/uom/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: () => fetchApi<{ id: string; username: string; role: string; createdAt: string }[]>('/api/users'),
    create: (data: { username: string; password: string; role: 'admin' | 'user'; clinicIds?: string[] }) =>
      fetchApi<{ id: string; username: string; role: string }>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ username: string; role: 'admin' | 'user' }>) =>
      fetchApi<{ id: string; username: string; role: string }>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),
    setPassword: (id: string, password: string) =>
      fetchApi<{ success: boolean }>(`/api/users/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) }),
    listClinics: (userId: string) =>
      fetchApi<{ id: string; name: string; mappingId: string }[]>(`/api/users/${userId}/clinics`),
    addClinic: (userId: string, clinicId: string) =>
      fetchApi<Record<string, unknown>>(`/api/users/${userId}/clinics`, { method: 'POST', body: JSON.stringify({ clinicId }) }),
    removeClinic: (userId: string, clinicId: string) =>
      fetchApi<{ success: boolean }>(`/api/users/${userId}/clinics/${clinicId}`, { method: 'DELETE' }),
  },
  clinics: {
    list: () => fetchApi<{ id: string; name: string }[]>('/api/clinics'),
    create: (name: string) => fetchApi<{ id: string; name: string }>('/api/clinics', { method: 'POST', body: JSON.stringify({ name }) }),
    update: (id: string, data: { name: string }) =>
      fetchApi<{ id: string; name: string }>(`/api/clinics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/clinics/${id}`, { method: 'DELETE' }),
  },
  patients: {
    search: (mobile: string) => fetchApi<{ exists: boolean; patient: Record<string, unknown> | null }>(`/api/patients?mobile=${encodeURIComponent(mobile)}`),
    list: (params?: {
      name?: string;
      mobile?: string;
      search?: string;
      from?: string;
      to?: string;
      /** Admin: scope last-visit / counts to this clinic */
      clinicId?: string;
    }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams({ list: '1', ...p } as Record<string, string>).toString();
      return fetchApi<
        Array<
          Record<string, unknown> & {
            isReturning?: boolean;
            consultationCount?: number;
            lastConsultationId?: string | null;
            lastConsultationDate?: string | null;
          }
        >
      >(`/api/patients?${q}`);
    },
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/patients/${id}`),
    update: (id: string, data: Record<string, unknown>) => fetchApi<Record<string, unknown>>(`/api/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    history: (id: string) => fetchApi<Record<string, unknown>[]>(`/api/patients/${id}/history`),
  },
  doctors: {
    list: (params?: { clinicId?: string }) => {
      const q = params?.clinicId ? `?clinicId=${params.clinicId}` : '';
      return fetchApi<{ id: string; name: string; clinicIds?: string[] }[]>(`/api/doctors${q}`);
    },
    create: (data: { name: string; clinicIds?: string[] }) =>
      fetchApi<{ id: string; name: string; clinicIds?: string[] }>('/api/doctors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name: string }) =>
      fetchApi<{ id: string; name: string; clinicIds?: string[] }>(`/api/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<{ success: boolean }>(`/api/doctors/${id}`, { method: 'DELETE' }),
    listClinics: (doctorId: string) =>
      fetchApi<{ id: string; name: string; mappingId: string }[]>(`/api/doctors/${doctorId}/clinics`),
    addClinic: (doctorId: string, clinicId: string) =>
      fetchApi<Record<string, unknown>>(`/api/doctors/${doctorId}/clinics`, {
        method: 'POST',
        body: JSON.stringify({ clinicId }),
      }),
    removeClinic: (doctorId: string, clinicId: string) =>
      fetchApi<{ success: boolean }>(`/api/doctors/${doctorId}/clinics/${clinicId}`, { method: 'DELETE' }),
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
    create: (data: {
      clinicId: string;
      medicineId: string;
      supplierId: string;
      quantity: number;
      unitPurchasePrice: number | string;
      sellingPrice?: number | string;
      purchaseDate?: string;
      expiryDate?: string;
      batchNumber?: string;
    }) => fetchApi<Record<string, unknown>>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    list: (clinicId?: string) => fetchApi<Record<string, unknown>[]>(`/api/inventory${clinicId ? `?clinicId=${clinicId}` : ''}`),
    batches: (clinicId: string) =>
      fetchApi<
        Array<{
          id: string;
          inventoryId: string;
          medicineId: string;
          medicineName: string;
          uom: string;
          supplierName: string;
          remainingQuantity: number;
          batchNumber: string | null;
          expiryDate: string | null;
          effectiveSellingPrice: string;
        }>
      >(`/api/inventory/batches?clinicId=${encodeURIComponent(clinicId)}`),
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
      items: Array<{
        inventoryId: string;
        medicineId: string;
        quantity: number;
        unitPrice?: number;
        inventoryBatchId?: string | null;
      }>;
      consultationFee?: number;
      treatments?: Array<{ name: string; price: number }>;
    }) =>
      fetchApi<Record<string, unknown>>(`/api/consultations/${id}/pharmacy`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  pharmacyRecords: {
    /** Walk-in direct sales + consultation pharmacy line items (unified ledger). */
    list: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<
        Record<string, unknown> & {
          saleKind?: 'direct' | 'consultation' | 'own';
          consultationId?: string | null;
        }[]
      >(`/api/pharmacy-records${q ? `?${q}` : ''}`);
    },
  },
  directSales: {
    list: (params?: { clinicId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/direct-sales${q ? `?${q}` : ''}`);
    },
    create: (data: {
      clinicId: string;
      saleDate: string;
      salePurpose?: 'direct' | 'own';
      customerName?: string;
      customerMobile?: string;
      items: Array<{
        inventoryId: string;
        medicineId: string;
        quantity: number;
        unitPrice: number;
        inventoryBatchId?: string | null;
      }>;
      discount?: number;
    }) => fetchApi<Record<string, unknown>>('/api/direct-sales', { method: 'POST', body: JSON.stringify(data) }),
  },
  whatsapp: {
    sendBill: (data: {
      mobile: string;
      countryCode?: string;
      billData: {
        customerName: string;
        medicines: Array<{ medicineName: string; quantity: number; unitPrice: string; total: string }>;
        consultationFee?: number;
        treatments?: Array<{ name: string; price: string }>;
        medicineTotal: string;
        treatmentTotal: string;
        grandTotal: string;
        paymentMode?: string;
        date?: string;
        clinicName?: string;
      };
    }) =>
      fetchApi<{ success: boolean; sent?: boolean; error?: string }>('/api/whatsapp/send-bill', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
  followUps: {
    upcoming: (params?: { clinicId?: string; fromDate?: string; toDate?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<
        {
          id: string;
          date: string;
          time?: string;
          patientName: string;
          patientMobile?: string;
          clinicName?: string;
          doctorName?: string;
          notes?: string;
        }[]
      >(`/api/follow-ups/upcoming${q ? `?${q}` : ''}`);
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

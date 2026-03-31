const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const GET_REQUEST_TTL_MS = 4000;

type RequestCacheEntry = {
  expiresAt: number;
  data: unknown;
};

const inFlightGetRequests = new Map<string, Promise<unknown>>();
const recentGetResponses = new Map<string, RequestCacheEntry>();

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

function cloneResponseData<T>(data: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data)) as T;
}

function makeRequestKey(path: string, method: string, token: string | null, body?: BodyInit | null): string {
  let bodyKey = '';
  if (typeof body === 'string') bodyKey = body;
  return `${method}|${path}|${token ?? ''}|${bodyKey}`;
}

function clearStaleGetCache(): void {
  const now = Date.now();
  for (const [key, entry] of recentGetResponses.entries()) {
    if (entry.expiresAt <= now) {
      recentGetResponses.delete(key);
    }
  }
}

async function runRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
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
  // Any successful mutation should invalidate recent GET snapshots.
  if (method !== 'GET') {
    recentGetResponses.clear();
  }
  return data as T;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const token = getToken();
  const requestKey = makeRequestKey(path, method, token, options?.body ?? null);

  if (method !== 'GET') {
    return runRequest<T>(path, options);
  }

  clearStaleGetCache();

  const cached = recentGetResponses.get(requestKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneResponseData(cached.data as T);
  }

  const pending = inFlightGetRequests.get(requestKey);
  if (pending) {
    const shared = await pending;
    return cloneResponseData(shared as T);
  }

  const requestPromise = runRequest<T>(path, options)
    .then((data) => {
      recentGetResponses.set(requestKey, {
        expiresAt: Date.now() + GET_REQUEST_TTL_MS,
        data,
      });
      return data;
    })
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, requestPromise as Promise<unknown>);
  const result = await requestPromise;
  return cloneResponseData(result);
}

export const api = {
  auth: {
    switchClinic: (clinicId: string) =>
      fetchApi<{
        token: string;
        user: {
          id: string;
          username: string;
          role: string;
          clinicId: string;
          allowedNavPaths?: string[] | null;
          linkedDoctorId?: string | null;
        };
      }>('/api/auth/switch-clinic', {
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
    list: () =>
      fetchApi<
        {
          id: string;
          username: string;
          role: string;
          createdAt: string;
          allowedNavPaths?: string[] | null;
          linkedDoctorId?: string | null;
          linkedDoctorName?: string | null;
          clinicAccessNames?: string[];
        }[]
      >('/api/users'),
    create: (data: {
      username: string;
      password: string;
      role: 'admin' | 'doctor' | 'nurse';
      clinicIds?: string[];
      allowedNavPaths?: string[] | null;
      linkedDoctorId?: string | null;
    }) => fetchApi<{ id: string; username: string; role: string; allowedNavPaths?: string[] | null }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (
      id: string,
      data: Partial<{
        username: string;
        role: 'admin' | 'doctor' | 'nurse';
        allowedNavPaths: string[] | null;
        linkedDoctorId: string | null;
      }>,
    ) =>
      fetchApi<{ id: string; username: string; role: string; allowedNavPaths?: string[] | null }>(
        `/api/users/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      ),
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
  /** Nurse OP vitals (patient master); doctors complete via `complete`. */
  opVisits: {
    list: (params?: { clinicId?: string; patientId?: string; from?: string; to?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/op-visits${q ? `?${q}` : ''}`);
    },
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/op-visits/${id}`),
    create: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>('/api/op-visits', { method: 'POST', body: JSON.stringify(data) }),
    complete: (id: string, data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>(`/api/op-visits/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
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
    list: (params?: { clinicId?: string; from?: string; to?: string; grouped?: boolean }) => {
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
    list: (params?: { consultationId?: string; patientId?: string; clinicId?: string; activeOnly?: boolean }) => {
      const p: Record<string, string> = {};
      if (params?.consultationId) p.consultationId = params.consultationId;
      if (params?.patientId) p.patientId = params.patientId;
      if (params?.clinicId) p.clinicId = params.clinicId;
      if (params?.activeOnly) p.activeOnly = '1';
      const q = new URLSearchParams(p).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/treatment-plans${q ? `?${q}` : ''}`);
    },
    get: (id: string) => fetchApi<Record<string, unknown>>(`/api/treatment-plans/${id}`),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/api/treatment-plans', { method: 'POST', body: JSON.stringify(data) }),
  },
  treatmentMasters: {
    list: (params?: { clinicId?: string }) => {
      const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) : {};
      const q = new URLSearchParams(p as Record<string, string>).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/treatment-masters${q ? `?${q}` : ''}`);
    },
    create: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>('/api/treatment-masters', { method: 'POST', body: JSON.stringify(data) }),
  },
  clinicManagement: {
    listTherapists: () =>
      fetchApi<
        Array<{
          id: string;
          name: string;
          gender?: string | null;
          phone?: string | null;
          shiftStart?: string | null;
          shiftEnd?: string | null;
        }>
      >('/api/clinic-management/therapists'),
    listRooms: () =>
      fetchApi<
        Array<{
          id: string;
          roomNumber: string;
          name?: string | null;
          isActive: boolean;
        }>
      >('/api/clinic-management/rooms'),
    createPlan: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>('/api/clinic-management/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listActivePlans: () => fetchApi<Record<string, unknown>[]>('/api/clinic-management/plans/active'),
    updateDayStatus: (id: string, data: { status: 'PENDING' | 'COMPLETED' | 'NO_SHOW'; notes?: string }) =>
      fetchApi<Record<string, unknown>>(`/api/clinic-management/plan-days/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    createAppointment: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>('/api/clinic-management/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateAppointment: (id: string, data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>(`/api/clinic-management/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    therapistAvailability: (params: { from: string; to: string; clinicId?: string }) => {
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) as Record<string, string>,
      ).toString();
      return fetchApi<Record<string, unknown>[]>(`/api/clinic-management/therapist-availability?${q}`);
    },
    recordPayment: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>('/api/clinic-management/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDueAmount: (planId: string) =>
      fetchApi<{
        treatmentPlanId: string;
        patientId: string;
        totalCost: number;
        paidAmount: number;
        balanceDue: number;
        isFinalPaymentPending: boolean;
      }>(`/api/clinic-management/plans/${planId}/due`),
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
      patientCount?: number;
      consultationsCount: number;
      medicineSales: number;
      medicineSalesAmount?: number;
      dailyRevenue: number;
      totalProfit: number;
      consultationAmount: number;
      treatmentCount?: number;
      treatmentAmount?: number;
      treatmentMedicineSalesAmount?: number;
      activeTreatmentPlans?: number;
      treatmentPlanDayCount?: number;
      treatmentPlanWeekCount?: number;
      treatmentPlanMonthCount?: number;
      treatmentPlanLongCount?: number;
      treatmentPlanMedicineCount?: number;
      treatmentPlanMedicineEstimatedAmount?: number;
      treatmentPlanOutstandingCount?: number;
      treatmentPlanOutstandingBalanceDue?: number;
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

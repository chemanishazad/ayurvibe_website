export function savePrintPayload(key: string, payload: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage errors; print page can still attempt live fetch.
  }
}

export function openPrintPath(path: string): void {
  window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
}

export function saveConsultationPrintPayload(id: string, payload: unknown): void {
  savePrintPayload(`print_consult_${id}`, payload);
}

export function savePharmacyPrintPayload(id: string, payload: unknown): void {
  savePrintPayload(`print_pharmacy_${id}`, payload);
}

export function openConsultationPrint(id: string): void {
  openPrintPath(`/print/consultation/${id}`);
}

export function openPharmacyPrint(id: string): void {
  openPrintPath(`/print/pharmacy/${id}`);
}

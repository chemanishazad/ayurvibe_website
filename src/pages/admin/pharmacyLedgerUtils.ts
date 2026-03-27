export const RECORDS_PAGE_SIZE = 10;

export type PharmacyLedgerLine = {
  id: string;
  saleKind: 'direct' | 'consultation' | 'own';
  consultationId?: string | null;
  medicineName: string;
  quantity: number;
  unitPrice: string;
  total: string;
  batchNumber?: string | null;
  expiryDate?: string | null;
  saleDate: string;
  createdAt: string;
  customerName?: string | null;
  customerMobile?: string | null;
  /** Sum of consultation_treatments for this consultation (consultation fee + therapies); counted once per group. */
  consultationTreatmentTotal?: string;
};

export type PharmacySaleGroup = {
  key: string;
  saleKind: 'direct' | 'consultation' | 'own';
  saleDate: string;
  createdAt: string;
  items: PharmacyLedgerLine[];
  total: number;
  customerName?: string;
  customerMobile?: string;
  consultationId?: string | null;
};

export function buildPharmacyGroups(rows: PharmacyLedgerLine[]): PharmacySaleGroup[] {
  const bySale = new Map<string, PharmacySaleGroup>();
  for (const r of rows) {
    const total = parseFloat(String(r.total || '0'));
    const created = (r.createdAt || '').slice(0, 16);
    /** One ledger row per consultation (all pharmacy lines + treatment totals once). */
    const key =
      r.saleKind === 'consultation' && r.consultationId
        ? `c_${r.consultationId}`
        : `${r.saleKind === 'own' ? 'o' : 'd'}_${String(r.saleDate || '').slice(0, 10)}_${created}`;
    const existing = bySale.get(key);
    if (existing) {
      existing.items.push(r);
      existing.total += total;
      const n = (r.customerName || '').trim();
      const m = (r.customerMobile || '').trim();
      if (n && !(existing.customerName || '').trim()) existing.customerName = n;
      if (m && !(existing.customerMobile || '').trim()) existing.customerMobile = m;
      const sd = String(r.saleDate || '').slice(0, 10);
      if (sd > (existing.saleDate || '')) existing.saleDate = sd;
      if ((r.createdAt || '') > (existing.createdAt || '')) existing.createdAt = r.createdAt;
    } else {
      const treatExtra =
        r.saleKind === 'consultation'
          ? Number(String(r.consultationTreatmentTotal ?? '0')) || 0
          : 0;
      bySale.set(key, {
        key,
        saleKind: r.saleKind,
        saleDate: String(r.saleDate || '').slice(0, 10),
        createdAt: r.createdAt || '',
        items: [r],
        total: total + treatExtra,
        customerName: r.customerName ?? undefined,
        customerMobile: r.customerMobile ?? undefined,
        consultationId: r.consultationId,
      });
    }
  }
  const groups = Array.from(bySale.values());
  for (const g of groups) {
    for (const line of g.items) {
      const n = (line.customerName || '').trim();
      const m = (line.customerMobile || '').trim();
      if (n && !(g.customerName || '').trim()) g.customerName = n;
      if (m && !(g.customerMobile || '').trim()) g.customerMobile = m;
    }
    /** Some API rows may lack sale_date; use line timestamp so bill date column is never blank. */
    if (!/^\d{4}-\d{2}-\d{2}$/.test((g.saleDate || '').slice(0, 10)) && g.createdAt) {
      const d = String(g.createdAt).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) g.saleDate = d;
    }
  }
  /** Newest first: bill date, then timestamp (stable vs string localeCompare). */
  return groups.sort((a, b) => {
    const byDate = (b.saleDate || '').localeCompare(a.saleDate || '');
    if (byDate !== 0) return byDate;
    const ta = Date.parse(a.createdAt || '') || 0;
    const tb = Date.parse(b.createdAt || '') || 0;
    return tb - ta;
  });
}

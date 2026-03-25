import { format, isValid, parseISO } from 'date-fns';

/** Display: day-month-year (e.g. 24-03-2026) */
export const APP_DATE_FORMAT = 'dd-MM-yyyy';

/** Display: 12-hour clock with am/pm */
export const APP_TIME_FORMAT = 'hh:mm a';

function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10))) {
    const d = parseISO(s.slice(0, 10) + 'T12:00:00');
    return isValid(d) ? d : null;
  }
  const d = parseISO(s);
  return isValid(d) ? d : null;
}

/** User-facing date (dd-MM-yyyy). */
export function formatAppDate(value: unknown, fallback = '—'): string {
  const d = toDate(value);
  if (!d) return fallback;
  return format(d, APP_DATE_FORMAT);
}

/** User-facing time (12h am/pm). */
export function formatAppTime(value: unknown, fallback = '—'): string {
  const d = toDate(value);
  if (!d) return fallback;
  return format(d, APP_TIME_FORMAT);
}

/** Date + time on one line. */
export function formatAppDateTime(value: unknown, fallback = '—'): string {
  const d = toDate(value);
  if (!d) return fallback;
  return `${format(d, APP_DATE_FORMAT)} ${format(d, APP_TIME_FORMAT)}`;
}

/**
 * Stored consultation / form time is often "HH:mm" (24h). Show as 12h am/pm.
 */
export function formatHhmmToAmPm(hhmm: string | undefined | null, fallback = '—'): string {
  if (hhmm == null || hhmm === '') return fallback;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!m) return String(hhmm);
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (!isValid(d)) return String(hhmm);
  return format(d, APP_TIME_FORMAT);
}

/** API / HTML date-only string (yyyy-MM-dd) → dd-MM-yyyy for labels. */
export function formatIsoDateToApp(isoDate: string | undefined | null): string {
  if (isoDate == null || isoDate === '') return '—';
  const s = isoDate.slice(0, 10);
  return formatAppDate(s + 'T12:00:00');
}

/** Chart axis / tooltip: yyyy-MM-dd → display format. */
export function formatChartDateLabel(label: string | number | undefined): string {
  if (label == null) return '';
  const s = String(label).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(label);
  return formatIsoDateToApp(s);
}

/** Current time string for bills / print (12h). */
export function formatNowAppTime(): string {
  return formatAppTime(new Date());
}

/** Bill / WhatsApp line: API date (yyyy-MM-dd) + optional 12h time label. */
export function formatBillDisplayDateTime(
  isoDate: string | undefined | null,
  timeLabel: string | undefined | null,
): string {
  if (isoDate == null || isoDate === '') return '';
  const d = formatIsoDateToApp(isoDate.slice(0, 10));
  const t = timeLabel?.trim();
  if (t) return `${d} ${t}`;
  return d;
}

/**
 * Pharmacy invoice print: prefer billDate + billTime; if only billDateLabel exists,
 * upgrade legacy labels that start with yyyy-MM-dd to dd-MM-yyyy.
 */
export function formatBillPrintDateTime(
  billDateLabel: string | undefined | null,
  billDate: string | undefined | null,
  billTime: string | undefined | null,
): string {
  if (billDate) {
    return formatBillDisplayDateTime(billDate, billTime);
  }
  const raw = (billDateLabel || '').trim();
  if (!raw) return '';
  const m = /^(\d{4}-\d{2}-\d{2})(\s+.+)?$/.exec(raw);
  if (m) {
    return formatBillDisplayDateTime(m[1], m[2]?.trim() ?? null);
  }
  return raw;
}

/** Print tables: expiry / any API date-only value → dd-MM-yyyy (pass-through if already dd-MM-yyyy). */
export function formatExpiryOrDateLabel(value: unknown): string {
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return formatIsoDateToApp(head);
  if (/^\d{2}-\d{2}-\d{4}$/.test(head)) return head;
  return s;
}

/**
 * Pharmacy bill header: bill fields first; if missing, use consultation date/time (e.g. direct sale prints).
 */
export function formatPharmacyPrintBillDateTime(cons: {
  billDateLabel?: unknown;
  billDate?: unknown;
  billTime?: unknown;
  consultationDate?: unknown;
  consultationTime?: unknown;
}): string {
  const billDateLabel = (cons.billDateLabel as string) || '';
  const billDate = (cons.billDate as string) || '';
  const billTime = (cons.billTime as string) || '';
  const primary = formatBillPrintDateTime(billDateLabel, billDate, billTime);
  if (primary) return primary;
  const cDate = (cons.consultationDate as string) || '';
  if (!cDate) return '';
  const cTime = (cons.consultationTime as string) || '';
  const timeLabel =
    cTime.trim() && /^\d{1,2}:\d{2}$/.test(cTime.trim()) ? formatHhmmToAmPm(cTime) : null;
  return formatBillDisplayDateTime(cDate.slice(0, 10), timeLabel);
}

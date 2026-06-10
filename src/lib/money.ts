/** Money helpers shared across admin pages (payables, inventory, reports). */

/** Parse a string|number money value to a finite number (0 on failure). */
export function toAmount(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

/** Format as Indian-rupee currency, e.g. ₹1,23,456.00. */
export function formatINR(v: string | number | null | undefined, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 2;
  return `₹${toAmount(v).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}`;
}

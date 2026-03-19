/** Display age in patients list / detail (backend stores integer + optional ageUnit). */
export function formatPatientAgeDisplay(age: unknown, ageUnit: unknown): string {
  if (age == null || age === '') return '—';
  const n = Number(age);
  if (!Number.isFinite(n)) return '—';
  const unit = String(ageUnit ?? '').toLowerCase() === 'months' ? 'months' : 'years';
  if (unit === 'months') return `${n} mo`;
  return `${n} y`;
}

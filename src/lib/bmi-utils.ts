/** BMI categories (WHO) - Lean used for Underweight in display */
export type BmiCategory = 'Lean' | 'Normal' | 'Overweight' | 'Obesity';

export function getBmiCategory(bmi: number): { label: BmiCategory; color: string; bgClass: string } {
  if (bmi < 18.5) return { label: 'Lean', color: '#3b82f6', bgClass: 'bg-blue-500' };
  if (bmi < 25) return { label: 'Normal', color: '#22c55e', bgClass: 'bg-emerald-500' };
  if (bmi < 30) return { label: 'Overweight', color: '#f59e0b', bgClass: 'bg-amber-500' };
  return { label: 'Obesity', color: '#ef4444', bgClass: 'bg-red-500' };
}

/** BMI bar range: 15 to 40 kg/m² */
const BMI_MIN = 15;
const BMI_MAX = 40;

export function getBmiBarPosition(bmi: number): number {
  const clamped = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi));
  return ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100;
}

/** Segment boundaries for the bar (Lean | Normal | Overweight | Obesity) */
export const BMI_SEGMENTS = [
  { min: 15, max: 18.5, label: 'Lean', color: 'bg-blue-400' },
  { min: 18.5, max: 25, label: 'Normal', color: 'bg-emerald-500' },
  { min: 25, max: 30, label: 'Overweight', color: 'bg-amber-500' },
  { min: 30, max: 40, label: 'Obesity', color: 'bg-red-500' },
] as const;

export function getBmiSegmentWidth(min: number, max: number): number {
  return ((max - min) / (BMI_MAX - BMI_MIN)) * 100;
}

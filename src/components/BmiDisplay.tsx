import React from 'react';
import { getBmiCategory, getBmiBarPosition, BMI_SEGMENTS, getBmiSegmentWidth } from '@/lib/bmi-utils';
import { cn } from '@/lib/utils';

type BmiDisplayProps = {
  weight: number | null | undefined;
  height: number | null | undefined;
  className?: string;
  /** Compact mode for form grid (smaller bar) */
  compact?: boolean;
  /** Print mode - simpler layout */
  print?: boolean;
};

export function BmiDisplay({ weight, height, className, compact, print }: BmiDisplayProps) {
  const bmi =
    weight != null && weight > 0 && height != null && height > 0
      ? weight / Math.pow(height / 100, 2)
      : null;

  if (bmi == null) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">BMI (kg/m²)</span>
          <span className="text-sm text-muted-foreground">—</span>
        </div>
        {!print && (
          <div className="h-2 w-full rounded-full bg-muted" title="Enter weight and height" />
        )}
      </div>
    );
  }

  const bmiVal = parseFloat(bmi.toFixed(1));
  const { label } = getBmiCategory(bmiVal);
  const position = getBmiBarPosition(bmiVal);

  if (print) {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <span className="text-[10px]">
          <strong>BMI:</strong> {bmiVal} kg/m² <span className="text-gray-600">({label})</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs font-medium text-muted-foreground shrink-0">BMI (kg/m²)</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-sm font-semibold shrink-0', compact && 'text-xs')}>
            {bmiVal} kg/m²
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 whitespace-nowrap',
              label === 'Lean' && 'bg-blue-100 text-blue-700',
              label === 'Normal' && 'bg-emerald-100 text-emerald-700',
              label === 'Overweight' && 'bg-amber-100 text-amber-700',
              label === 'Obesity' && 'bg-red-100 text-red-700'
            )}
          >
            {label}
          </span>
        </div>
      </div>
      {/* BMI bar with segments and marker */}
      <div className="relative w-full">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-muted-foreground/20">
          {BMI_SEGMENTS.map((seg) => (
            <div
              key={seg.label}
              className={cn('opacity-80', seg.color)}
              style={{ width: `${getBmiSegmentWidth(seg.min, seg.max)}%` }}
              title={seg.label}
            />
          ))}
        </div>
        {/* Marker dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 -ml-2 rounded-full border-2 border-white shadow-md bg-foreground"
          style={{ left: `${position}%` }}
          title={`BMI ${bmiVal} - ${label}`}
        />
      </div>
      {!compact && (
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      )}
    </div>
  );
}

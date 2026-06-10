import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'border-border/60 bg-muted text-muted-foreground',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  warning: 'border-amber-200 bg-amber-100 text-amber-700',
  danger: 'border-red-200 bg-red-100 text-red-700',
  info: 'border-sky-200 bg-sky-100 text-sky-700',
};

/** Consistent pill badge for statuses across admin tables. */
export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize', TONE_CLASS[tone], className)}>
      {children}
    </span>
  );
}

export default StatusBadge;

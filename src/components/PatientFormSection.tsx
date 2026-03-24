import React from 'react';
import { cn } from '@/lib/utils';

interface PatientFormSectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Grouped block with icon header for new/edit patient forms. */
export function PatientFormSection({ icon, title, description, children, className }: PatientFormSectionProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border/50 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-transparent px-4 py-3.5 dark:from-emerald-950/35 dark:via-emerald-950/15 dark:to-transparent">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/12 text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-400">
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

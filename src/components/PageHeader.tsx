import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children, className }) => (
  <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children && <div className="mt-4 sm:mt-0">{children}</div>}
  </div>
);

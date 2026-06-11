import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight, consistent admin table. Handles header, loading skeletons, and empty state
 * so every list page looks the same. Purely presentational — pass already-fetched rows.
 */
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Cell renderer. */
  cell: (row: T, index: number) => React.ReactNode;
  /** Text alignment for header + cell. */
  align?: 'left' | 'right' | 'center';
  /** Optional fixed/min width utility class, e.g. 'w-[120px]'. */
  className?: string;
  /** Header-only extra classes. */
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  /** Shown when not loading and rows is empty. */
  emptyMessage?: React.ReactNode;
  /** Highlight / extra classes per row. */
  rowClassName?: (row: T, index: number) => string | undefined;
  onRowClick?: (row: T) => void;
  /** Min width so the horizontal scroll kicks in on small screens. */
  minWidthClassName?: string;
  skeletonRows?: number;
}

const alignClass: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'No records found.',
  rowClassName,
  onRowClick,
  minWidthClassName = 'min-w-[640px]',
  skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className={cn('w-full text-sm', minWidthClassName)}>
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                  alignClass[c.align ?? 'left'],
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className={cn(
                  'border-b transition-colors hover:bg-muted/20',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row, i),
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-top', alignClass[c.align ?? 'left'], c.className)}>
                    {c.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

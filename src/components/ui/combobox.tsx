import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional muted text shown to the right (e.g. unit / category). */
  hint?: string;
  /** Extra text to include in the search match but not display prominently. */
  keywords?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  /** When set, shows a "create" row in the empty/footer area that calls this with the typed query. */
  onCreate?: (query: string) => void;
  createLabel?: (query: string) => string;
}

/**
 * Searchable single-select dropdown built on cmdk + popover.
 * Filters as you type; optional inline "create new" action.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  disabled,
  className,
  triggerClassName,
  onCreate,
  createLabel = (q) => `Add “${q}”`,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selected = options.find((o) => o.value === value);
  const trimmed = query.trim();
  const hasExactMatch = options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            triggerClassName,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
            {selected?.hint ? <span className="ml-1 text-muted-foreground">({selected.hint})</span> : null}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[--radix-popover-trigger-width] p-0', className)}
        align="start"
      >
        <Command
          filter={(itemValue, search, keywords) => {
            const hay = `${itemValue} ${(keywords ?? []).join(' ')}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {/* Empty state has no create action — the persistent footer below handles "create". */}
            <CommandEmpty>{onCreate && trimmed ? null : emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  keywords={opt.keywords ? [opt.keywords] : undefined}
                  onSelect={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.hint ? <span className="ml-2 text-xs text-muted-foreground">{opt.hint}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && trimmed && !hasExactMatch && (
              <div className="border-t p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
                  onClick={() => { onCreate(trimmed); setOpen(false); setQuery(''); }}
                >
                  <Plus className="h-4 w-4" />
                  {createLabel(trimmed)}
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Combobox;

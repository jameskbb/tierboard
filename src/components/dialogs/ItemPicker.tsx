import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ItemThumb } from '@/components/items/ItemChip';
import { cn } from '@/lib/cn';
import type { TierBoard } from '@/models/board';

interface ItemPickerProps {
  board: TierBoard;
  selected: string[];
  onToggle: (id: string) => void;
  multiple?: boolean;
  max?: number;
}

/** Searchable list of the board's items, grouped by tier order. */
export function ItemPicker({ board, selected, onToggle, multiple, max }: ItemPickerProps) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const ordered = [
      ...board.tiers.flatMap((tier) => tier.itemIds.map((id) => ({ id, tier }))),
      ...board.unrankedItemIds.map((id) => ({ id, tier: null })),
    ];
    const q = query.trim().toLowerCase();
    return ordered.filter(({ id }) => !q || board.items[id]?.name.toLowerCase().includes(q));
  }, [board, query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find an item"
          aria-label="Find an item"
          className="h-10 w-full rounded-[10px] bg-black/5 pl-9 text-sm ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent dark:bg-white/5"
        />
      </div>
      <ul
        className="scrollbar-thin max-h-72 space-y-0.5 overflow-y-auto"
        role="listbox"
        aria-multiselectable={multiple}
      >
        {rows.map(({ id, tier }) => {
          const item = board.items[id]!;
          const isSelected = selected.includes(id);
          const disabled = !isSelected && !!max && selected.length >= max;
          return (
            <li key={id} role="option" aria-selected={isSelected}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-sm disabled:opacity-40',
                  isSelected ? 'bg-accent/15' : 'hover:bg-black/5 dark:hover:bg-white/5',
                )}
              >
                {multiple && (
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded-[4px] ring-1 ring-current',
                      isSelected && 'bg-accent text-accent-ink ring-accent',
                    )}
                  >
                    {isSelected && '✓'}
                  </span>
                )}
                <ItemThumb item={item} className="size-6" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {tier ? (
                  <span
                    className="rounded-[5px] px-1.5 font-display text-xs font-bold text-[#1b1e27]"
                    style={{ background: tier.color }}
                  >
                    {tier.name}
                  </span>
                ) : (
                  <span className="text-xs opacity-60">Unranked</span>
                )}
              </button>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-2.5 py-3 text-sm opacity-60">No items match.</li>}
      </ul>
    </div>
  );
}

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Kbd } from '@/components/ui/Kbd';
import { findItemContainer } from '@/features/ranking/boardOps';
import { cn } from '@/lib/cn';
import { UNRANKED_ID, type TierBoard } from '@/models/board';
import { useUiStore } from '@/stores/uiStore';
import { useSearchMatches } from '@/components/board/BoardView';

export const SEARCH_INPUT_ID = 'board-search';

/** Jump to an item: scroll it into view, select it and open its editor. */
export function revealItem(itemId: string) {
  const element = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`);
  element?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  useUiStore.getState().select(itemId);
  setTimeout(() => {
    const { top, left, bottom, right } = element?.getBoundingClientRect() ?? {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
    useUiStore
      .getState()
      .openEditor({ itemId, anchor: element ? { top, left, bottom, right } : null });
  }, 250);
}

/**
 * Instant search: filters/highlights items on the board as you type and lists
 * matches with their current tier.
 */
export function SearchBox({
  board,
  autoFocus,
  onClose,
}: {
  board: TierBoard;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const matches = useSearchMatches(board);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    if (!matches) return [];
    return [...matches].slice(0, 8).map((id) => {
      const container = findItemContainer(board, id);
      const tier = board.tiers.find((t) => t.id === container);
      return { id, name: board.items[id]!.name, tier: container === UNRANKED_ID ? null : tier };
    });
  }, [matches, board]);

  const choose = (id: string) => {
    revealItem(id);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        id={SEARCH_INPUT_ID}
        type="search"
        role="combobox"
        aria-expanded={focused && results.length > 0}
        aria-controls="search-results"
        aria-label="Search items"
        placeholder="Search items"
        autoFocus={autoFocus}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === 'Enter' && results[active]) {
            choose(results[active].id);
          } else if (event.key === 'Escape') {
            event.stopPropagation();
            setSearch('');
            event.currentTarget.blur();
            onClose?.();
          }
        }}
        className="h-9 w-full rounded-[10px] bg-surface pr-8 pl-8 text-sm ring-1 ring-line outline-none ring-inset placeholder:text-muted focus:ring-2 focus:ring-accent md:w-44 md:focus:w-60 md:transition-[width]"
      />
      {search ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setSearch('')}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-muted hover:text-text"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <Kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 md:inline-flex">
          /
        </Kbd>
      )}
      {focused && search && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute top-full right-0 left-0 z-40 mt-1.5 animate-rise overflow-hidden rounded-[12px] bg-surface p-1 shadow-panel md:left-auto md:w-72"
        >
          {results.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-muted">No items match “{search}”</li>
          )}
          {results.map((result, index) => (
            <li key={result.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(result.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-sm',
                  index === active ? 'bg-surface-2' : 'hover:bg-surface-2',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{result.name}</span>
                {result.tier ? (
                  <span
                    className="rounded-[6px] px-1.5 py-0.5 font-display text-xs font-bold text-[#1b1e27]"
                    style={{ background: result.tier.color }}
                  >
                    {result.tier.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted">Unranked</span>
                )}
              </button>
            </li>
          ))}
          {matches && matches.size > results.length && (
            <li className="px-3 py-1.5 text-xs text-muted">
              {matches.size - results.length} more highlighted on the board
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

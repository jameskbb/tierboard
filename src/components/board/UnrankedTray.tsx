import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import {
  ArrowDownAZ,
  Dices,
  ListPlus,
  MoreHorizontal,
  PartyPopper,
  Shuffle,
  Zap,
} from 'lucide-react';
import { memo } from 'react';
import { SortableItem } from '@/components/items/SortableItem';
import { Button, IconButton } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Menu } from '@/components/ui/Menu';
import { actions } from '@/features/ranking/actions';
import { cn } from '@/lib/cn';
import { UNRANKED_ID, type TierBoard } from '@/models/board';
import { useUiStore } from '@/stores/uiStore';

interface UnrankedTrayProps {
  itemIds: string[];
  items: TierBoard['items'];
  compact: boolean;
  matches: Set<string> | null;
  totalItems: number;
  presenting: boolean;
}

export const UnrankedTray = memo(function UnrankedTray({
  itemIds,
  items,
  compact,
  matches,
  totalItems,
  presenting,
}: UnrankedTrayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: UNRANKED_ID,
    data: { type: 'container', containerId: UNRANKED_ID },
  });
  const openDialog = useUiStore((state) => state.openDialog);
  const empty = itemIds.length === 0;

  return (
    <section
      aria-label={`Unranked, ${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`}
      className="rounded-[var(--row-radius)] bg-[var(--tray-bg)] p-[calc(10px*var(--scale))]"
    >
      <header className="flex items-center gap-2 px-1 pb-2">
        <h2 className="font-display text-[calc(15px*var(--scale))] font-bold tracking-tight">
          Unranked
        </h2>
        <span className="rounded-full bg-[var(--item-bg)] px-2 py-0.5 font-mono text-[11px] tabular-nums opacity-80 ring-1 ring-[var(--item-line)] ring-inset">
          {itemIds.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!empty && (
            <>
              <Button
                size="sm"
                variant="ghost"
                icon={<Dices className="size-4" />}
                onClick={() => openDialog('random')}
                className="max-sm:hidden"
              >
                Pick random
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Zap className="size-4" />}
                onClick={() => openDialog('quick-rank')}
                className="max-sm:hidden"
              >
                Quick rank
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={empty && totalItems === 0 ? 'primary' : 'soft'}
            icon={<ListPlus className="size-4" />}
            onClick={() => openDialog('add-items')}
          >
            Add items
          </Button>
          {!presenting && itemIds.length > 1 && (
            <Menu
              items={[
                {
                  label: 'Sort A–Z',
                  icon: <ArrowDownAZ />,
                  onSelect: () => actions.sortContainer(UNRANKED_ID, 'az'),
                },
                {
                  label: 'Shuffle',
                  icon: <Shuffle />,
                  onSelect: () => actions.sortContainer(UNRANKED_ID, 'shuffle'),
                },
              ]}
              trigger={(props) => (
                <IconButton label="Unranked options" size="sm" {...props}>
                  <MoreHorizontal className="size-4" />
                </IconButton>
              )}
            />
          )}
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'scrollbar-thin flex min-h-[calc(58px*var(--scale))] flex-wrap content-start items-start gap-[calc(6px*var(--scale))] rounded-[12px] p-1 transition-colors',
          !presenting && 'max-h-[42dvh] overflow-y-auto',
          isOver && 'bg-accent/[0.07]',
        )}
      >
        <SortableContext id={UNRANKED_ID} items={itemIds} strategy={rectSortingStrategy}>
          {itemIds.map((id) => {
            const item = items[id];
            if (!item) return null;
            return (
              <SortableItem
                key={id}
                item={item}
                containerId={UNRANKED_ID}
                compact={compact}
                dimmed={!!matches && !matches.has(id)}
                highlighted={!!matches && matches.has(id)}
                containerLabel="Unranked"
              />
            );
          })}
        </SortableContext>

        {empty && totalItems === 0 && (
          <button
            type="button"
            onClick={() => openDialog('add-items')}
            className="flex w-full flex-col items-center gap-1 rounded-[12px] px-4 py-6 text-center text-muted outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="font-display text-lg font-bold text-text">What are we ranking?</span>
            <span className="text-sm">
              Paste a list — one per line or comma-separated. Press <Kbd>N</Kbd> anytime.
            </span>
          </button>
        )}
        {empty && totalItems > 0 && (
          <div className="flex w-full items-center justify-center gap-2 py-3 text-sm opacity-70">
            <PartyPopper className="size-4" /> Everything is ranked. Drop items here to unrank them.
          </div>
        )}
      </div>
    </section>
  );
});

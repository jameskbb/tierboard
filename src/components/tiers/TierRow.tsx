import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, SlidersHorizontal } from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { SortableItem } from '@/components/items/SortableItem';
import { rectOf, type Anchor } from '@/components/ui/Popover';
import { tierLabelStyle } from '@/lib/boardThemes';
import { cn } from '@/lib/cn';
import type { RankItem, Tier, TierBoard } from '@/models/board';
import { TierEditor } from './TierEditor';

export interface TierRowProps {
  tier: Tier;
  index: number;
  itemIds: string[];
  items: TierBoard['items'];
  settings: TierBoard['settings'];
  tierCount: number;
  matches: Set<string> | null;
  dragging: boolean;
  presenting: boolean;
}

export const TierRow = memo(function TierRow({
  tier,
  index,
  itemIds,
  items,
  settings,
  tierCount,
  matches,
  dragging,
  presenting,
}: TierRowProps) {
  const sortable = useSortable({ id: `tier:${tier.id}`, data: { type: 'tier', tierId: tier.id } });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: tier.id,
    data: { type: 'container', containerId: tier.id },
  });
  const labelRef = useRef<HTMLButtonElement>(null);
  const [editorAnchor, setEditorAnchor] = useState<Anchor | null | undefined>(undefined);
  const compact = settings.itemSize === 'compact';

  return (
    <section
      ref={sortable.setNodeRef}
      aria-label={`${tier.name} tier, ${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        'tier-row group/tier relative flex min-h-[calc(64px*var(--scale))] items-stretch overflow-hidden rounded-[var(--row-radius)] bg-[var(--row-bg)]',
        sortable.isDragging && 'z-10 opacity-60',
      )}
    >
      <button
        ref={(node) => {
          labelRef.current = node;
          sortable.setActivatorNodeRef(node);
        }}
        type="button"
        {...sortable.attributes}
        {...sortable.listeners}
        aria-roledescription="tier"
        aria-label={`${tier.name} tier. Click to edit, drag to reorder.`}
        onClick={() => setEditorAnchor(rectOf(labelRef.current))}
        style={tierLabelStyle(settings.theme, tier.color)}
        className={cn(
          'tier-label relative flex w-[calc(64px*var(--scale))] shrink-0 cursor-grab touch-manipulation flex-col items-center justify-center gap-0.5 px-1.5 text-center outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset active:cursor-grabbing sm:w-[calc(92px*var(--scale))]',
        )}
      >
        <span
          className={cn(
            'max-w-full leading-[1.05] break-words',
            tier.name.length <= 2
              ? 'text-[calc(26px*var(--scale))] sm:text-[calc(32px*var(--scale))]'
              : tier.name.length <= 6
                ? 'text-[calc(15px*var(--scale))] sm:text-[calc(18px*var(--scale))]'
                : 'text-[calc(12px*var(--scale))] sm:text-[calc(14px*var(--scale))]',
          )}
          data-tier-name
        >
          {tier.name || '—'}
        </span>
        {settings.showCounts && (
          <span className="font-mono text-[calc(11px*var(--scale))] opacity-70">
            {itemIds.length}
          </span>
        )}
        <GripVertical
          aria-hidden
          className="absolute top-1/2 left-0.5 size-3.5 -translate-y-1/2 opacity-0 transition-opacity group-hover/tier:opacity-40"
        />
      </button>

      <div
        ref={setDropRef}
        className={cn(
          'scrollbar-thin flex min-w-0 flex-1 items-center gap-[calc(6px*var(--scale))] p-[calc(8px*var(--scale))] transition-colors',
          // Phones: one scrollable line per tier. Larger screens: wrap.
          'no-scrollbar flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible',
          isOver && 'bg-accent/[0.07]',
          dragging &&
            itemIds.length === 0 &&
            'outline-2 -outline-offset-8 outline-dashed outline-line',
        )}
      >
        <SortableContext id={tier.id} items={itemIds} strategy={rectSortingStrategy}>
          {itemIds.map((id) => {
            const item: RankItem | undefined = items[id];
            if (!item) return null;
            return (
              <SortableItem
                key={id}
                item={item}
                containerId={tier.id}
                compact={compact}
                dimmed={!!matches && !matches.has(id)}
                highlighted={!!matches && matches.has(id)}
                containerLabel={`${tier.name} tier`}
              />
            );
          })}
        </SortableContext>
      </div>

      {!presenting && (
        <button
          type="button"
          aria-label={`Edit ${tier.name} tier`}
          title="Edit tier"
          onClick={() => setEditorAnchor(rectOf(labelRef.current))}
          className="hidden w-9 shrink-0 items-center justify-center text-muted opacity-0 transition-opacity group-focus-within/tier:opacity-100 group-hover/tier:opacity-100 hover:text-text focus-visible:opacity-100 sm:flex [@media(hover:none)]:opacity-60"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      )}

      {editorAnchor !== undefined && (
        <TierEditor
          tier={tier}
          index={index}
          tierCount={tierCount}
          anchor={editorAnchor}
          onClose={() => setEditorAnchor(undefined)}
        />
      )}
    </section>
  );
});

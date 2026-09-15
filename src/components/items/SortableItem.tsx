import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useEffect, useRef, type KeyboardEvent } from 'react';
import { rectOf } from '@/components/ui/Popover';
import type { ContainerId, RankItem } from '@/models/board';
import { useUiStore } from '@/stores/uiStore';
import { ItemChip } from './ItemChip';

interface SortableItemProps {
  item: RankItem;
  containerId: ContainerId;
  compact: boolean;
  dimmed: boolean;
  highlighted: boolean;
  containerLabel: string;
}

const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SortableItem = memo(function SortableItem({
  item,
  containerId,
  compact,
  dimmed,
  highlighted,
  containerLabel,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', containerId },
  });
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = useUiStore((state) => state.selectedItemId === item.id);
  const dropAt = useUiStore((state) =>
    state.lastDrop?.itemId === item.id ? state.lastDrop.at : 0,
  );
  const glowUp = useUiStore(
    (state) => state.celebration?.kind === 'glow-up' && state.celebration.itemId === item.id,
  );

  // Subtle "landed" pop. Animates `scale` so it never fights dnd-kit's transform.
  useEffect(() => {
    if (!dropAt || REDUCED_MOTION || !ref.current) return;
    ref.current.animate([{ scale: '0.9' }, { scale: '1.05' }, { scale: '1' }], {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)',
    });
  }, [dropAt]);

  useEffect(() => {
    if (!glowUp || REDUCED_MOTION || !ref.current) return;
    ref.current.animate(
      [
        { boxShadow: '0 0 0 0 rgba(255, 196, 70, 0.95)' },
        { boxShadow: '0 0 0 12px rgba(255, 196, 70, 0.3)', offset: 0.4 },
        { boxShadow: '0 0 0 22px rgba(255, 196, 70, 0)' },
      ],
      { duration: 1300, iterations: 2, easing: 'ease-out' },
    );
  }, [glowUp]);

  const openEditor = () => {
    useUiStore.getState().openEditor({ itemId: item.id, anchor: rectOf(ref.current) });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      openEditor();
    }
  };

  return (
    <ItemChip
      ref={(node) => {
        setNodeRef(node);
        ref.current = node;
      }}
      item={item}
      compact={compact}
      dimmed={dimmed}
      highlighted={highlighted}
      selected={selected}
      placeholder={isDragging}
      data-item-id={item.id}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: 'manipulation',
      }}
      className="cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
      {...attributes}
      {...listeners}
      aria-roledescription="rankable item"
      aria-label={`${item.name}${item.hotTake ? ', hot take' : ''}, in ${containerLabel}. Press Enter to edit, space to drag, or a number key to rank.`}
      onKeyDown={onKeyDown}
      onFocus={() => useUiStore.getState().select(item.id)}
      onClick={openEditor}
    />
  );
});

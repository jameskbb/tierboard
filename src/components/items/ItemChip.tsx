import { memo, useState, type CSSProperties, type HTMLAttributes, type Ref } from 'react';
import { useImageSrc } from '@/hooks/useImageSrc';
import { cn } from '@/lib/cn';
import type { RankItem } from '@/models/board';

export interface ItemChipProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  item: RankItem;
  compact?: boolean;
  dimmed?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  /** Rendered in the DragOverlay: lifted and tilted. */
  lifted?: boolean;
  /** The ghost left behind while dragging. */
  placeholder?: boolean;
}

function initials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || name.slice(0, 2);
}

export function ItemThumb({ item, className }: { item: RankItem; className?: string }) {
  const src = useImageSrc(item.image);
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = src && failed !== src;
  if (showImage) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        loading="lazy"
        onError={() => setFailed(src)}
        className={cn('shrink-0 rounded-[7px] bg-sunken object-cover', className)}
      />
    );
  }
  if (item.emoji) {
    return (
      <span
        aria-hidden
        className={cn('flex shrink-0 items-center justify-center leading-none', className)}
      >
        <span className="text-[1.35em]">{item.emoji}</span>
      </span>
    );
  }
  if (item.image) {
    // Broken or missing image: fall back to initials rather than a broken icon.
    return (
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center rounded-[7px] bg-sunken font-display text-[0.7em] font-bold text-muted',
          className,
        )}
      >
        {initials(item.name)}
      </span>
    );
  }
  return null;
}

/** Visual representation of an item. Pure presentation; no drag logic. */
export const ItemChip = memo(function ItemChip({
  item,
  compact,
  dimmed,
  highlighted,
  selected,
  lifted,
  placeholder,
  className,
  style,
  ...props
}: ItemChipProps) {
  const hasVisual = !!(item.image || item.emoji);
  return (
    <div
      {...props}
      style={{
        ...(item.accent ? ({ '--accent-item': item.accent } as CSSProperties) : {}),
        ...style,
      }}
      className={cn(
        'group/item relative flex max-w-[15rem] items-center gap-2 rounded-[var(--item-radius)] bg-[var(--item-bg)] text-[var(--item-text)] shadow-[var(--item-shadow)] ring-1 ring-[var(--item-line)] ring-inset select-none [-webkit-touch-callout:none]',
        compact
          ? 'min-h-[calc(34px*var(--scale))] px-2 py-1 text-[calc(13px*var(--scale))]'
          : 'min-h-[calc(44px*var(--scale))] px-2.5 py-1.5 text-[calc(14px*var(--scale))]',
        hasVisual && (compact ? 'pl-1.5' : 'pl-1.5'),
        item.accent && 'shadow-[inset_3px_0_0_var(--accent-item)]',
        dimmed && 'opacity-25 saturate-50',
        highlighted && 'ring-2 ring-accent',
        selected && 'ring-2 ring-accent',
        lifted && 'rotate-[-2.5deg] scale-[1.05] cursor-grabbing shadow-lift ring-accent/40',
        placeholder && 'opacity-30',
        !lifted && 'transition-[opacity,box-shadow] duration-150',
        className,
      )}
    >
      <ItemThumb
        item={item}
        className={compact ? 'size-[calc(24px*var(--scale))]' : 'size-[calc(32px*var(--scale))]'}
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-medium">{item.name}</span>
        {item.subtitle && !compact && (
          <span className="block truncate text-[0.78em] opacity-65">{item.subtitle}</span>
        )}
      </span>
      {item.hotTake && (
        <span
          className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#ff6b3d] text-[11px] shadow-sm ring-2 ring-[var(--row-bg,var(--surface))]"
          title={item.hotTakeNote ? `Hot take: ${item.hotTakeNote}` : 'Hot take'}
        >
          🔥
        </span>
      )}
    </div>
  );
});

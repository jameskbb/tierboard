import { ItemThumb } from '@/components/items/ItemChip';
import { cn } from '@/lib/cn';
import type { RankItem, Tier } from '@/models/board';

/** Big, room-readable item display used by Quick Rank, Random, Vote and Compare. */
export function StageItem({
  item,
  tier,
  size = 'lg',
  className,
}: {
  item: RankItem;
  tier?: Tier | null;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {(item.image || item.emoji) && (
        <ItemThumb
          item={item}
          className={cn(
            'rounded-[18px]',
            size === 'lg' ? 'size-24 text-[3.2rem] sm:size-28' : 'size-16 text-[2.2rem]',
          )}
        />
      )}
      <div className="min-w-0 max-w-full">
        <div
          className={cn(
            'font-display leading-[1.02] font-extrabold tracking-tight break-words',
            size === 'lg' ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl',
          )}
        >
          {item.name}
          {item.hotTake && <span className="ml-2 align-top text-[0.5em]">🔥</span>}
        </div>
        {item.subtitle && (
          <div className="mt-1.5 text-base opacity-70 sm:text-lg">{item.subtitle}</div>
        )}
        {tier && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm opacity-80">
            Currently
            <span
              className="rounded-[6px] px-1.5 py-0.5 font-display font-bold text-[#1b1e27]"
              style={{ background: tier.color }}
            >
              {tier.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

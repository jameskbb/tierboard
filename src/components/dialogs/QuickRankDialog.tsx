import { SkipForward, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { actions } from '@/features/ranking/actions';
import { readableText } from '@/lib/color';
import { useBoard } from '@/stores/boardStore';
import { StageItem } from './StageItem';

/**
 * Rank without dragging: one unranked item at a time, huge tier buttons,
 * number keys 1–9. Space skips, Backspace undoes the last placement.
 */
export function QuickRankDialog({
  onClose,
  initialItemId,
}: {
  onClose: () => void;
  initialItemId: string | null;
}) {
  const board = useBoard()!;
  const [skipped, setSkipped] = useState<string[]>([]);
  const [first] = useState(initialItemId);
  const [ranked, setRanked] = useState(0);

  const queue = board.unrankedItemIds;
  const preferred = first && queue.includes(first) && ranked === 0 ? first : null;
  const currentId = preferred ?? queue.find((id) => !skipped.includes(id)) ?? queue[0] ?? null;
  const item = currentId ? board.items[currentId] : undefined;

  const rank = (position: number) => {
    if (!currentId || position >= board.tiers.length) return;
    actions.rankItem(currentId, position);
    setRanked((n) => n + 1);
    setSkipped((list) => list.filter((id) => id !== currentId));
  };
  const skip = () => {
    if (!currentId) return;
    setSkipped((list) => {
      const next = [...list.filter((id) => id !== currentId), currentId];
      // Everyone skipped: start the cycle over.
      return next.length >= queue.length ? [currentId] : next;
    });
  };
  const undo = () => {
    if (ranked === 0) return;
    actions.undo();
    setRanked((n) => n - 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        rank(Number(event.key) - 1);
      } else if (event.key === ' ' || event.key === 'ArrowRight') {
        event.preventDefault();
        skip();
      } else if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <Dialog open onClose={onClose} title="Quick rank" tone="stage" size="xl" hideTitle>
      {/* Focus the panel, not the first tier button, so nothing looks preselected. */}
      <div className="flex min-h-[52dvh] flex-col outline-none" tabIndex={-1} data-autofocus>
        <div className="flex items-center justify-between text-sm text-white/60">
          <span className="font-display font-bold text-white/85">Quick rank</span>
          <span aria-live="polite">{queue.length === 0 ? 'All done' : `${queue.length} left`}</span>
        </div>

        {item ? (
          <>
            <div className="flex flex-1 items-center justify-center py-8" aria-live="polite">
              <StageItem key={item.id} item={item} className="animate-rise" />
            </div>
            <div
              className="grid grid-cols-3 gap-2 sm:flex sm:justify-center"
              role="group"
              aria-label="Choose a tier"
            >
              {board.tiers.map((tier, index) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => rank(index)}
                  style={{ background: tier.color, color: readableText(tier.color) }}
                  className="relative flex h-20 min-w-0 flex-col items-center justify-center rounded-[14px] px-3 font-display text-2xl font-extrabold transition-transform hover:-translate-y-0.5 active:scale-95 sm:h-24 sm:min-w-24 sm:text-3xl"
                >
                  <span className="max-w-full truncate">{tier.name}</span>
                  {index < 9 && (
                    <span className="absolute top-1.5 right-2 font-mono text-[11px] font-medium opacity-60">
                      {index + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/60">
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:bg-white/10"
                icon={<Undo2 className="size-4" />}
                onClick={undo}
                disabled={ranked === 0}
              >
                Undo <Kbd className="ml-1 bg-white/10 text-white/70">⌫</Kbd>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:bg-white/10"
                icon={<SkipForward className="size-4" />}
                onClick={skip}
                disabled={queue.length < 2}
              >
                Skip for now <Kbd className="ml-1 bg-white/10 text-white/70">Space</Kbd>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="text-5xl">🎉</div>
            <div className="font-display text-3xl font-extrabold">Everything is ranked</div>
            <p className="text-white/60">
              {ranked
                ? `You placed ${ranked} item${ranked === 1 ? '' : 's'}.`
                : 'Add more items to keep going.'}
            </p>
            <Button variant="primary" size="lg" onClick={onClose} data-autofocus>
              Back to the board
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

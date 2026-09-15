import { Dices, Vote } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MoveToTiers } from '@/components/items/ItemEditor';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { pickRandom } from '@/features/ranking/randomPick';
import { cn } from '@/lib/cn';
import { getBoard, useBoard } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';
import { StageItem } from './StageItem';

/**
 * "Okay, next up: Papa V's." Spins through unranked names like a selector
 * wheel, lands on one, then lets the room rank it right there.
 */
export function RandomPickDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const reducedMotion = usePrefersReducedMotion();
  const [fromAll, setFromAll] = useState(board.unrankedItemIds.length === 0);
  const [spinningName, setSpinningName] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const spin = useCallback(() => {
    const current = getBoard();
    if (!current) return;
    const pool = fromAll ? Object.keys(current.items) : current.unrankedItemIds;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPickedId(null);
    const winner = pickRandom(pool, Math.random, pickedId ?? undefined);
    if (!winner) return;
    if (reducedMotion || pool.length === 1) {
      setPickedId(winner);
      return;
    }
    // Decelerating ticks: fast at first, then slowing into the pick.
    // ~1.3s total: quick enough to keep the conversation moving.
    let elapsed = 0;
    const ticks = 14;
    for (let i = 0; i < ticks; i++) {
      elapsed += 40 + i * i * 0.9;
      const id = i === ticks - 1 ? winner : pickRandom(pool)!;
      timers.current.push(
        setTimeout(() => {
          if (i === ticks - 1) {
            setSpinningName(null);
            setPickedId(winner);
          } else {
            setSpinningName(current.items[id]?.name ?? '');
          }
        }, elapsed),
      );
    }
  }, [fromAll, pickedId, reducedMotion]);

  useEffect(() => {
    const start = setTimeout(spin, 0);
    return () => {
      clearTimeout(start);
      timers.current.forEach(clearTimeout);
    };
    // Spin once on open and whenever the pool changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAll]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === 'r' || event.key === 'R') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spin]);

  const picked = pickedId ? board.items[pickedId] : undefined;
  const pickedTier = pickedId ? board.tiers.find((t) => t.itemIds.includes(pickedId)) : null;
  const nothingLeft = board.unrankedItemIds.length === 0 && !fromAll;
  const noItems = Object.keys(board.items).length === 0;

  return (
    <Dialog open onClose={onClose} title="Next up" tone="stage" size="lg" hideTitle>
      <div className="flex min-h-[44dvh] flex-col items-center justify-between gap-6 py-2 text-center">
        <div className="text-sm font-medium text-white/60">
          {fromAll ? 'Random pick from every item' : 'Next up from Unranked'}
        </div>

        <div className="flex min-h-40 w-full items-center justify-center" aria-live="polite">
          {noItems ? (
            <p className="text-white/70">Add some items first.</p>
          ) : nothingLeft ? (
            <div className="space-y-3">
              <p className="font-display text-2xl font-bold">Unranked is empty</p>
              <Button onClick={() => setFromAll(true)}>Pick from every item</Button>
            </div>
          ) : spinningName !== null ? (
            <div
              className={cn(
                'font-display text-4xl font-extrabold tracking-tight text-white/40 blur-[0.4px] sm:text-6xl',
              )}
            >
              {spinningName}
            </div>
          ) : picked ? (
            <StageItem item={picked} tier={pickedTier} className="animate-pop" />
          ) : null}
        </div>

        {picked && spinningName === null && (
          <div className="w-full space-y-4">
            <div className="flex justify-center">
              <MoveToTiers
                board={board}
                itemId={picked.id}
                size="lg"
                onMoved={() => (getBoard()?.unrankedItemIds.length ? spin() : onClose())}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                icon={<Dices className="size-4" />}
                onClick={spin}
                data-autofocus
              >
                Pick another
              </Button>
              <Button
                icon={<Vote className="size-4" />}
                onClick={() => useUiStore.getState().openDialog('vote', picked.id)}
              >
                Vote on it
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

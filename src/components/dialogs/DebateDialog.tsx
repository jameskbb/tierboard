import { ArrowLeftRight, Check, Swords } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { actions } from '@/features/ranking/actions';
import { findItemContainer, getContainerItems, moveItem } from '@/features/ranking/boardOps';
import { pickDebatePair, type DebatePair } from '@/features/ranking/randomPick';
import { getBoard, useBoard } from '@/stores/boardStore';
import { StageItem } from './StageItem';

/** Two ranked items, head to head: "is this really the right order?" */
export function DebateDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const [pair, setPair] = useState<DebatePair | null>(() => pickDebatePair(board));

  const next = useCallback(() => {
    const current = getBoard();
    if (current) setPair(pickDebatePair(current));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  const tierOf = (id: string) => board.tiers.find((tier) => tier.itemIds.includes(id)) ?? null;

  const swap = () => {
    if (!pair) return;
    const current = getBoard()!;
    const aContainer = findItemContainer(current, pair.a)!;
    const bContainer = findItemContainer(current, pair.b)!;
    const aIndex = getContainerItems(current, aContainer).indexOf(pair.a);
    const bIndex = getContainerItems(current, bContainer).indexOf(pair.b);
    let swapped = moveItem(current, pair.a, bContainer, bIndex);
    swapped = moveItem(swapped, pair.b, aContainer, aIndex);
    actions.replaceBoard(swapped);
    next();
  };

  const a = pair ? board.items[pair.a] : undefined;
  const b = pair ? board.items[pair.b] : undefined;

  return (
    <Dialog open onClose={onClose} title="Random debate" tone="stage" size="xl">
      {!a || !b ? (
        <p className="py-10 text-center text-white/70">
          Rank at least two items to start a debate.
        </p>
      ) : (
        <div className="space-y-8 py-2">
          <p className="text-center text-white/70">Are these in the right order?</p>
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
            <StageItem item={a} tier={tierOf(a.id)} size="md" className="animate-rise" />
            <Swords className="mx-auto size-8 text-white/40" aria-label="versus" />
            <StageItem item={b} tier={tierOf(b.id)} size="md" className="animate-rise" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button icon={<Check className="size-4" />} onClick={next} data-autofocus>
              Looks right
            </Button>
            <Button variant="primary" icon={<ArrowLeftRight className="size-4" />} onClick={swap}>
              Swap them
            </Button>
            <Button variant="ghost" className="text-white/80 hover:bg-white/10" onClick={next}>
              Another pair (D)
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

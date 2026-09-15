import { Minus, Plus, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { actions } from '@/features/ranking/actions';
import { applyBuckets, clearRankings } from '@/features/ranking/boardOps';
import {
  answerCompare,
  bucketize,
  currentPair,
  estimateComparisons,
  isCompareDone,
  startCompare,
  suggestTierCounts,
  type CompareState,
} from '@/features/ranking/pairwise';
import { readableText } from '@/lib/color';
import { getBoard, useBoard } from '@/stores/boardStore';
import { StageItem } from './StageItem';

type Scope = 'unranked' | 'all';

/**
 * Optional pairwise ranking: answer "Which is better?" until an order emerges,
 * then accept or adjust a suggested tier distribution.
 */
export function CompareDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const allIds = useMemo(
    () => [...board.tiers.flatMap((t) => t.itemIds), ...board.unrankedItemIds],
    [board],
  );
  const [scope, setScope] = useState<Scope>(board.unrankedItemIds.length >= 2 ? 'unranked' : 'all');
  const [history, setHistory] = useState<CompareState[]>([]);
  const [counts, setCounts] = useState<number[] | null>(null);

  const state = history[history.length - 1];
  const poolIds = scope === 'unranked' ? board.unrankedItemIds : allIds;
  const done = state ? isCompareDone(state) : false;
  const pair = state ? currentPair(state) : null;

  const start = () => {
    setHistory([startCompare(poolIds)]);
    setCounts(null);
  };
  const answer = (challengerWins: boolean) => {
    if (!state) return;
    const next = answerCompare(state, challengerWins);
    setHistory((list) => [...list, next]);
    if (isCompareDone(next)) setCounts(suggestTierCounts(next.sorted.length, board.tiers.length));
  };
  const undoAnswer = () => {
    setHistory((list) => (list.length > 1 ? list.slice(0, -1) : list));
    setCounts(null);
  };

  useEffect(() => {
    if (!pair) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === '1') answer(true);
      else if (event.key === 'ArrowRight' || event.key === '2') answer(false);
      else if (event.key === 'Backspace') undoAnswer();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const buckets = state && counts ? bucketize(state.sorted, counts) : [];
  const adjust = (index: number, delta: number) => {
    if (!counts) return;
    const next = [...counts];
    const target = index + (delta > 0 ? 1 : -1);
    // Moving the boundary: take from the neighbour so the total stays the same.
    if (delta > 0 && next[index + 1] !== undefined && next[index + 1]! > 0) {
      next[index]!++;
      next[index + 1]!--;
    } else if (delta < 0 && next[index]! > 0 && target >= 0 && next[index + 1] !== undefined) {
      next[index]!--;
      next[index + 1]!++;
    }
    setCounts(next);
  };

  const accept = () => {
    const current = getBoard()!;
    const base = scope === 'all' ? clearRankings(current) : current;
    actions.replaceBoard(applyBuckets(base, buckets));
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Compare two at a time"
      size="xl"
      tone={state && !done ? 'stage' : 'default'}
    >
      {!state && (
        <div className="space-y-5">
          <p className="text-muted">
            Pick the better of two items, again and again. Tierboard builds an order from your
            answers and suggests where each tier should split. Nothing changes until you accept.
          </p>
          <div className="max-w-md">
            <Segmented<Scope>
              label="What to compare"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'unranked', label: `Unranked (${board.unrankedItemIds.length})` },
                { value: 'all', label: `Everything (${allIds.length})` },
              ]}
            />
          </div>
          <p className="text-sm text-muted">
            About {estimateComparisons(poolIds.length)} quick questions.
          </p>
          <Button
            variant="primary"
            size="lg"
            disabled={poolIds.length < 2}
            onClick={start}
            data-autofocus
          >
            Start comparing
          </Button>
        </div>
      )}

      {state && !done && pair && (
        <div className="space-y-6 py-2">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="font-display text-lg font-bold text-white">Which is better?</span>
            <span className="ml-auto tabular-nums">
              {state.answered} / ~{state.total}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div
              className="h-full bg-accent transition-[width]"
              style={{
                width: `${Math.min(100, (state.answered / Math.max(1, state.total)) * 100)}%`,
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((side) => {
              const id = pair[side]!;
              return (
                <button
                  key={`${side}-${id}`}
                  type="button"
                  onClick={() => answer(side === 0)}
                  className="flex min-h-56 animate-rise flex-col items-center justify-center rounded-[20px] bg-white/[0.06] p-6 ring-accent transition-[transform,background-color] hover:bg-white/[0.1] focus-visible:ring-2 active:scale-[0.98]"
                >
                  <StageItem item={board.items[id]!} size="md" />
                  <span className="mt-4 text-xs text-white/50">
                    {side === 0 ? '← or 1' : '→ or 2'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10"
              icon={<Undo2 className="size-4" />}
              onClick={undoAnswer}
              disabled={history.length < 2}
            >
              Undo answer <Kbd className="ml-1 bg-white/10 text-white/70">⌫</Kbd>
            </Button>
          </div>
        </div>
      )}

      {state && done && counts && (
        <div className="space-y-5">
          <p className="text-muted">
            Here’s the suggested split. Nudge the boundaries with the arrows, then place them on the
            board.
          </p>
          <ol className="space-y-1.5">
            {board.tiers.map((tier, index) => (
              <li
                key={tier.id}
                className="flex items-stretch overflow-hidden rounded-[12px] bg-surface-2"
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center font-display text-lg font-extrabold"
                  style={{ background: tier.color, color: readableText(tier.color) }}
                >
                  {tier.name}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 px-3 py-2 text-sm">
                  {buckets[index]?.map((id) => (
                    <span
                      key={id}
                      className="rounded-[7px] bg-surface px-2 py-1 ring-1 ring-line ring-inset"
                    >
                      {board.items[id]?.name}
                    </span>
                  ))}
                  {buckets[index]?.length === 0 && <span className="text-muted">Empty</span>}
                </span>
                {index < board.tiers.length - 1 && (
                  <span className="flex flex-col justify-center pr-1">
                    <button
                      type="button"
                      aria-label={`One more in ${tier.name}`}
                      onClick={() => adjust(index, 1)}
                      className="rounded p-1 text-muted hover:text-text"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`One fewer in ${tier.name}`}
                      onClick={() => adjust(index, -1)}
                      className="rounded p-1 text-muted hover:text-text"
                    >
                      <Minus className="size-3.5" />
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={start}>
              Start over
            </Button>
            <Button variant="primary" onClick={accept} data-autofocus>
              Place on the board
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

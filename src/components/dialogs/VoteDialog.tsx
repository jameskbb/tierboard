import { ArrowDown, ArrowUp, Dices, Minus, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { actions } from '@/features/ranking/actions';
import { findItemContainer, tierIndex } from '@/features/ranking/boardOps';
import { pickRandom } from '@/features/ranking/randomPick';
import {
  applyVote,
  createLocalVoteChannel,
  emptyTally,
  tierVoteResult,
  upDownVerdict,
  type VoteEvent,
  type VoteTally,
} from '@/features/voting/voting';
import { readableText } from '@/lib/color';
import { UNRANKED_ID } from '@/models/board';
import { getBoard, useBoard } from '@/stores/boardStore';
import { ItemPicker } from './ItemPicker';
import { StageItem } from './StageItem';

type Mode = 'tier' | 'updown';

function reducer(
  state: VoteTally,
  action: VoteEvent | { type: 'reset'; itemId: string },
): VoteTally {
  if ('type' in action) return emptyTally(action.itemId);
  return applyVote(state, action);
}

/**
 * Group voting around one screen. The person driving taps +1 per called-out
 * vote. Votes flow through a VoteChannel so a future multiplayer backend can
 * feed the same tally from phones.
 */
export function VoteDialog({
  onClose,
  initialItemId,
}: {
  onClose: () => void;
  initialItemId: string | null;
}) {
  const board = useBoard()!;
  const [itemId, setItemId] = useState<string | null>(
    initialItemId && board.items[initialItemId] ? initialItemId : null,
  );
  const [mode, setMode] = useState<Mode>('tier');
  const [tally, dispatch] = useReducer(reducer, emptyTally(itemId ?? ''));
  const channel = useMemo(() => createLocalVoteChannel(), []);

  useEffect(() => channel.subscribe(dispatch), [channel]);

  const choose = (id: string) => {
    setItemId(id);
    dispatch({ type: 'reset', itemId: id });
  };

  const vote = (event: Omit<VoteEvent, 'itemId'>) =>
    itemId && channel.publish({ ...event, itemId });

  useEffect(() => {
    if (!itemId || mode !== 'tier') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || !/^[1-9]$/.test(event.key)) return;
      const tier = getBoard()?.tiers[Number(event.key) - 1];
      if (!tier) return;
      event.preventDefault();
      channel.publish({
        itemId,
        choice: { kind: 'tier', tierId: tier.id },
        delta: event.shiftKey ? -1 : 1,
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [itemId, mode, channel]);

  const item = itemId ? board.items[itemId] : undefined;
  const container = itemId ? findItemContainer(board, itemId) : null;
  const currentIndex = container && container !== UNRANKED_ID ? tierIndex(board, container) : -1;
  const result = tierVoteResult(
    board.tiers.map((t) => t.id),
    tally,
  );
  const winner = board.tiers.find((t) => t.id === result.winnerTierId);
  const maxVotes = Math.max(1, ...Object.values(tally.tiers));
  const verdict = upDownVerdict(tally);
  const verdictTarget =
    currentIndex >= 0
      ? board.tiers[currentIndex + (verdict === 'up' ? -1 : verdict === 'down' ? 1 : 0)]
      : undefined;

  const nextItem = () => {
    const pick = pickRandom(getBoard()!.unrankedItemIds.filter((id) => id !== itemId));
    if (pick) choose(pick);
    else setItemId(null);
  };

  return (
    <Dialog open onClose={onClose} title="Group vote" tone="stage" size="full">
      {!item ? (
        <div className="mx-auto max-w-lg space-y-3">
          <p className="text-white/70">What are we voting on?</p>
          <ItemPicker board={board} selected={[]} onToggle={choose} />
        </div>
      ) : (
        <div className="space-y-6 outline-none" tabIndex={-1} data-autofocus>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <StageItem
              item={item}
              tier={currentIndex >= 0 ? board.tiers[currentIndex] : null}
              size="md"
              className="items-start text-left"
            />
            <div className="flex flex-col items-end gap-2">
              {currentIndex >= 0 && (
                <div className="w-56">
                  <Segmented<Mode>
                    label="Vote type"
                    hideLabel
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'tier', label: 'Pick a tier' },
                      { value: 'updown', label: 'Up or down' },
                    ]}
                  />
                </div>
              )}
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:bg-white/10"
                  icon={<RotateCcw className="size-4" />}
                  onClick={() => dispatch({ type: 'reset', itemId: item.id })}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:bg-white/10"
                  icon={<Dices className="size-4" />}
                  onClick={nextItem}
                >
                  Next item
                </Button>
              </div>
            </div>
          </div>

          {mode === 'tier' || currentIndex < 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
                {board.tiers.map((tier, index) => {
                  const count = tally.tiers[tier.id] ?? 0;
                  return (
                    <div
                      key={tier.id}
                      className="flex flex-col overflow-hidden rounded-[16px] bg-white/[0.06]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          vote({ choice: { kind: 'tier', tierId: tier.id }, delta: 1 })
                        }
                        className="relative flex h-36 flex-col items-center justify-end overflow-hidden pb-3 transition-transform active:scale-[0.98] sm:h-44"
                        aria-label={`Vote ${tier.name}. ${count} vote${count === 1 ? '' : 's'}`}
                      >
                        <span
                          className="absolute inset-x-0 bottom-0 transition-[height] duration-300"
                          style={{
                            height: `${(count / maxVotes) * 100}%`,
                            background: tier.color,
                            opacity: 0.28,
                          }}
                          aria-hidden
                        />
                        <span className="relative font-mono text-4xl font-semibold tabular-nums sm:text-5xl">
                          {count}
                        </span>
                        <span className="relative mt-1 text-xs text-white/50">
                          {index < 9 ? `press ${index + 1}` : ''}
                        </span>
                      </button>
                      <div
                        className="flex items-stretch"
                        style={{ background: tier.color, color: readableText(tier.color) }}
                      >
                        <span className="flex flex-1 items-center justify-center py-2 font-display text-xl font-extrabold">
                          {tier.name}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove a ${tier.name} vote`}
                          disabled={count === 0}
                          onClick={() =>
                            vote({ choice: { kind: 'tier', tierId: tier.id }, delta: -1 })
                          }
                          className="flex w-10 items-center justify-center bg-black/10 disabled:opacity-30"
                        >
                          <Minus className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-white/[0.06] px-5 py-4"
                aria-live="polite"
              >
                <div>
                  <div className="text-sm text-white/60">
                    {result.total} vote{result.total === 1 ? '' : 's'}
                    {result.tieBroken && ' · tie settled by the middle vote'}
                  </div>
                  <div className="font-display text-3xl font-extrabold">
                    {winner ? (
                      <>
                        Group result:{' '}
                        <span
                          className="rounded-[8px] px-2"
                          style={{ background: winner.color, color: readableText(winner.color) }}
                        >
                          {winner.name}
                        </span>
                      </>
                    ) : (
                      'Call out your votes'
                    )}
                  </div>
                </div>
                {winner && (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      actions.moveItem(item.id, winner.id);
                      nextItem();
                    }}
                  >
                    Put it in {winner.name}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([1, -1] as const).map((direction) => {
                  const count = direction === 1 ? tally.up : tally.down;
                  return (
                    <div key={direction} className="overflow-hidden rounded-[18px] bg-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => vote({ choice: { kind: 'updown', direction }, delta: 1 })}
                        className="flex h-44 w-full flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      >
                        {direction === 1 ? (
                          <ThumbsUp className="size-9" />
                        ) : (
                          <ThumbsDown className="size-9" />
                        )}
                        <span className="font-mono text-5xl font-semibold tabular-nums">
                          {count}
                        </span>
                        <span className="text-sm text-white/60">
                          {direction === 1 ? 'Better than this' : 'Worse than this'}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={count === 0}
                        onClick={() => vote({ choice: { kind: 'updown', direction }, delta: -1 })}
                        className="w-full bg-black/20 py-2 text-sm text-white/70 disabled:opacity-30"
                      >
                        Remove one
                      </button>
                    </div>
                  );
                })}
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-white/[0.06] px-5 py-4"
                aria-live="polite"
              >
                <div className="font-display text-2xl font-extrabold">
                  {tally.up + tally.down === 0
                    ? 'Better or worse?'
                    : verdict === 'stay' || !verdictTarget || verdictTarget.id === container
                      ? `Stays in ${board.tiers[currentIndex]?.name}`
                      : `Move ${verdict} to ${verdictTarget.name}`}
                </div>
                {verdict !== 'stay' && verdictTarget && verdictTarget.id !== container && (
                  <Button
                    size="lg"
                    variant="primary"
                    icon={
                      verdict === 'up' ? (
                        <ArrowUp className="size-5" />
                      ) : (
                        <ArrowDown className="size-5" />
                      )
                    }
                    onClick={() => {
                      actions.moveItem(item.id, verdictTarget.id);
                      dispatch({ type: 'reset', itemId: item.id });
                    }}
                  >
                    Move to {verdictTarget.name}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

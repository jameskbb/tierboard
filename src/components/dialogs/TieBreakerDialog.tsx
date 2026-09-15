import { Scale, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { actions } from '@/features/ranking/actions';
import { findItemContainer } from '@/features/ranking/boardOps';
import { useBoard } from '@/stores/boardStore';
import { ItemPicker } from './ItemPicker';
import { StageItem } from './StageItem';

const MAX_ITEMS = 6;

function roundRobin(ids: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i]!, ids[j]!]);
  return pairs;
}

/** Head-to-head decisions between 2–6 items; the room picks each winner. */
export function TieBreakerDialog({
  onClose,
  initialItemId,
}: {
  onClose: () => void;
  initialItemId: string | null;
}) {
  const board = useBoard()!;
  const [selected, setSelected] = useState<string[]>(initialItemId ? [initialItemId] : []);
  const [matches, setMatches] = useState<[string, string][] | null>(null);
  const [winners, setWinners] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const standings = useMemo(() => {
    const wins = new Map(selected.map((id) => [id, 0]));
    winners.forEach((id) => wins.set(id, (wins.get(id) ?? 0) + 1));
    return [...selected]
      .sort((a, b) => {
        const diff = wins.get(b)! - wins.get(a)!;
        if (diff) return diff;
        // Head-to-head settles ties between two.
        const match =
          matches?.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a)) ?? -1;
        return match >= 0 && winners[match] === a ? -1 : 1;
      })
      .map((id) => ({ id, wins: wins.get(id)! }));
  }, [selected, winners, matches]);

  const current = matches?.[winners.length];
  const finished = matches && winners.length === matches.length;
  const containers = new Set(selected.map((id) => findItemContainer(board, id)));
  const sameContainer = containers.size === 1 ? [...containers][0] : null;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Tie breaker"
      size="lg"
      tone={current ? 'stage' : 'default'}
    >
      {!matches && (
        <div className="space-y-4">
          <p className="text-muted">
            Pick 2–{MAX_ITEMS} items. They go head to head until there’s a winner.
          </p>
          <ItemPicker
            board={board}
            selected={selected}
            onToggle={toggle}
            multiple
            max={MAX_ITEMS}
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Scale className="size-4" />}
              disabled={selected.length < 2}
              onClick={() => {
                setMatches(roundRobin(selected));
                setWinners([]);
              }}
            >
              Start ({roundRobin(selected).length} matchup
              {roundRobin(selected).length === 1 ? '' : 's'})
            </Button>
          </div>
        </div>
      )}

      {current && (
        <div className="space-y-6 py-2">
          <div className="text-center text-sm text-white/60">
            Matchup {winners.length + 1} of {matches!.length}. Tap the winner.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {current.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setWinners((list) => [...list, id])}
                className="flex min-h-48 animate-rise items-center justify-center rounded-[20px] bg-white/[0.06] p-6 hover:bg-white/[0.1] active:scale-[0.98]"
              >
                <StageItem item={board.items[id]!} size="md" />
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Trophy className="size-6 text-[#F6D55C]" />
            <div className="font-display text-2xl font-extrabold">
              {board.items[standings[0]!.id]?.name} wins
            </div>
          </div>
          <ol className="space-y-1.5">
            {standings.map(({ id, wins }, index) => (
              <li
                key={id}
                className="flex items-center gap-3 rounded-[10px] bg-surface-2 px-3 py-2"
              >
                <span className="w-5 font-mono text-sm text-muted">{index + 1}</span>
                <span className="flex-1 font-medium">{board.items[id]?.name}</span>
                <span className="text-sm text-muted">
                  {wins} win{wins === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setMatches(null)}>
              Choose other items
            </Button>
            {sameContainer && (
              <Button
                variant="primary"
                onClick={() => {
                  actions.reorderWithin(
                    sameContainer,
                    standings.map((s) => s.id),
                  );
                  onClose();
                }}
              >
                Apply this order
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

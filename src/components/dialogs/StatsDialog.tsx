import { Dialog } from '@/components/ui/Dialog';
import { computeStats } from '@/features/ranking/stats';
import { readableText } from '@/lib/color';
import { useBoard } from '@/stores/boardStore';

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-3.5 py-3">
      <div className="font-display text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export function StatsDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const stats = computeStats(board);
  const max = Math.max(1, ...stats.tiers.map((tier) => tier.count));
  const hotTakes = Object.values(board.items).filter((item) => item.hotTake);

  return (
    <Dialog open onClose={onClose} title="Stats" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Figure value={stats.total} label="items" />
          <Figure value={stats.ranked} label="ranked" />
          <Figure value={stats.unranked} label="unranked" />
          <Figure value={`${stats.percentRanked}%`} label="done" />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Items per tier</h3>
          <ul className="space-y-1.5">
            {stats.tiers.map((tier) => (
              <li key={tier.id} className="flex items-center gap-3">
                <span
                  className="flex h-8 w-14 shrink-0 items-center justify-center rounded-[8px] font-display text-sm font-extrabold"
                  style={{ background: tier.color, color: readableText(tier.color) }}
                >
                  <span className="truncate px-1">{tier.name}</span>
                </span>
                <span className="relative h-8 flex-1 overflow-hidden rounded-[8px] bg-surface-2">
                  <span
                    className="absolute inset-y-0 left-0 rounded-[8px] transition-[width]"
                    style={{
                      width: `${(tier.count / max) * 100}%`,
                      background: tier.color,
                      opacity: 0.55,
                    }}
                  />
                  <span className="relative flex h-full items-center px-2.5 text-sm tabular-nums">
                    {tier.count}{' '}
                    {tier.count > 0 && <span className="ml-1.5 text-muted">({tier.percent}%)</span>}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Most crowded</dt>
            <dd className="font-medium">
              {stats.mostCrowded ? `${stats.mostCrowded.name} (${stats.mostCrowded.count})` : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Empty tiers</dt>
            <dd className="font-medium">
              {stats.emptyTiers.length ? stats.emptyTiers.map((t) => t.name).join(', ') : 'None'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Hot takes</dt>
            <dd className="font-medium">{stats.hotTakes}</dd>
          </div>
        </dl>

        {hotTakes.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">🔥 Hot takes</h3>
            <ul className="space-y-1.5 text-sm">
              {hotTakes.map((item) => (
                <li key={item.id} className="rounded-[10px] bg-surface-2 px-3 py-2">
                  <span className="font-medium">{item.name}</span>
                  {item.hotTakeNote && <span className="text-muted">: “{item.hotTakeNote}”</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}

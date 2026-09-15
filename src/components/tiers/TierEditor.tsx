import {
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  ArrowUpAZ,
  Copy,
  CornerDownLeft,
  Plus,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Popover, type Anchor } from '@/components/ui/Popover';
import { actions } from '@/features/ranking/actions';
import { TIER_SWATCHES } from '@/features/ranking/presets';
import { cn } from '@/lib/cn';
import type { Tier } from '@/models/board';

interface TierEditorProps {
  tier: Tier;
  index: number;
  tierCount: number;
  anchor: Anchor | null;
  onClose: () => void;
}

/** Everything about one tier in one small panel: name, color, sort, structure. */
export function TierEditor({ tier, index, tierCount, anchor, onClose }: TierEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = tier.itemIds.length;

  const run =
    (fn: () => void, close = true) =>
    () => {
      fn();
      if (close) onClose();
    };

  return (
    <Popover anchor={anchor} onClose={onClose} label={`Edit ${tier.name} tier`} width={320}>
      <div className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Tier name</span>
          <input
            data-autofocus
            value={tier.name}
            maxLength={40}
            onChange={(event) => actions.updateTier(tier.id, { name: event.target.value })}
            onKeyDown={(event) => event.key === 'Enter' && onClose()}
            className="h-10 w-full rounded-[10px] bg-surface-2 px-3 font-display text-lg font-bold ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
          />
        </label>

        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-muted">Color</legend>
          <div className="flex flex-wrap gap-1.5">
            {TIER_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                aria-pressed={tier.color.toLowerCase() === color.toLowerCase()}
                onClick={() => actions.updateTier(tier.id, { color })}
                className={cn(
                  'size-7 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110',
                  tier.color.toLowerCase() === color.toLowerCase() && 'ring-2 ring-text',
                )}
                style={{ background: color }}
              />
            ))}
            <label
              className="relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-line ring-inset"
              title="Custom color"
            >
              <Plus className="size-3.5 text-muted" />
              <input
                type="color"
                value={tier.color}
                onChange={(event) => actions.updateTier(tier.id, { color: event.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Custom color"
              />
            </label>
          </div>
        </fieldset>

        {count > 1 && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Sort items</span>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                size="sm"
                icon={<ArrowDownAZ className="size-4" />}
                onClick={run(() => actions.sortContainer(tier.id, 'az'), false)}
              >
                A–Z
              </Button>
              <Button
                size="sm"
                icon={<ArrowUpAZ className="size-4" />}
                onClick={run(() => actions.sortContainer(tier.id, 'za'), false)}
              >
                Z–A
              </Button>
              <Button
                size="sm"
                icon={<Shuffle className="size-4" />}
                onClick={run(() => actions.sortContainer(tier.id, 'shuffle'), false)}
              >
                Shuffle
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            icon={<ArrowUp className="size-4" />}
            disabled={index === 0}
            onClick={run(() => actions.moveTier(index, index - 1), false)}
          >
            Move up
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            icon={<ArrowDown className="size-4" />}
            disabled={index === tierCount - 1}
            onClick={run(() => actions.moveTier(index, index + 1), false)}
          >
            Move down
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            icon={<Plus className="size-4" />}
            onClick={run(() => actions.addTier(index + 1))}
          >
            Add below
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="justify-start"
            icon={<Copy className="size-4" />}
            onClick={run(() => actions.duplicateTier(tier.id))}
          >
            Duplicate
          </Button>
          {count > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              icon={<CornerDownLeft className="size-4" />}
              onClick={run(() => actions.clearTier(tier.id))}
            >
              Unrank items
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="justify-start text-danger"
            icon={<Trash2 className="size-4" />}
            onClick={
              count > 0 ? () => setConfirmDelete(true) : run(() => actions.deleteTier(tier.id))
            }
          >
            Delete tier
          </Button>
        </div>

        {confirmDelete && (
          <div
            className="animate-rise space-y-2 rounded-[12px] bg-surface-2 p-3"
            role="alertdialog"
            aria-label="Delete tier"
          >
            <p className="text-sm">
              <strong>{tier.name}</strong> has {count} item{count === 1 ? '' : 's'}. What should
              happen to {count === 1 ? 'it' : 'them'}?
            </p>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="primary"
                size="sm"
                data-autofocus
                onClick={run(() => actions.deleteTier(tier.id, 'unrank'))}
              >
                Move to Unranked and delete tier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={run(() => actions.deleteTier(tier.id, 'delete-items'))}
              >
                Delete tier and its items
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Popover>
  );
}

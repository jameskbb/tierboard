import { ArrowDown, ArrowUp, Copy, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { Segmented, Toggle } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { getRepository } from '@/features/persistence/boardRepository';
import { actions } from '@/features/ranking/actions';
import { TIER_PRESETS } from '@/features/ranking/presets';
import { BOARD_THEMES } from '@/lib/boardThemes';
import { cn } from '@/lib/cn';
import { navigate, routes } from '@/lib/router';
import type { Tier } from '@/models/board';
import { useBoard, useBoardStore } from '@/stores/boardStore';
import { usePrefsStore, type ColorScheme } from '@/stores/prefsStore';
import { toast } from '@/stores/uiStore';

type Tab = 'tiers' | 'look' | 'board';

function TierLine({ tier, index, count }: { tier: Tier; index: number; count: number }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="rounded-[12px] bg-surface-2 p-2">
      <div className="flex items-center gap-2">
        <label
          className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-[9px]"
          style={{ background: tier.color }}
          title="Change color"
        >
          <input
            type="color"
            value={tier.color}
            onChange={(event) => actions.updateTier(tier.id, { color: event.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${tier.name} color`}
          />
        </label>
        <input
          value={tier.name}
          maxLength={40}
          aria-label={`Tier ${index + 1} name`}
          onChange={(event) => actions.updateTier(tier.id, { name: event.target.value })}
          className="h-9 min-w-0 flex-1 rounded-[9px] bg-surface px-2.5 font-display font-bold ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
        />
        <span className="w-8 text-center font-mono text-xs text-muted" title="Items">
          {tier.itemIds.length}
        </span>
        <IconButton
          size="sm"
          label="Move up"
          disabled={index === 0}
          onClick={() => actions.moveTier(index, index - 1)}
        >
          <ArrowUp className="size-4" />
        </IconButton>
        <IconButton
          size="sm"
          label="Move down"
          disabled={index === count - 1}
          onClick={() => actions.moveTier(index, index + 1)}
        >
          <ArrowDown className="size-4" />
        </IconButton>
        <IconButton
          size="sm"
          label="Duplicate tier"
          onClick={() => actions.duplicateTier(tier.id)}
          className="hidden sm:inline-flex"
        >
          <Copy className="size-4" />
        </IconButton>
        <IconButton
          size="sm"
          label="Delete tier"
          className="hover:text-danger"
          onClick={() => (tier.itemIds.length ? setConfirming(true) : actions.deleteTier(tier.id))}
        >
          <Trash2 className="size-4" />
        </IconButton>
      </div>
      {confirming && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2 px-1 text-sm"
          role="alertdialog"
          aria-label={`Delete ${tier.name}`}
        >
          <span className="mr-auto">
            {tier.itemIds.length} item{tier.itemIds.length === 1 ? '' : 's'} in {tier.name}.
          </span>
          <Button size="sm" variant="primary" onClick={() => actions.deleteTier(tier.id, 'unrank')}>
            Move to Unranked
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            onClick={() => actions.deleteTier(tier.id, 'delete-items')}
          >
            Delete items too
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      )}
    </li>
  );
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const mode = useBoardStore((state) => state.mode);
  const [tab, setTab] = useState<Tab>('tiers');
  const [recolor, setRecolor] = useState(true);
  const colorScheme = usePrefsStore((state) => state.colorScheme);
  const setColorScheme = usePrefsStore((state) => state.setColorScheme);
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(false);

  return (
    <Dialog open onClose={onClose} title="Board settings" size="lg">
      <div className="mb-5 max-w-sm">
        <Segmented
          label="Section"
          hideLabel
          value={tab}
          onChange={setTab}
          options={[
            { value: 'tiers', label: 'Tiers' },
            { value: 'look', label: 'Look' },
            { value: 'board', label: 'Board' },
          ]}
        />
      </div>

      {tab === 'tiers' && (
        <div className="space-y-5">
          <ul className="space-y-1.5">
            {board.tiers.map((tier, index) => (
              <TierLine key={tier.id} tier={tier} index={index} count={board.tiers.length} />
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Plus className="size-4" />} onClick={() => actions.addTier()}>
              Add tier
            </Button>
            <Button
              variant="ghost"
              icon={<RotateCcw className="size-4" />}
              onClick={actions.resetTiers}
            >
              Reset to S / A / B / C / D / F
            </Button>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Presets</h3>
            <p className="mb-2 text-xs text-muted">
              Items keep their position: the top tier stays the top tier.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => actions.applyPreset(preset)}
                  className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-sm ring-1 ring-line ring-inset hover:bg-surface-2"
                >
                  <span className="flex -space-x-1">
                    {preset.tiers.map((t) => (
                      <span
                        key={t.name}
                        className="size-3 rounded-full ring-2 ring-surface"
                        style={{ background: t.color }}
                      />
                    ))}
                  </span>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'look' && (
        <div className="space-y-6">
          <div className="max-w-sm">
            <Segmented<ColorScheme>
              label="App appearance"
              value={colorScheme}
              onChange={setColorScheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted">Board theme</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BOARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={board.settings.theme === theme.id}
                  onClick={() => actions.setBoardTheme(theme.id, recolor)}
                  className={cn(
                    'rounded-[12px] p-2.5 text-left ring-1 ring-line ring-inset transition-colors hover:bg-surface-2',
                    board.settings.theme === theme.id && 'bg-accent-soft ring-2 ring-accent',
                  )}
                >
                  <span className="mb-2 flex h-6 overflow-hidden rounded-[6px]">
                    {theme.swatch.map((color) => (
                      <span key={color} className="flex-1" style={{ background: color }} />
                    ))}
                  </span>
                  <span className="block text-sm font-semibold">{theme.name}</span>
                  <span className="block text-xs text-muted">{theme.description}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Toggle label="Use the theme’s tier colors" checked={recolor} onChange={setRecolor} />
            </div>
          </div>
          <div className="max-w-sm space-y-3">
            <Segmented
              label="Item size"
              value={board.settings.itemSize}
              onChange={(itemSize) => actions.updateSettings({ itemSize })}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
            <Toggle
              label="Show item counts on tiers"
              checked={board.settings.showCounts}
              onChange={(showCounts) => actions.updateSettings({ showCounts })}
            />
            <Toggle
              label="“Made with Tierboard” on exports"
              checked={board.settings.showBranding}
              onChange={(showBranding) => actions.updateSettings({ showBranding })}
            />
          </div>
        </div>
      )}

      {tab === 'board' && (
        <div className="space-y-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Description (shown on exports)
            </span>
            <textarea
              value={board.description ?? ''}
              rows={2}
              maxLength={300}
              placeholder="Friday lunch crew, September 2026"
              onChange={(event) =>
                actions.replaceBoard({ ...board, description: event.target.value || undefined })
              }
              className="w-full rounded-[10px] bg-surface-2 px-3 py-2 text-sm ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Reset</h3>
            <div className="flex flex-wrap gap-2">
              <Button icon={<RotateCcw className="size-4" />} onClick={actions.clearRankings}>
                Clear rankings
              </Button>
              <Button
                variant="ghost"
                className="text-danger"
                icon={<Trash2 className="size-4" />}
                onClick={actions.deleteAllItems}
              >
                Delete all items
              </Button>
            </div>
            <p className="text-xs text-muted">
              Clear rankings moves everything back to Unranked. Delete all items removes them. Both
              can be undone.
            </p>
          </div>
          {mode === 'saved' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Delete board</h3>
              {!confirmDeleteBoard ? (
                <Button
                  variant="ghost"
                  className="text-danger"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => setConfirmDeleteBoard(true)}
                >
                  Delete this board…
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-danger/10 p-3 text-sm">
                  <span className="mr-auto">
                    Delete “{board.title}” from this device? This can’t be undone.
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      await getRepository().remove(board.id);
                      onClose();
                      navigate(routes.home());
                      toast({ message: `Deleted “${board.title}”` });
                    }}
                  >
                    Delete board
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteBoard(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

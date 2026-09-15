import { ChevronDown, Copy, ExternalLink, Flame, ImagePlus, Trash2, Vote, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Popover } from '@/components/ui/Popover';
import { saveLocalImage } from '@/features/persistence/imageStore';
import { actions } from '@/features/ranking/actions';
import { findItemContainer } from '@/features/ranking/boardOps';
import { TIER_SWATCHES } from '@/features/ranking/presets';
import { readableText } from '@/lib/color';
import { cn } from '@/lib/cn';
import { UNRANKED_ID, type RankItem, type TierBoard } from '@/models/board';
import { useBoard } from '@/stores/boardStore';
import { toast, useUiStore } from '@/stores/uiStore';
import { ItemThumb } from './ItemChip';

const QUICK_EMOJI = ['🍕', '🍔', '🌮', '🍣', '☕', '🍩', '🎬', '🎮', '🎵', '🏈', '🚗', '⭐'];

const fieldClass =
  'h-9 w-full rounded-[9px] bg-surface-2 px-2.5 text-sm ring-1 ring-line outline-none ring-inset placeholder:text-muted/80 focus:ring-2 focus:ring-accent';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Tier buttons for tap-to-rank. Shared by the editor and other dialogs. */
export function MoveToTiers({
  board,
  itemId,
  onMoved,
  size = 'md',
}: {
  board: TierBoard;
  itemId: string;
  onMoved?: () => void;
  size?: 'md' | 'lg';
}) {
  const current = findItemContainer(board, itemId);
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move to tier">
      {board.tiers.map((tier, index) => (
        <button
          key={tier.id}
          type="button"
          aria-pressed={current === tier.id}
          onClick={() => {
            actions.moveItem(itemId, tier.id);
            onMoved?.();
          }}
          style={{ background: tier.color, color: readableText(tier.color) }}
          className={cn(
            'relative flex items-center justify-center rounded-[10px] px-2 font-display font-extrabold transition-transform active:scale-95',
            size === 'lg' ? 'h-14 min-w-14 text-xl' : 'h-11 min-w-11 text-base',
            current === tier.id && 'ring-2 ring-text ring-offset-2 ring-offset-surface',
          )}
          title={index < 9 ? `${tier.name} (${index + 1})` : tier.name}
        >
          <span className="max-w-24 truncate">{tier.name || '—'}</span>
        </button>
      ))}
      <button
        type="button"
        aria-pressed={current === UNRANKED_ID}
        onClick={() => {
          actions.moveItem(itemId, UNRANKED_ID);
          onMoved?.();
        }}
        className={cn(
          'rounded-[10px] px-3 text-sm font-medium text-muted ring-1 ring-line ring-inset hover:text-text',
          size === 'lg' ? 'h-14' : 'h-11',
          current === UNRANKED_ID && 'bg-sunken text-text',
        )}
        title="Unranked (0)"
      >
        Unranked
      </button>
    </div>
  );
}

function ImageField({ item }: { item: RankItem }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isUrl = !!item.image && /^https?:/i.test(item.image);
  return (
    <Field label="Image">
      <div className="flex gap-1.5">
        <input
          className={fieldClass}
          placeholder={item.image && !isUrl ? 'Uploaded image' : 'Paste an image URL'}
          value={isUrl ? item.image : ''}
          onChange={(event) =>
            actions.updateItem(item.id, { image: event.target.value.trim() }, 'image')
          }
          inputMode="url"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-sm ring-1 ring-line ring-inset hover:bg-surface-2"
        >
          <ImagePlus className="size-4" /> Upload
        </button>
        {item.image && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => actions.updateItem(item.id, { image: '' })}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] text-muted ring-1 ring-line ring-inset hover:text-danger"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          try {
            actions.updateItem(item.id, { image: await saveLocalImage(file) });
          } catch (error) {
            toast({ message: (error as Error).message, tone: 'error' });
          }
        }}
      />
    </Field>
  );
}

function ItemEditor({
  item,
  board,
  anchor,
}: {
  item: RankItem;
  board: TierBoard;
  anchor: Parameters<typeof Popover>[0]['anchor'];
}) {
  const close = () => useUiStore.getState().openEditor(null);
  const hasDetails = !!(item.subtitle || item.image || item.notes || item.url || item.accent);
  const [showDetails, setShowDetails] = useState(hasDetails);

  return (
    <Popover anchor={anchor} onClose={close} label={`Edit ${item.name}`} width={372}>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-2 ring-1 ring-line ring-inset">
            {item.image || item.emoji ? (
              <ItemThumb item={item} className="size-11" />
            ) : (
              <span className="text-lg text-muted">?</span>
            )}
          </div>
          <input
            data-autofocus
            aria-label="Name"
            value={item.name}
            maxLength={120}
            onChange={(event) =>
              actions.updateItem(item.id, { name: event.target.value || item.name }, 'name')
            }
            onKeyDown={(event) => event.key === 'Enter' && close()}
            className="h-11 min-w-0 flex-1 rounded-[10px] bg-surface-2 px-3 font-display text-lg font-bold ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Move to</span>
          <MoveToTiers board={board} itemId={item.id} onMoved={close} />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <EditorAction
            label={item.hotTake ? 'Hot take' : 'Hot take?'}
            active={item.hotTake}
            icon={<Flame className="size-4" />}
            onClick={() => actions.updateItem(item.id, { hotTake: !item.hotTake })}
          />
          <EditorAction
            label="Vote"
            icon={<Vote className="size-4" />}
            onClick={() => useUiStore.getState().openDialog('vote', item.id)}
          />
          <EditorAction
            label="Duplicate"
            icon={<Copy className="size-4" />}
            onClick={() => actions.duplicateItem(item.id)}
          />
          <EditorAction
            label="Delete"
            danger
            icon={<Trash2 className="size-4" />}
            onClick={() => actions.deleteItem(item.id)}
          />
        </div>

        {item.hotTake && (
          <Field label="Why is this a hot take? (optional)">
            <input
              className={fieldClass}
              placeholder="Their pan pizza is ridiculously underrated."
              value={item.hotTakeNote ?? ''}
              maxLength={200}
              onChange={(event) =>
                actions.updateItem(item.id, { hotTakeNote: event.target.value }, 'hotTakeNote')
              }
            />
          </Field>
        )}

        <div>
          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center gap-1 text-sm font-medium text-muted hover:text-text"
          >
            <ChevronDown
              className={cn('size-4 transition-transform', !showDetails && '-rotate-90')}
            />
            Emoji, image, notes and more
          </button>
          {showDetails && (
            <div className="mt-3 space-y-3">
              <Field label="Emoji">
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    className={cn(fieldClass, 'w-14 text-center text-lg')}
                    value={item.emoji ?? ''}
                    maxLength={8}
                    aria-label="Emoji"
                    onChange={(event) =>
                      actions.updateItem(item.id, { emoji: event.target.value.trim() }, 'emoji')
                    }
                  />
                  {QUICK_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Use ${emoji}`}
                      onClick={() =>
                        actions.updateItem(item.id, { emoji: item.emoji === emoji ? '' : emoji })
                      }
                      className={cn(
                        'size-8 rounded-[8px] text-lg hover:bg-surface-2',
                        item.emoji === emoji && 'bg-accent-soft',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Subtitle">
                <input
                  className={fieldClass}
                  value={item.subtitle ?? ''}
                  maxLength={120}
                  placeholder="Downtown, since 1987…"
                  onChange={(event) =>
                    actions.updateItem(item.id, { subtitle: event.target.value }, 'subtitle')
                  }
                />
              </Field>
              <ImageField item={item} />
              <Field label="Notes">
                <textarea
                  className={cn(fieldClass, 'h-auto min-h-16 py-2')}
                  rows={2}
                  value={item.notes ?? ''}
                  maxLength={1000}
                  onChange={(event) =>
                    actions.updateItem(item.id, { notes: event.target.value }, 'notes')
                  }
                />
              </Field>
              <Field label="Link">
                <div className="flex gap-1.5">
                  <input
                    className={fieldClass}
                    value={item.url ?? ''}
                    inputMode="url"
                    placeholder="https://"
                    onChange={(event) =>
                      actions.updateItem(item.id, { url: event.target.value.trim() }, 'url')
                    }
                  />
                  {item.url && /^https?:\/\//.test(item.url) && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Open link"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] ring-1 ring-line ring-inset hover:bg-surface-2"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </Field>
              <fieldset>
                <legend className="mb-1 text-xs font-medium text-muted">Accent</legend>
                <div className="flex flex-wrap gap-1.5">
                  {TIER_SWATCHES.slice(0, 9).map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Accent ${color}`}
                      aria-pressed={item.accent === color}
                      onClick={() =>
                        actions.updateItem(item.id, { accent: item.accent === color ? '' : color })
                      }
                      className={cn(
                        'size-6 rounded-full',
                        item.accent === color &&
                          'ring-2 ring-text ring-offset-2 ring-offset-surface',
                      )}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>
      </div>
    </Popover>
  );
}

function EditorAction({
  label,
  icon,
  onClick,
  danger,
  active,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-14 flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-medium ring-1 ring-line ring-inset transition-colors hover:bg-surface-2',
        danger && 'text-danger',
        active && 'bg-[#ff6b3d]/12 text-[#e0531f] ring-[#ff6b3d]/40 dark:text-[#ff8a5c]',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Renders the editor for whichever item the UI store points at. */
export function ItemEditorHost() {
  const editor = useUiStore((state) => state.editor);
  const board = useBoard();
  const item = editor && board ? board.items[editor.itemId] : undefined;
  if (!editor || !board || !item) return null;
  return <ItemEditor key={item.id} item={item} board={board} anchor={editor.anchor} />;
}

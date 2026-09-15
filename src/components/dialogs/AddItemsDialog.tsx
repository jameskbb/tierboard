import { CornerDownLeft, X } from 'lucide-react';
import { useMemo, useRef, useState, type ClipboardEvent } from 'react';
import { ItemThumb } from '@/components/items/ItemChip';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { dedupeDrafts, parseItems } from '@/features/importing/parseItems';
import { actions } from '@/features/ranking/actions';
import type { ItemDraft } from '@/features/ranking/boardOps';
import type { RankItem } from '@/models/board';
import { getBoard, useBoard } from '@/stores/boardStore';
import { usePrefsStore } from '@/stores/prefsStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The fastest path into a board: type + Enter, over and over, or paste a list.
 * Multi-line pastes are added instantly; commas split a single line.
 */
export function AddItemsDialog({ open, onClose }: Props) {
  const board = useBoard();
  const [text, setText] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<ItemDraft[]>([]);
  const skipDuplicates = usePrefsStore((state) => state.skipDuplicates);
  const setSkipDuplicates = usePrefsStore((state) => state.setSkipDuplicates);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const preview = useMemo(() => parseItems(text), [text]);

  const add = (drafts: ItemDraft[], force = false) => {
    const current = getBoard();
    if (!current || drafts.length === 0) return;
    const existing = Object.values(current.items).map((item) => item.name);
    const { unique, duplicates } =
      skipDuplicates && !force
        ? dedupeDrafts(drafts, existing)
        : { unique: drafts, duplicates: [] };
    const created = actions.addItems(unique);
    setAdded((ids) => [...created.map((item) => item.id).reverse(), ...ids]);
    setSkipped(duplicates);
    setText('');
    inputRef.current?.focus();
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!/\n/.test(pasted.trim())) return; // single line: let it land in the box
    event.preventDefault();
    add(parseItems(`${text}\n${pasted}`));
  };

  const close = () => {
    setAdded([]);
    setSkipped([]);
    setText('');
    onClose();
  };

  const recent = added.map((id) => board?.items[id]).filter((item): item is RankItem => !!item);

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add items"
      description="Type a name and press Enter. Paste a list to add it all at once."
      footer={
        <>
          <label className="mr-auto flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(event) => setSkipDuplicates(event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Skip duplicates
          </label>
          <Button variant="primary" onClick={close}>
            {recent.length ? `Done — ${recent.length} added` : 'Done'}
          </Button>
        </>
      }
    >
      <div className="relative">
        <textarea
          ref={inputRef}
          data-autofocus
          rows={Math.min(6, Math.max(1, text.split('\n').length))}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onPaste={onPaste}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              add(preview);
            }
          }}
          placeholder={recent.length ? 'Next one…' : 'Capital Pizza'}
          aria-label="Item names"
          enterKeyHint="enter"
          autoCapitalize="words"
          className="block w-full resize-none rounded-[12px] bg-surface-2 py-3 pr-24 pl-4 font-display text-xl font-semibold ring-1 ring-line outline-none ring-inset placeholder:font-normal placeholder:text-muted/70 focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => add(preview)}
          disabled={preview.length === 0}
          className="absolute top-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-accent px-3 text-sm font-semibold text-accent-ink disabled:opacity-35"
        >
          <CornerDownLeft className="size-4" />
          {preview.length > 1 ? `Add ${preview.length}` : 'Add'}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted">
        {preview.length > 1 ? (
          `Enter adds ${preview.length} items.`
        ) : (
          <>
            Tip: start with an emoji (<span className="whitespace-nowrap">🍕 Capital Pizza</span>)
            or add a subtitle with “ | ”. <Kbd>Esc</Kbd> when you’re done.
          </>
        )}
      </p>

      {skipped.length > 0 && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-2 text-sm"
          role="status"
        >
          <span className="min-w-0 flex-1">
            Skipped {skipped.length} already on the board: {skipped.map((d) => d.name).join(', ')}
          </span>
          <Button size="sm" variant="ghost" onClick={() => add(skipped, true)}>
            Add anyway
          </Button>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-muted">Added to Unranked</div>
          <ul className="flex flex-wrap gap-1.5">
            {recent.map((item) => (
              <li
                key={item.id}
                className="flex animate-rise items-center gap-1.5 rounded-[9px] bg-surface-2 py-1 pr-1 pl-2 text-sm ring-1 ring-line ring-inset"
              >
                <ItemThumb item={item} className="size-5 text-sm" />
                <span className="max-w-48 truncate">{item.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => {
                    actions.deleteItem(item.id);
                    setAdded((ids) => ids.filter((id) => id !== item.id));
                  }}
                  className="rounded-[6px] p-0.5 text-muted hover:bg-sunken hover:text-text"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}

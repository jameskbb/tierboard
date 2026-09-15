import { FileJson, FileUp, ListPlus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { parseBoardFile } from '@/features/exporting/boardFile';
import { csvToDrafts } from '@/features/exporting/csv';
import { dedupeDrafts } from '@/features/importing/parseItems';
import { openImportedBoard } from '@/features/persistence/boardLibrary';
import { internalizeDataImages } from '@/features/persistence/imageStore';
import { actions } from '@/features/ranking/actions';
import { getBoard, useBoard } from '@/stores/boardStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { toast } from '@/stores/uiStore';

type Tab = 'items' | 'board';

/** Import a list/CSV into Unranked, or a Tierboard JSON file as a new board. */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard();
  const [tab, setTab] = useState<Tab>('items');
  const [text, setText] = useState('');
  const skipDuplicates = usePrefsStore((state) => state.skipDuplicates);
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const drafts = useMemo(() => csvToDrafts(text), [text]);
  const existing = board ? Object.values(board.items).map((item) => item.name) : [];
  const { unique, duplicates } = skipDuplicates
    ? dedupeDrafts(drafts, existing)
    : { unique: drafts, duplicates: [] };

  const importItems = () => {
    if (!getBoard()) return;
    const added = actions.addItems(unique);
    toast({
      message: `Added ${added.length} item${added.length === 1 ? '' : 's'} to Unranked`,
      tone: 'success',
    });
    onClose();
  };

  const importBoard = async (file: File) => {
    try {
      const imported = await internalizeDataImages(parseBoardFile(await file.text()));
      onClose();
      await openImportedBoard(imported);
      toast({ message: `Imported “${imported.title}”`, tone: 'success' });
    } catch (error) {
      toast({ message: (error as Error).message, tone: 'error' });
    }
  };

  return (
    <Dialog open onClose={onClose} title="Import" size="md">
      <div className="mb-4">
        <Segmented<Tab>
          label="Import type"
          hideLabel
          value={board ? tab : 'board'}
          onChange={setTab}
          options={[
            ...(board ? [{ value: 'items' as const, label: 'Items (text or CSV)' }] : []),
            { value: 'board', label: 'Board file (.json)' },
          ]}
        />
      </div>

      {board && tab === 'items' ? (
        <div className="space-y-3">
          <textarea
            data-autofocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={7}
            placeholder={
              'Paste a list or CSV.\nA header row with “name” or “item” also picks up subtitle, emoji, notes, url and image columns.'
            }
            className="w-full rounded-[12px] bg-surface-2 px-3 py-2.5 font-mono text-sm ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              icon={<FileUp className="size-4" />}
              onClick={() => csvRef.current?.click()}
            >
              Choose a .csv or .txt file
            </Button>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setText(await file.text());
                event.target.value = '';
              }}
            />
            <span className="ml-auto text-sm text-muted">
              {unique.length} new
              {duplicates.length ? `, ${duplicates.length} already on the board` : ''}
            </span>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<ListPlus className="size-4" />}
              disabled={unique.length === 0}
              onClick={importItems}
            >
              Add {unique.length || ''} to Unranked
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Opens a Tierboard board file as a new board. Your current boards are not changed.
          </p>
          <Button
            variant="primary"
            icon={<FileJson className="size-4" />}
            onClick={() => jsonRef.current?.click()}
            data-autofocus
          >
            Choose a board file
          </Button>
          <input
            ref={jsonRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void importBoard(file);
            }}
          />
        </div>
      )}
    </Dialog>
  );
}

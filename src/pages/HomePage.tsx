import {
  ArrowRight,
  Copy,
  FileUp,
  Keyboard,
  MoonStar,
  MoreHorizontal,
  Pencil,
  Sun,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GithubMark as Github, Logo } from '@/components/layout/Logo';
import { ImportDialog } from '@/components/dialogs/ImportDialog';
import { Button, IconButton } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Menu } from '@/components/ui/Menu';
import {
  createFromTemplate,
  createNewBoard,
  duplicateBoard,
  renameBoard,
} from '@/features/persistence/boardLibrary';
import { getRepository } from '@/features/persistence/boardRepository';
import { TEMPLATES } from '@/features/templates/templates';
import { routes } from '@/lib/router';
import type { BoardSummary, TierBoard } from '@/models/board';
import { usePrefsStore } from '@/stores/prefsStore';
import { toast } from '@/stores/uiStore';

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return format.format(-Math.round(seconds / 60), 'minute');
  if (seconds < 86400) return format.format(-Math.round(seconds / 3600), 'hour');
  if (seconds < 86400 * 30) return format.format(-Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString();
}

/** A tiny rendition of the board's tiers: color stubs with item-count bars. */
function MiniBoard({ preview }: { preview: BoardSummary['preview'] }) {
  const max = Math.max(4, ...preview.map((tier) => tier.count));
  return (
    <div className="flex flex-col gap-[3px]" aria-hidden>
      {preview.slice(0, 7).map((tier, index) => (
        <div key={index} className="flex h-2.5 items-center gap-1">
          <span className="h-full w-4 rounded-[3px]" style={{ background: tier.color }} />
          <span
            className="h-1.5 rounded-full bg-line"
            style={{ width: `${(tier.count / max) * 100}%`, minWidth: tier.count ? 6 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

function BoardCard({ board, onChanged }: { board: BoardSummary; onChanged: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(board.title);

  const remove = async () => {
    const snapshot = (await getRepository().load(board.id)) as TierBoard | null;
    await getRepository().remove(board.id);
    onChanged();
    toast({
      message: `Deleted “${board.title}”`,
      action: snapshot
        ? {
            label: 'Undo',
            run: () => void getRepository().save(snapshot).then(onChanged),
          }
        : undefined,
    });
  };

  return (
    <li className="group relative flex flex-col rounded-[16px] bg-surface p-4 ring-1 ring-line/70 transition-shadow ring-inset focus-within:ring-2 focus-within:ring-accent hover:shadow-lift">
      <MiniBoard preview={board.preview} />
      {renaming ? (
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={async () => {
            setRenaming(false);
            await renameBoard(board.id, title);
            onChanged();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setTitle(board.title);
              setRenaming(false);
            }
          }}
          aria-label="Board title"
          className="mt-4 rounded-[8px] bg-surface-2 px-2 py-1 font-display text-lg font-bold outline-none ring-2 ring-accent"
        />
      ) : (
        <a
          href={routes.board(board.id)}
          className="mt-4 font-display text-lg leading-tight font-bold tracking-tight outline-none after:absolute after:inset-0 after:rounded-[16px]"
        >
          {board.title}
        </a>
      )}
      <p className="mt-1 text-sm text-muted">
        {board.itemCount === 0
          ? 'No items yet'
          : `${board.rankedCount} of ${board.itemCount} ranked`}
        <span className="mx-1.5 opacity-50">/</span>
        {timeAgo(board.updatedAt)}
      </p>
      <div className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <Menu
          items={[
            { label: 'Rename', icon: <Pencil />, onSelect: () => setRenaming(true) },
            {
              label: 'Duplicate',
              icon: <Copy />,
              onSelect: () => void duplicateBoard(board.id).then(onChanged),
            },
            { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => void remove() },
          ]}
          trigger={(props) => (
            <IconButton label={`Options for ${board.title}`} size="sm" {...props}>
              <MoreHorizontal className="size-4" />
            </IconButton>
          )}
        />
      </div>
    </li>
  );
}

const SAMPLE_ROWS: [string, string, string[]][] = [
  ['S', '#FF7B72', ['🍕 Capital Pizza', 'One Guy']],
  ['A', '#FFA657', ["Papa V's", 'Pizza Hut']],
  ['B', '#F6D55C', ["Domino's 🔥"]],
  ['F', '#C49BFF', ['Little Caesars']],
];

/** Static illustration of the product, beside the create box. */
function SampleBoard() {
  return (
    <div
      className="hidden rotate-[1.5deg] flex-col gap-1.5 rounded-[18px] bg-surface p-3 shadow-lift lg:flex"
      aria-hidden
    >
      {SAMPLE_ROWS.map(([name, color, items]) => (
        <div
          key={name}
          className="flex h-14 items-stretch overflow-hidden rounded-[12px] bg-surface-2"
        >
          <span
            className="flex w-14 items-center justify-center font-display text-2xl font-extrabold text-[#1b1e27]"
            style={{ background: color }}
          >
            {name}
          </span>
          <span className="flex items-center gap-1.5 px-2">
            {items.map((item) => (
              <span
                key={item}
                className="rounded-[9px] bg-surface px-2.5 py-2 text-sm font-medium whitespace-nowrap ring-1 ring-line ring-inset"
              >
                {item}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [title, setTitle] = useState('');
  const [importing, setImporting] = useState(false);
  const colorScheme = usePrefsStore((state) => state.colorScheme);
  const setColorScheme = usePrefsStore((state) => state.setColorScheme);

  const refresh = useCallback(() => {
    void getRepository().list().then(setBoards);
  }, []);
  useEffect(() => {
    refresh();
    document.title = 'Tierboard';
    return getRepository().subscribe(refresh);
  }, [refresh]);

  const isDark =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<FileUp className="size-4" />}
            onClick={() => setImporting(true)}
          >
            Import
          </Button>
          <IconButton
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <Sun className="size-[18px]" /> : <MoonStar className="size-[18px]" />}
          </IconButton>
          <a
            href="https://github.com/jameskbb/tierboard"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Tierboard on GitHub"
            title="Source on GitHub"
            className="inline-flex size-10 items-center justify-center rounded-[10px] text-muted hover:bg-sunken/70 hover:text-text"
          >
            <Github className="size-[18px]" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="grid grid-cols-1 items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <h1 className="max-w-xl font-display text-[2.6rem] leading-[0.98] font-extrabold tracking-[-0.035em] sm:text-6xl">
              What are we ranking today?
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">
              Name it, paste the list, start dragging. No sign-up, and it works on the TV in the
              conference room.
            </p>
            <form
              className="mt-8 flex max-w-lg gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void createNewBoard(title);
              }}
            >
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Lubbock Pizza"
                aria-label="Board name"
                maxLength={120}
                className="h-14 min-w-0 flex-1 rounded-[14px] bg-surface px-4 font-display text-xl font-semibold ring-1 ring-line outline-none ring-inset placeholder:font-normal placeholder:text-muted/60 focus:ring-2 focus:ring-accent"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="h-14 rounded-[14px] px-5"
                icon={<ArrowRight className="size-5" />}
              >
                Start
              </Button>
            </form>
            <div className="mt-6">
              <div className="mb-2 text-sm text-muted">Or start from</div>
              <ul className="flex max-w-xl flex-wrap gap-1.5">
                {TEMPLATES.map((template) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => void createFromTemplate(template)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm ring-1 ring-line ring-inset transition-colors hover:bg-surface-2 hover:ring-text/30"
                    >
                      <span aria-hidden>{template.emoji}</span>
                      {template.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SampleBoard />
        </section>

        {boards && boards.length > 0 && (
          <section aria-labelledby="your-boards">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 id="your-boards" className="font-display text-2xl font-bold tracking-tight">
                Your boards
              </h2>
              <span className="text-sm text-muted">Saved in this browser</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} onChanged={refresh} />
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-20 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Keyboard className="size-4" /> Press <Kbd>?</Kbd> on a board for shortcuts
          </span>
          <span>Boards stay on your device. Share links carry the board inside the URL.</span>
        </footer>
      </main>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}

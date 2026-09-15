import {
  ArrowDownAZ,
  BarChart3,
  Dices,
  Download,
  FilePlus2,
  FileUp,
  GitCompareArrows,
  Home,
  Keyboard,
  ListPlus,
  MoonStar,
  Plus,
  Presentation,
  Redo2,
  RotateCcw,
  Scale,
  Search,
  Settings,
  Share2,
  Shuffle,
  Swords,
  Undo2,
  Vote,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { revealItem } from '@/components/layout/SearchBox';
import { Kbd } from '@/components/ui/Kbd';
import { togglePresenting } from '@/features/group/presentation';
import { createNewBoard } from '@/features/persistence/boardLibrary';
import { actions } from '@/features/ranking/actions';
import { findItemContainer } from '@/features/ranking/boardOps';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/cn';
import { navigate, routes } from '@/lib/router';
import { UNRANKED_ID } from '@/models/board';
import { useBoard } from '@/stores/boardStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { useUiStore, type DialogId } from '@/stores/uiStore';

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
  keywords?: string;
  shortcut?: string;
  hint?: string;
}

/** Cmd/Ctrl+K: every action and every item, one fuzzy box away. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  const open = (dialog: DialogId) => () => useUiStore.getState().openDialog(dialog);
  const later = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const commands: Command[] = useMemo(
    () => [
      { id: 'add', label: 'Add items', icon: ListPlus, run: open('add-items'), shortcut: 'N' },
      { id: 'tier', label: 'Add tier', icon: Plus, run: later(() => actions.addTier()) },
      { id: 'quick', label: 'Quick rank', icon: Zap, run: open('quick-rank'), shortcut: 'Q' },
      {
        id: 'random',
        label: 'Pick a random item',
        icon: Dices,
        run: open('random'),
        shortcut: 'R',
      },
      {
        id: 'present',
        label: 'Presentation mode',
        icon: Presentation,
        run: later(togglePresenting),
        shortcut: 'F',
        keywords: 'fullscreen group tv',
      },
      { id: 'vote', label: 'Vote on an item', icon: Vote, run: open('vote'), shortcut: 'V' },
      {
        id: 'compare',
        label: 'Compare two at a time',
        icon: GitCompareArrows,
        run: open('compare'),
        keywords: 'pairwise which is better',
      },
      { id: 'debate', label: 'Random debate', icon: Swords, run: open('debate'), shortcut: 'D' },
      { id: 'tiebreak', label: 'Tie breaker', icon: Scale, run: open('tie-breaker') },
      { id: 'share', label: 'Copy share link', icon: Share2, run: open('share') },
      {
        id: 'export',
        label: 'Export image',
        icon: Download,
        run: open('export'),
        keywords: 'png json csv download copy',
      },
      { id: 'import', label: 'Import items or board', icon: FileUp, run: open('import') },
      { id: 'stats', label: 'Stats', icon: BarChart3, run: open('stats') },
      {
        id: 'shuffle',
        label: 'Shuffle Unranked',
        icon: Shuffle,
        run: later(() => actions.sortContainer(UNRANKED_ID, 'shuffle')),
      },
      {
        id: 'sort',
        label: 'Sort Unranked A–Z',
        icon: ArrowDownAZ,
        run: later(() => actions.sortContainer(UNRANKED_ID, 'az')),
      },
      {
        id: 'clear',
        label: 'Clear rankings',
        icon: RotateCcw,
        run: later(actions.clearRankings),
        keywords: 'reset unrank',
      },
      { id: 'undo', label: 'Undo', icon: Undo2, run: later(actions.undo) },
      { id: 'redo', label: 'Redo', icon: Redo2, run: later(actions.redo) },
      {
        id: 'theme',
        label: 'Toggle light / dark',
        icon: MoonStar,
        run: later(() => {
          const prefs = usePrefsStore.getState();
          prefs.setColorScheme(
            document.documentElement.classList.contains('dark') ? 'light' : 'dark',
          );
        }),
        keywords: 'theme appearance',
      },
      {
        id: 'settings',
        label: 'Board settings',
        icon: Settings,
        run: open('settings'),
        keywords: 'tiers colors presets theme',
      },
      { id: 'new', label: 'New board', icon: FilePlus2, run: later(() => void createNewBoard()) },
      { id: 'home', label: 'All boards', icon: Home, run: later(() => navigate(routes.home())) },
      {
        id: 'keys',
        label: 'Keyboard shortcuts',
        icon: Keyboard,
        run: open('shortcuts'),
        shortcut: '?',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = commands.filter(
      (c) => !q || `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q),
    );
    const items: Command[] = q
      ? Object.values(board.items)
          .filter((item) =>
            [item.name, item.subtitle, item.notes].some((field) =>
              field?.toLowerCase().includes(q),
            ),
          )
          .slice(0, 6)
          .map((item) => {
            const container = findItemContainer(board, item.id);
            const tier = board.tiers.find((t) => t.id === container);
            return {
              id: `item:${item.id}`,
              label: item.name,
              icon: Search,
              hint: tier ? `${tier.name} tier` : 'Unranked',
              run: later(() => revealItem(item.id)),
            };
          })
      : [];
    return [...matched, ...items];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, commands, board]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    command.run();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12dvh]">
      <div
        className="absolute inset-0 animate-fade bg-[#0b0d12]/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl animate-rise overflow-hidden rounded-[var(--radius-panel)] bg-surface shadow-panel"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            data-autofocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                run(results[active]);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Type a command or an item name"
            aria-label="Command"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul
          id="palette-results"
          role="listbox"
          className="scrollbar-thin max-h-[52dvh] overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{query}”.</li>
          )}
          {results.map((command, index) => (
            <li key={command.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseMove={() => setActive(index)}
                onClick={() => run(command)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm',
                  index === active && 'bg-surface-2',
                )}
              >
                <command.icon className="size-4 text-muted" />
                <span className="flex-1">{command.label}</span>
                {command.hint && <span className="text-xs text-muted">{command.hint}</span>}
                {command.shortcut && <Kbd>{command.shortcut}</Kbd>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

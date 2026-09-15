import {
  BarChart3,
  Check,
  Dices,
  Download,
  FilePlus2,
  FileUp,
  GitCompareArrows,
  Keyboard,
  ListPlus,
  MoreHorizontal,
  Presentation,
  Redo2,
  RotateCcw,
  Scale,
  Search,
  Settings,
  Share2,
  Swords,
  Trash2,
  Undo2,
  Vote,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { MOD } from '@/components/ui/Kbd';
import { Menu, type MenuEntry } from '@/components/ui/Menu';
import { togglePresenting } from '@/features/group/presentation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { createNewBoard } from '@/features/persistence/boardLibrary';
import { actions } from '@/features/ranking/actions';
import { saveSharedBoard } from '@/features/sharing/saveShared';
import { navigate, routes } from '@/lib/router';
import type { TierBoard } from '@/models/board';
import { useBoardStore, useCanRedo, useCanUndo } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';
import { LogoMark } from './Logo';
import { SearchBox } from './SearchBox';

export function BoardHeader({ board }: { board: TierBoard }) {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const mode = useBoardStore((state) => state.mode);
  const openDialog = useUiStore((state) => state.openDialog);
  const [mobileSearch, setMobileSearch] = useState(false);
  const isPhone = useMediaQuery('(max-width: 639px)');
  const itemCount = Object.keys(board.items).length;

  // Actions that are header buttons on larger screens move into the menu on phones.
  const phoneItems: MenuEntry[] = [
    { label: 'Export', icon: <Download />, onSelect: () => openDialog('export') },
    { label: 'Board settings', icon: <Settings />, onSelect: () => openDialog('settings') },
    { label: 'Redo', icon: <Redo2 />, onSelect: actions.redo, disabled: !canRedo },
  ];

  const moreItems: MenuEntry[] = [
    { label: 'New board', icon: <FilePlus2 />, onSelect: () => void createNewBoard() },
    { label: 'Import items or board', icon: <FileUp />, onSelect: () => openDialog('import') },
    'separator',
    { heading: 'Rank together' },
    {
      label: 'Compare two at a time',
      icon: <GitCompareArrows />,
      onSelect: () => openDialog('compare'),
      disabled: itemCount < 2,
    },
    {
      label: 'Vote on an item',
      icon: <Vote />,
      onSelect: () => openDialog('vote'),
      shortcut: 'V',
      disabled: itemCount === 0,
    },
    {
      label: 'Random debate',
      icon: <Swords />,
      onSelect: () => openDialog('debate'),
      shortcut: 'D',
    },
    {
      label: 'Tie breaker',
      icon: <Scale />,
      onSelect: () => openDialog('tie-breaker'),
      disabled: itemCount < 2,
    },
    { label: 'Stats', icon: <BarChart3 />, onSelect: () => openDialog('stats') },
    'separator',
    {
      label: 'Clear rankings',
      icon: <RotateCcw />,
      onSelect: actions.clearRankings,
      disabled: itemCount === board.unrankedItemIds.length,
    },
    {
      label: 'Delete all items',
      icon: <Trash2 />,
      onSelect: actions.deleteAllItems,
      danger: true,
      disabled: itemCount === 0,
    },
    'separator',
    {
      label: 'Command palette',
      icon: <Search />,
      onSelect: () => openDialog('palette'),
      shortcut: `${MOD} K`,
    },
    {
      label: 'Keyboard shortcuts',
      icon: <Keyboard />,
      onSelect: () => openDialog('shortcuts'),
      shortcut: '?',
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-1 px-2 sm:gap-2 sm:px-6">
        <a
          href={routes.home()}
          aria-label="All boards"
          title="All boards"
          className="rounded-[10px] p-1.5 hover:bg-sunken/70"
          onClick={(event) => {
            event.preventDefault();
            navigate(routes.home());
          }}
        >
          <LogoMark />
        </a>

        <input
          aria-label="Board title"
          value={board.title}
          onChange={(event) => actions.renameBoard(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          onFocus={(event) => event.currentTarget.select()}
          maxLength={120}
          size={Math.max(8, Math.min(board.title.length + 1, 36))}
          className="h-9 w-0 min-w-0 flex-1 truncate rounded-[10px] sm:w-auto sm:flex-none bg-transparent px-2 font-display text-[17px] font-bold tracking-tight outline-none hover:bg-sunken/60 focus:bg-surface focus:ring-2 focus:ring-accent sm:max-w-none sm:text-lg"
        />

        {mode === 'saved' ? (
          <span
            className="hidden items-center gap-1 text-xs text-muted lg:inline-flex"
            title="Autosaved on this device"
          >
            <Check className="size-3.5" /> Saved
          </span>
        ) : (
          <Button size="sm" variant="soft" className="max-lg:hidden" onClick={saveSharedBoard}>
            Save to My Boards
          </Button>
        )}

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <div className="hidden md:block">
            <SearchBox board={board} />
          </div>
          <IconButton
            label="Search"
            className="md:hidden"
            onClick={() => setMobileSearch((v) => !v)}
            active={mobileSearch}
          >
            <Search className="size-[18px]" />
          </IconButton>

          <IconButton label={`Undo (${MOD} Z)`} onClick={actions.undo} disabled={!canUndo}>
            <Undo2 className="size-[18px]" />
          </IconButton>
          <IconButton
            label={`Redo (${MOD} Shift Z)`}
            onClick={actions.redo}
            disabled={!canRedo}
            className="max-sm:hidden"
          >
            <Redo2 className="size-[18px]" />
          </IconButton>

          <div className="mx-1 hidden h-6 w-px bg-line lg:block" aria-hidden />

          <Button
            variant="primary"
            size="sm"
            icon={<ListPlus className="size-4" />}
            onClick={() => openDialog('add-items')}
            className="h-9 max-sm:hidden"
          >
            Add items
          </Button>
          <IconButton
            label="Quick rank (Q)"
            onClick={() => openDialog('quick-rank')}
            className="max-lg:hidden"
            disabled={board.unrankedItemIds.length === 0}
          >
            <Zap className="size-[18px]" />
          </IconButton>
          <IconButton
            label="Pick a random item (R)"
            onClick={() => openDialog('random')}
            className="max-lg:hidden"
            disabled={board.unrankedItemIds.length === 0}
          >
            <Dices className="size-[18px]" />
          </IconButton>
          <IconButton
            label="Present to the room (F)"
            onClick={togglePresenting}
            className="max-sm:hidden"
          >
            <Presentation className="size-[18px]" />
          </IconButton>
          <Button
            size="sm"
            icon={<Share2 className="size-4" />}
            onClick={() => openDialog('share')}
            className="h-9 max-sm:hidden"
          >
            Share
          </Button>
          <IconButton label="Share" onClick={() => openDialog('share')} className="sm:hidden">
            <Share2 className="size-[18px]" />
          </IconButton>
          <IconButton
            label="Export image or file"
            onClick={() => openDialog('export')}
            className="max-sm:hidden"
          >
            <Download className="size-[18px]" />
          </IconButton>
          <IconButton
            label="Board settings"
            onClick={() => openDialog('settings')}
            className="max-sm:hidden"
          >
            <Settings className="size-[18px]" />
          </IconButton>
          <Menu
            items={isPhone ? [...phoneItems, 'separator', ...moreItems] : moreItems}
            trigger={(props) => (
              <IconButton label="More" {...props}>
                <MoreHorizontal className="size-[18px]" />
              </IconButton>
            )}
          />
        </div>
      </div>
      {mobileSearch && (
        <div className="border-t border-line/70 px-3 py-2 md:hidden">
          <SearchBox board={board} autoFocus onClose={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}

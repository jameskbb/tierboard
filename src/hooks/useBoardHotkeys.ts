import { SEARCH_INPUT_ID } from '@/components/layout/SearchBox';
import { setPresenting, togglePresenting } from '@/features/group/presentation';
import { actions } from '@/features/ranking/actions';
import { saveSharedBoard } from '@/features/sharing/saveShared';
import { getBoard, useBoardStore } from '@/stores/boardStore';
import { toast, useUiStore } from '@/stores/uiStore';
import { useHotkeys, type HotkeyMap } from './useHotkeys';

const ui = () => useUiStore.getState();

function rankSelected(position: number) {
  const { selectedItemId } = ui();
  const board = getBoard();
  if (!selectedItemId || !board?.items[selectedItemId]) return;
  if (position >= board.tiers.length) return;
  actions.rankItem(selectedItemId, position);
}

/** Board-screen keyboard shortcuts. See ShortcutsDialog for the list. */
export function useBoardHotkeys() {
  const dialogOpen = useUiStore((state) => state.dialog !== null);

  const map: HotkeyMap = {
    n: () => ui().openDialog('add-items'),
    a: () => ui().openDialog('add-items'),
    '/': () => {
      const input = document.getElementById(SEARCH_INPUT_ID);
      if (input && input.offsetParent !== null) input.focus();
      else ui().openDialog('palette');
    },
    'mod+z': actions.undo,
    'mod+shift+z': actions.redo,
    'mod+y': actions.redo,
    'mod+k': () => ui().openDialog('palette'),
    'mod+s': () => {
      if (useBoardStore.getState().mode === 'shared') void saveSharedBoard();
      else toast({ message: 'Tierboard saves automatically on this device.', tone: 'success' });
    },
    f: togglePresenting,
    r: () => ui().openDialog('random'),
    q: () => ui().openDialog('quick-rank'),
    v: () => ui().openDialog('vote', ui().selectedItemId),
    d: () => ui().openDialog('debate'),
    e: () => ui().openDialog('export'),
    '?': () => ui().openDialog('shortcuts'),
    '0': () => rankSelected(-1),
    u: () => rankSelected(-1),
    delete: () => {
      const id = ui().selectedItemId;
      if (id) actions.deleteItem(id);
    },
    backspace: () => {
      const id = ui().selectedItemId;
      if (id) actions.deleteItem(id);
    },
    escape: () => {
      if (ui().presenting) setPresenting(false);
      else if (ui().search) ui().setSearch('');
      else {
        ui().select(null);
        (document.activeElement as HTMLElement | null)?.blur();
      }
    },
  };
  for (let i = 1; i <= 9; i++) map[String(i)] = () => rankSelected(i - 1);

  // Undo/redo must keep working while the item editor popover is open.
  useHotkeys(map, !dialogOpen);
  useHotkeys(
    { 'mod+z': actions.undo, 'mod+shift+z': actions.redo },
    dialogOpen && ui().dialog !== 'add-items',
  );
}

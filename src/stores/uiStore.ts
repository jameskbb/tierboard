/**
 * Ephemeral UI state: which dialog is open, which item is selected, search,
 * presentation mode, toasts and small celebration moments. Never persisted.
 */
import { create } from 'zustand';
import { createId } from '@/lib/ids';

export type DialogId =
  | 'add-items'
  | 'share'
  | 'export'
  | 'settings'
  | 'shortcuts'
  | 'palette'
  | 'random'
  | 'debate'
  | 'tie-breaker'
  | 'vote'
  | 'compare'
  | 'stats'
  | 'import'
  | 'quick-rank';

export interface Toast {
  id: string;
  message: string;
  tone?: 'default' | 'success' | 'error';
  action?: { label: string; run: () => void };
  duration?: number;
}

export interface ItemEditorTarget {
  itemId: string;
  anchor: { top: number; left: number; bottom: number; right: number } | null;
}

export type Celebration = { kind: 'complete' } | { kind: 'glow-up'; itemId: string } | null;

interface UiState {
  dialog: DialogId | null;
  /** Item a dialog is focused on (vote, quick rank start, …). */
  dialogItemId: string | null;
  selectedItemId: string | null;
  editor: ItemEditorTarget | null;
  search: string;
  presenting: boolean;
  /** Item that just landed somewhere — drives the drop pop animation. */
  lastDrop: { itemId: string; at: number } | null;
  celebration: Celebration;
  toasts: Toast[];

  openDialog: (dialog: DialogId, itemId?: string | null) => void;
  closeDialog: () => void;
  select: (itemId: string | null) => void;
  openEditor: (target: ItemEditorTarget | null) => void;
  setSearch: (search: string) => void;
  setPresenting: (presenting: boolean) => void;
  markDropped: (itemId: string) => void;
  celebrate: (celebration: Celebration) => void;
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  /** Clear per-board UI when switching boards. */
  resetForBoard: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  dialog: null,
  dialogItemId: null,
  selectedItemId: null,
  editor: null,
  search: '',
  presenting: false,
  lastDrop: null,
  celebration: null,
  toasts: [],

  openDialog: (dialog, itemId = null) => set({ dialog, dialogItemId: itemId, editor: null }),
  closeDialog: () => set({ dialog: null, dialogItemId: null }),
  select: (selectedItemId) => set({ selectedItemId }),
  openEditor: (editor) =>
    set((state) => ({ editor, selectedItemId: editor?.itemId ?? state.selectedItemId })),
  setSearch: (search) => set({ search }),
  setPresenting: (presenting) => set({ presenting }),
  markDropped: (itemId) => set({ lastDrop: { itemId, at: Date.now() } }),
  celebrate: (celebration) => set({ celebration }),
  toast: (toast) =>
    set((state) => ({ toasts: [...state.toasts.slice(-2), { ...toast, id: createId() }] })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  resetForBoard: () =>
    set({
      dialog: null,
      dialogItemId: null,
      selectedItemId: null,
      editor: null,
      search: '',
      lastDrop: null,
      celebration: null,
    }),
}));

export const toast = (t: Omit<Toast, 'id'>) => useUiStore.getState().toast(t);

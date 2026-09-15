/**
 * The open board and its undo history. All mutations go through `apply`,
 * which runs a pure board operation and records a history step — so every
 * change is undoable by construction.
 */
import { create } from 'zustand';
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redo as redoHistory,
  undo as undoHistory,
  type History,
} from '@/features/history/history';
import { nowIso } from '@/lib/ids';
import type { TierBoard } from '@/models/board';

/** 'saved' boards autosave; 'shared' boards are temporary until saved. */
export type BoardMode = 'saved' | 'shared';

export interface ApplyOptions {
  /** Merge consecutive changes with the same key (e.g. typing a title). */
  coalesceKey?: string;
}

interface BoardState {
  history: History<TierBoard> | null;
  mode: BoardMode;
  /** Incremented on every change; cheap signal for autosave/effects. */
  revision: number;
  load: (board: TierBoard, mode?: BoardMode) => void;
  unload: () => void;
  apply: (update: (board: TierBoard) => TierBoard, options?: ApplyOptions) => boolean;
  undo: () => boolean;
  redo: () => boolean;
  /** Turn a temporary shared board into a saved one. */
  markSaved: (board: TierBoard) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  history: null,
  mode: 'saved',
  revision: 0,

  load: (board, mode = 'saved') => set({ history: createHistory(board), mode, revision: 0 }),

  unload: () => set({ history: null }),

  apply: (update, options) => {
    const { history } = get();
    if (!history) return false;
    const next = update(history.present);
    if (next === history.present) return false;
    const stamped = { ...next, updatedAt: nowIso() };
    set((state) => ({
      history: pushHistory(history, stamped, { coalesceKey: options?.coalesceKey }),
      revision: state.revision + 1,
    }));
    return true;
  },

  undo: () => {
    const { history } = get();
    if (!history || !canUndo(history)) return false;
    set((state) => ({ history: undoHistory(history), revision: state.revision + 1 }));
    return true;
  },

  redo: () => {
    const { history } = get();
    if (!history || !canRedo(history)) return false;
    set((state) => ({ history: redoHistory(history), revision: state.revision + 1 }));
    return true;
  },

  markSaved: (board) =>
    set((state) => ({
      history: state.history ? { ...state.history, present: board } : createHistory(board),
      mode: 'saved',
      revision: state.revision + 1,
    })),
}));

/** Current board. Components using it re-render on any board change. */
export const useBoard = () => useBoardStore((state) => state.history?.present ?? null);

/** Non-reactive read for event handlers. */
export const getBoard = () => useBoardStore.getState().history?.present ?? null;

export const useCanUndo = () => useBoardStore((state) => (state.history?.past.length ?? 0) > 0);
export const useCanRedo = () => useBoardStore((state) => (state.history?.future.length ?? 0) > 0);

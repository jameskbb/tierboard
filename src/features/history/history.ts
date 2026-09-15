/**
 * Snapshot-based undo/redo. Board states are immutable, so storing references
 * is cheap and every action is undoable without per-action inverse logic.
 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** Key of the last pushed change, used to merge rapid edits (e.g. typing). */
  lastKey?: string;
  lastAt?: number;
}

export interface PushOptions {
  /** Consecutive pushes with the same key within the window merge into one step. */
  coalesceKey?: string;
  now?: number;
  limit?: number;
  coalesceWindowMs?: number;
}

export const HISTORY_LIMIT = 100;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(
  history: History<T>,
  next: T,
  options: PushOptions = {},
): History<T> {
  if (Object.is(next, history.present)) return history;
  const now = options.now ?? Date.now();
  const limit = options.limit ?? HISTORY_LIMIT;
  const windowMs = options.coalesceWindowMs ?? 1200;
  const coalesce =
    options.coalesceKey !== undefined &&
    options.coalesceKey === history.lastKey &&
    history.lastAt !== undefined &&
    now - history.lastAt < windowMs;

  if (coalesce) {
    return { ...history, present: next, future: [], lastAt: now };
  }
  const past = [...history.past, history.present];
  if (past.length > limit) past.splice(0, past.length - limit);
  return { past, present: next, future: [], lastKey: options.coalesceKey, lastAt: now };
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past[history.past.length - 1];
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}

export const canUndo = <T>(history: History<T>) => history.past.length > 0;
export const canRedo = <T>(history: History<T>) => history.future.length > 0;

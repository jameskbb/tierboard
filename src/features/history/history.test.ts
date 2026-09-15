import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, createHistory, pushHistory, redo, undo } from './history';

describe('history', () => {
  it('undoes and redoes in order', () => {
    let h = createHistory('a');
    h = pushHistory(h, 'b', { now: 0 });
    h = pushHistory(h, 'c', { now: 5000 });
    expect(h.present).toBe('c');
    h = undo(h);
    expect(h.present).toBe('b');
    h = undo(h);
    expect(h.present).toBe('a');
    expect(canUndo(h)).toBe(false);
    h = redo(h);
    h = redo(h);
    expect(h.present).toBe('c');
    expect(canRedo(h)).toBe(false);
  });

  it('clears the redo stack on a new change', () => {
    let h = pushHistory(createHistory(1), 2, { now: 0 });
    h = undo(h);
    h = pushHistory(h, 3, { now: 10 });
    expect(canRedo(h)).toBe(false);
    expect(undo(h).present).toBe(1);
  });

  it('ignores pushes of the same state', () => {
    const h = createHistory('same');
    expect(pushHistory(h, 'same')).toBe(h);
  });

  it('coalesces rapid edits with the same key into one undo step', () => {
    let h = createHistory('');
    h = pushHistory(h, 'P', { coalesceKey: 'title', now: 0 });
    h = pushHistory(h, 'Pi', { coalesceKey: 'title', now: 200 });
    h = pushHistory(h, 'Piz', { coalesceKey: 'title', now: 400 });
    expect(h.past).toEqual(['']);
    expect(undo(h).present).toBe('');
  });

  it('does not coalesce after the window or with a different key', () => {
    let h = createHistory(0);
    h = pushHistory(h, 1, { coalesceKey: 'x', now: 0 });
    h = pushHistory(h, 2, { coalesceKey: 'x', now: 5000 });
    h = pushHistory(h, 3, { coalesceKey: 'y', now: 5001 });
    expect(h.past).toEqual([0, 1, 2]);
  });

  it('caps the number of undo steps', () => {
    let h = createHistory(0);
    for (let i = 1; i <= 10; i++) h = pushHistory(h, i, { limit: 3, now: i * 10000 });
    expect(h.past).toEqual([7, 8, 9]);
  });
});

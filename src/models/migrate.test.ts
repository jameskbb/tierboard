import { describe, expect, it } from 'vitest';
import { BoardImportError, migrateBoard } from './migrate';

describe('migrateBoard', () => {
  it('upgrades an unversioned (v0) board with inline items', () => {
    const board = migrateBoard({
      title: 'Old pizza list',
      tiers: [
        {
          name: 'S',
          color: '#f00',
          items: ['Capital Pizza', { name: 'One Guy', notes: 'Thin crust' }],
        },
        { name: 'A', items: [] },
      ],
      unranked: ["Papa V's"],
    });
    expect(board.schemaVersion).toBe(1);
    expect(board.tiers).toHaveLength(2);
    expect(board.tiers[1]!.color).toMatch(/^#/);
    const sNames = board.tiers[0]!.itemIds.map((id) => board.items[id]!.name);
    expect(sNames).toEqual(['Capital Pizza', 'One Guy']);
    expect(board.items[board.tiers[0]!.itemIds[1]!]!.notes).toBe('Thin crust');
    expect(board.unrankedItemIds.map((id) => board.items[id]!.name)).toEqual(["Papa V's"]);
  });

  it('repairs broken references: dangling ids, duplicates and orphans', () => {
    const board = migrateBoard({
      schemaVersion: 1,
      title: 'Messy',
      tiers: [{ id: 't1', name: 'S', color: '#fff', itemIds: ['a', 'ghost', 'a'] }],
      unrankedItemIds: ['a', 'b'],
      items: { a: { name: 'A' }, b: { name: 'B' }, c: { name: 'Orphan' }, d: { notes: 'no name' } },
    });
    expect(board.tiers[0]!.itemIds).toEqual(['a']);
    expect(board.unrankedItemIds).toEqual(['b', 'c']);
    expect(board.items.d).toBeUndefined();
  });

  it('fills defaults for missing settings and metadata', () => {
    const board = migrateBoard({ schemaVersion: 1, tiers: [], items: {} });
    expect(board.title).toBe('Untitled board');
    expect(board.settings.theme).toBe('classic');
    expect(board.id).toBeTruthy();
  });

  it('never lets a tier use the reserved unranked id', () => {
    const board = migrateBoard({
      schemaVersion: 1,
      tiers: [{ id: 'unranked', name: 'S', itemIds: [] }],
      items: {},
    });
    expect(board.tiers[0]!.id).not.toBe('unranked');
  });

  it('rejects boards from a newer schema and non-boards', () => {
    expect(() => migrateBoard({ schemaVersion: 99, tiers: [] })).toThrow(BoardImportError);
    expect(() => migrateBoard('nope')).toThrow(BoardImportError);
    expect(() => migrateBoard({ schemaVersion: 1, items: {} })).toThrow(/no tiers/);
  });
});

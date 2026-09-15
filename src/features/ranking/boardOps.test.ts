import { describe, expect, it } from 'vitest';
import { UNRANKED_ID, type TierBoard } from '@/models/board';
import {
  addItems,
  applyBuckets,
  applyTierPreset,
  clearRankings,
  createBoard,
  deleteAllItems,
  deleteTier,
  duplicateItem,
  duplicateTier,
  findItemContainer,
  moveItem,
  moveTier,
  removeItem,
  reorderWithin,
  sortContainer,
  updateItem,
} from './boardOps';
import { TIER_PRESETS } from './presets';

function pizzaBoard() {
  const { board, added } = addItems(createBoard('Lubbock Pizza'), [
    { name: 'Capital Pizza' },
    { name: 'One Guy' },
    { name: "Papa V's" },
    { name: "Domino's" },
  ]);
  const [capital, oneGuy, papa, dominos] = added.map((item) => item.id) as [
    string,
    string,
    string,
    string,
  ];
  return { board, capital, oneGuy, papa, dominos };
}

const tier = (board: TierBoard, index: number) => board.tiers[index]!;

describe('createBoard', () => {
  it('starts with S/A/B/C/D/F and an empty Unranked tray', () => {
    const board = createBoard();
    expect(board.tiers.map((t) => t.name)).toEqual(['S', 'A', 'B', 'C', 'D', 'F']);
    expect(board.unrankedItemIds).toEqual([]);
    expect(board.schemaVersion).toBe(1);
  });
});

describe('addItems', () => {
  it('appends new items to Unranked in order', () => {
    const { board, capital, dominos } = pizzaBoard();
    expect(board.unrankedItemIds).toHaveLength(4);
    expect(board.unrankedItemIds[0]).toBe(capital);
    expect(board.unrankedItemIds[3]).toBe(dominos);
  });
});

describe('moveItem', () => {
  it('moves an item from Unranked into a tier', () => {
    const { board, capital } = pizzaBoard();
    const next = moveItem(board, capital, tier(board, 0).id);
    expect(tier(next, 0).itemIds).toEqual([capital]);
    expect(next.unrankedItemIds).not.toContain(capital);
  });

  it('moves between tiers at a specific index', () => {
    const { board, capital, oneGuy, papa } = pizzaBoard();
    const s = tier(board, 0).id;
    const a = tier(board, 1).id;
    let next = moveItem(board, capital, s);
    next = moveItem(next, oneGuy, s);
    next = moveItem(next, papa, a);
    next = moveItem(next, papa, s, 1);
    expect(tier(next, 0).itemIds).toEqual([capital, papa, oneGuy]);
    expect(tier(next, 1).itemIds).toEqual([]);
  });

  it('reorders within the same tier', () => {
    const { board, capital, oneGuy, papa } = pizzaBoard();
    const s = tier(board, 0).id;
    let next = moveItem(board, capital, s);
    next = moveItem(next, oneGuy, s);
    next = moveItem(next, papa, s);
    next = moveItem(next, papa, s, 0);
    expect(tier(next, 0).itemIds).toEqual([papa, capital, oneGuy]);
  });

  it('returns an item to Unranked', () => {
    const { board, capital } = pizzaBoard();
    const ranked = moveItem(board, capital, tier(board, 2).id);
    const back = moveItem(ranked, capital, UNRANKED_ID, 0);
    expect(findItemContainer(back, capital)).toBe(UNRANKED_ID);
    expect(back.unrankedItemIds[0]).toBe(capital);
    expect(tier(back, 2).itemIds).toEqual([]);
  });

  it('ignores unknown items and containers, and no-op moves keep the reference', () => {
    const { board, capital } = pizzaBoard();
    expect(moveItem(board, 'nope', tier(board, 0).id)).toBe(board);
    expect(moveItem(board, capital, 'missing-tier')).toBe(board);
    expect(moveItem(board, capital, UNRANKED_ID, 0)).toBe(board);
  });
});

describe('item editing', () => {
  it('updates fields and drops cleared optional values', () => {
    const { board, capital } = pizzaBoard();
    const next = updateItem(board, capital, { emoji: '🍕', notes: 'Great crust' });
    expect(next.items[capital]).toMatchObject({ emoji: '🍕', notes: 'Great crust' });
    const cleared = updateItem(next, capital, { notes: '' });
    expect(cleared.items[capital]).not.toHaveProperty('notes');
  });

  it('duplicates right after the original without the hot take', () => {
    const { board, capital, oneGuy } = pizzaBoard();
    const hot = updateItem(board, capital, { hotTake: true, hotTakeNote: 'Fight me' });
    const { board: next, newId } = duplicateItem(hot, capital);
    expect(next.unrankedItemIds.slice(0, 3)).toEqual([capital, newId, oneGuy]);
    expect(next.items[newId!]).toMatchObject({ name: 'Capital Pizza (copy)' });
    expect(next.items[newId!]?.hotTake).toBeUndefined();
  });

  it('deletes an item from its container and the item map', () => {
    const { board, capital } = pizzaBoard();
    const ranked = moveItem(board, capital, tier(board, 0).id);
    const next = removeItem(ranked, capital);
    expect(next.items[capital]).toBeUndefined();
    expect(tier(next, 0).itemIds).toEqual([]);
  });
});

describe('deleteTier', () => {
  it('moves items to Unranked by default', () => {
    const { board, capital, oneGuy } = pizzaBoard();
    const s = tier(board, 0).id;
    let next = moveItem(board, capital, s);
    next = moveItem(next, oneGuy, s);
    next = deleteTier(next, s);
    expect(next.tiers).toHaveLength(5);
    expect(next.unrankedItemIds.slice(-2)).toEqual([capital, oneGuy]);
    expect(next.items[capital]).toBeDefined();
  });

  it('can delete the items along with the tier', () => {
    const { board, capital } = pizzaBoard();
    const s = tier(board, 0).id;
    const next = deleteTier(moveItem(board, capital, s), s, 'delete-items');
    expect(next.items[capital]).toBeUndefined();
    expect(next.unrankedItemIds).not.toContain(capital);
  });
});

describe('tier structure', () => {
  it('reorders tiers', () => {
    const board = createBoard();
    const next = moveTier(board, 5, 0);
    expect(next.tiers.map((t) => t.name)).toEqual(['F', 'S', 'A', 'B', 'C', 'D']);
  });

  it('duplicates a tier below the original, empty', () => {
    const { board, capital } = pizzaBoard();
    const ranked = moveItem(board, capital, tier(board, 0).id);
    const next = duplicateTier(ranked, tier(ranked, 0).id);
    expect(next.tiers.map((t) => t.name).slice(0, 2)).toEqual(['S', 'S copy']);
    expect(tier(next, 1).itemIds).toEqual([]);
    expect(tier(next, 1).color).toBe(tier(next, 0).color);
  });

  it('applies a shorter preset, keeping rankings by position and unranking the rest', () => {
    const { board, capital, oneGuy } = pizzaBoard();
    let next = moveItem(board, capital, tier(board, 0).id);
    next = moveItem(next, oneGuy, tier(board, 5).id);
    const preset = TIER_PRESETS.find((p) => p.id === 'must-have')!;
    next = applyTierPreset(next, preset);
    expect(next.tiers.map((t) => t.name)).toEqual(['Must Have', 'Nice', 'Maybe', 'Skip']);
    expect(tier(next, 0).itemIds).toEqual([capital]);
    expect(next.unrankedItemIds).toContain(oneGuy);
  });
});

describe('bulk operations', () => {
  it('clearRankings returns everything to Unranked without deleting', () => {
    const { board, capital, oneGuy } = pizzaBoard();
    let next = moveItem(board, capital, tier(board, 0).id);
    next = moveItem(next, oneGuy, tier(board, 3).id);
    next = clearRankings(next);
    expect(next.tiers.every((t) => t.itemIds.length === 0)).toBe(true);
    expect(next.unrankedItemIds).toHaveLength(4);
    expect(Object.keys(next.items)).toHaveLength(4);
  });

  it('deleteAllItems empties the board but keeps tiers', () => {
    const { board } = pizzaBoard();
    const next = deleteAllItems(board);
    expect(Object.keys(next.items)).toHaveLength(0);
    expect(next.tiers).toHaveLength(6);
  });

  it('sorts a container alphabetically both ways', () => {
    const { board } = pizzaBoard();
    const names = (b: TierBoard) => b.unrankedItemIds.map((id) => b.items[id]!.name);
    expect(names(sortContainer(board, UNRANKED_ID, 'az'))).toEqual([
      'Capital Pizza',
      "Domino's",
      'One Guy',
      "Papa V's",
    ]);
    expect(names(sortContainer(board, UNRANKED_ID, 'za'))[0]).toBe("Papa V's");
  });

  it('reorders a subset within a container and places buckets into tiers', () => {
    const { board, capital, oneGuy, papa, dominos } = pizzaBoard();
    const reordered = reorderWithin(board, UNRANKED_ID, [papa, capital]);
    expect(reordered.unrankedItemIds).toEqual([papa, oneGuy, capital, dominos]);
    const bucketed = applyBuckets(board, [[capital], [oneGuy, papa]]);
    expect(tier(bucketed, 0).itemIds).toEqual([capital]);
    expect(tier(bucketed, 1).itemIds).toEqual([oneGuy, papa]);
    expect(bucketed.unrankedItemIds).toEqual([dominos]);
  });
});

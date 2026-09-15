import { describe, expect, it } from 'vitest';
import { addItems, createBoard, moveItem, updateItem } from '@/features/ranking/boardOps';
import {
  decodeBoard,
  encodeBoard,
  fromBase64Url,
  ShareDecodeError,
  toBase64Url,
} from './shareCodec';

function sampleBoard() {
  const { board, added } = addItems(createBoard('Lubbock Pizza 🍕'), [
    { name: 'Capital Pizza', emoji: '🍕' },
    { name: 'One Guy', subtitle: 'Downtown' },
    { name: "Papa V's", image: 'https://example.com/papa.png' },
    { name: "Domino's", image: 'local:abc123' },
  ]);
  let next = moveItem(board, added[0]!.id, board.tiers[0]!.id);
  next = moveItem(next, added[1]!.id, board.tiers[1]!.id);
  next = updateItem(next, added[3]!.id, { hotTake: true, hotTakeNote: 'Pan pizza is underrated' });
  next = { ...next, settings: { ...next.settings, theme: 'neon', showCounts: true } };
  return next;
}

const snapshot = (board: ReturnType<typeof sampleBoard>) => ({
  title: board.title,
  settings: board.settings,
  tiers: board.tiers.map((tier) => ({
    name: tier.name,
    color: tier.color,
    items: tier.itemIds.map((id) => board.items[id]!.name),
  })),
  unranked: board.unrankedItemIds.map((id) => {
    const { id: _id, ...rest } = board.items[id]!;
    return rest;
  }),
});

describe('share codec', () => {
  it('round-trips a board through a compressed, URL-safe payload', async () => {
    const board = sampleBoard();
    const { payload } = await encodeBoard(board);
    expect(payload.startsWith('1z')).toBe(true);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    const decoded = await decodeBoard(payload);
    const expected = snapshot(board);
    // Local images can't travel in a link.
    expected.unranked = expected.unranked.map(({ image, ...rest }) =>
      image?.startsWith('local:') ? rest : { ...rest, ...(image ? { image } : {}) },
    );
    expect(snapshot(decoded)).toEqual(expected);
  });

  it('reports stripped local images', async () => {
    const { strippedImages } = await encodeBoard(sampleBoard());
    expect(strippedImages).toBe(1);
  });

  it('produces a fresh board id (never overwrites the sender or recipient board)', async () => {
    const board = sampleBoard();
    const decoded = await decodeBoard((await encodeBoard(board)).payload);
    expect(decoded.id).not.toBe(board.id);
  });

  it('keeps links for a 15-item board short', async () => {
    const names = Array.from({ length: 15 }, (_, i) => `Pizza Place Number ${i + 1}`);
    const { board } = addItems(
      createBoard('Lubbock Pizza'),
      names.map((name) => ({ name })),
    );
    const { payload } = await encodeBoard(board);
    expect(payload.length).toBeLessThan(400);
  });

  it('rejects damaged payloads with a helpful error', async () => {
    const { payload } = await encodeBoard(sampleBoard());
    await expect(decodeBoard(payload.slice(0, payload.length / 2))).rejects.toBeInstanceOf(
      ShareDecodeError,
    );
    await expect(decodeBoard('9xnonsense')).rejects.toBeInstanceOf(ShareDecodeError);
  });

  it('base64url round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255, 62, 63]);
    expect(Array.from(fromBase64Url(toBase64Url(bytes)))).toEqual(Array.from(bytes));
  });
});

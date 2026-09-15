import { describe, expect, it } from 'vitest';
import { addItems, createBoard, moveItem, updateItem } from '@/features/ranking/boardOps';
import { BoardImportError } from '@/models/migrate';
import { parseBoardFile, serializeBoardFile, slugify } from './boardFile';
import { boardToCsv, csvToDrafts, parseCsv } from './csv';

function board() {
  const { board: b, added } = addItems(createBoard('Lubbock Pizza'), [
    { name: 'Capital Pizza' },
    { name: 'One Guy, Downtown' },
    { name: "Papa V's" },
  ]);
  let next = moveItem(b, added[0]!.id, b.tiers[0]!.id);
  next = moveItem(next, added[1]!.id, b.tiers[0]!.id);
  next = updateItem(next, added[1]!.id, { notes: 'Says "best in town"', hotTake: true });
  return next;
}

describe('JSON board files', () => {
  it('round-trips losslessly with a schema version', () => {
    const original = board();
    const text = serializeBoardFile(original);
    expect(JSON.parse(text)).toMatchObject({ app: 'tierboard', schemaVersion: 1 });
    expect(parseBoardFile(text)).toEqual(original);
  });

  it('accepts a bare board object and rejects junk', () => {
    const original = board();
    expect(parseBoardFile(JSON.stringify(original)).title).toBe('Lubbock Pizza');
    expect(() => parseBoardFile('{not json')).toThrow(BoardImportError);
  });

  it('slugifies titles for file names', () => {
    expect(slugify("Lubbock Pizza — Papa V's!")).toBe('lubbock-pizza-papa-v-s');
    expect(slugify('🍕')).toBe('tierboard');
  });
});

describe('CSV', () => {
  it('exports tier, rank, notes and hot takes with proper quoting', () => {
    const rows = parseCsv(boardToCsv(board()));
    expect(rows[0]!.slice(0, 5)).toEqual([
      'item',
      'tier',
      'tier_position',
      'rank_within_tier',
      'overall_rank',
    ]);
    expect(rows[1]!.slice(0, 5)).toEqual(['Capital Pizza', 'S', '1', '1', '1']);
    expect(rows[2]![0]).toBe('One Guy, Downtown');
    expect(rows[2]![7]).toBe('Says "best in town"');
    expect(rows[2]![10]).toBe('yes');
    expect(rows[3]!.slice(0, 5)).toEqual(["Papa V's", 'Unranked', '', '', '']);
  });

  it('imports a CSV with a header row', () => {
    const drafts = csvToDrafts('name,subtitle,notes\n"Capital Pizza",Downtown,Great\nOne Guy,,\n');
    expect(drafts).toEqual([
      { name: 'Capital Pizza', subtitle: 'Downtown', notes: 'Great' },
      { name: 'One Guy' },
    ]);
  });

  it('imports a plain list or first column when there is no header', () => {
    expect(csvToDrafts('Capital Pizza\nOne Guy').map((d) => d.name)).toEqual([
      'Capital Pizza',
      'One Guy',
    ]);
    expect(csvToDrafts('Capital Pizza,4.5\nOne Guy,4').map((d) => d.name)).toEqual([
      'Capital Pizza',
      'One Guy',
    ]);
  });
});

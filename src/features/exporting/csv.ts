import type { ItemDraft } from '@/features/ranking/boardOps';
import { parseItems } from '@/features/importing/parseItems';
import type { TierBoard } from '@/models/board';

const COLUMNS = [
  'item',
  'tier',
  'tier_position',
  'rank_within_tier',
  'overall_rank',
  'subtitle',
  'emoji',
  'notes',
  'url',
  'image',
  'hot_take',
  'hot_take_note',
] as const;

function cell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function boardToCsv(board: TierBoard): string {
  const rows: string[][] = [COLUMNS.slice()];
  let overall = 0;
  const push = (id: string, tier: string, tierPosition?: number, rank?: number) => {
    const item = board.items[id];
    if (!item) return;
    const image = item.image && /^https?:/i.test(item.image) ? item.image : '';
    rows.push(
      [
        item.name,
        tier,
        tierPosition,
        rank,
        rank === undefined ? undefined : ++overall,
        item.subtitle,
        item.emoji,
        item.notes,
        item.url,
        image,
        item.hotTake ? 'yes' : '',
        item.hotTakeNote,
      ].map(cell),
    );
  };
  board.tiers.forEach((tier, tierIndex) =>
    tier.itemIds.forEach((id, index) => push(id, tier.name, tierIndex + 1, index + 1)),
  );
  board.unrankedItemIds.forEach((id) => push(id, 'Unranked'));
  return rows.map((row) => row.join(',')).join('\r\n') + '\r\n';
}

/** Minimal RFC 4180 parser (quotes, escaped quotes, CRLF, embedded newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

const NAME_HEADERS = ['item', 'name', 'title'];

/**
 * CSV/text → Unranked item drafts. With a header row containing item/name, the
 * optional subtitle/emoji/notes/url/image columns are used; otherwise every
 * row's first column (or each line of plain text) becomes an item.
 */
export function csvToDrafts(text: string): ItemDraft[] {
  const rows = parseCsv(text);
  const header = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const nameColumn = header.findIndex((h) => NAME_HEADERS.includes(h));
  if (nameColumn < 0) {
    if (rows.every((r) => r.length <= 1)) return parseItems(text);
    return parseItems(rows.map((r) => r[0] ?? '').join('\n'));
  }
  const col = (name: string) => header.indexOf(name);
  const optional = {
    subtitle: col('subtitle'),
    emoji: col('emoji'),
    notes: col('notes'),
    url: col('url'),
    image: col('image'),
  };
  return rows.slice(1).flatMap((row): ItemDraft[] => {
    const name = row[nameColumn]?.trim();
    if (!name) return [];
    const draft: ItemDraft = { name };
    for (const [key, index] of Object.entries(optional) as [keyof typeof optional, number][]) {
      const value = index >= 0 ? row[index]?.trim() : '';
      if (value) draft[key] = value;
    }
    return [draft];
  });
}

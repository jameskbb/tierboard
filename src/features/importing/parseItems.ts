import type { ItemDraft } from '@/features/ranking/boardOps';

const LIST_MARKER = /^\s*(?:[-*•·▪◦]|\d{1,3}[.)]|\[[ xX]?\])\s+/;
const LEADING_EMOJI =
  /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|⃣|\p{Emoji_Modifier}|‍(?:\p{Extended_Pictographic}|\p{Regional_Indicator})|\p{Regional_Indicator})*)\s*/u;
const TRAILING_IMAGE_URL = /\s+(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?)$/i;

/**
 * Split pasted text into raw entries.
 * - Multiple lines → one entry per line (tabs: first cell, for spreadsheet pastes).
 * - A single line with commas → comma-separated values.
 * List markers ("- ", "1. ", "• ") and wrapping quotes are stripped.
 */
export function splitEntries(text: string): string[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const raw =
    lines.length === 1 && lines[0]!.includes(',') && !lines[0]!.includes('\t')
      ? lines[0]!.split(',')
      : lines.map((line) => line.split('\t')[0] ?? '');

  return raw
    .map((entry) =>
      entry
        .replace(LIST_MARKER, '')
        .trim()
        .replace(/^["'“”‘’](.*)["'“”‘’]$/u, '$1')
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Turn one entry into an item draft:
 * "🍕 Capital Pizza" → emoji + name, "Name | subtitle", trailing image URL → image.
 */
export function parseEntry(entry: string): ItemDraft | null {
  let rest = entry.trim();
  const draft: Partial<ItemDraft> = {};

  const imageMatch = rest.match(TRAILING_IMAGE_URL);
  if (imageMatch) {
    draft.image = imageMatch[1];
    rest = rest.slice(0, imageMatch.index).trim();
  }

  const emojiMatch = rest.match(LEADING_EMOJI);
  if (emojiMatch && emojiMatch[0].length < rest.length) {
    draft.emoji = emojiMatch[1];
    rest = rest.slice(emojiMatch[0].length).trim();
  }

  const pipe = rest.indexOf(' | ');
  if (pipe > 0) {
    const subtitle = rest.slice(pipe + 3).trim();
    if (subtitle) draft.subtitle = subtitle;
    rest = rest.slice(0, pipe).trim();
  }

  const name = rest.replace(/\s+/g, ' ').slice(0, 120);
  if (!name) return null;
  return { ...draft, name };
}

export function parseItems(text: string): ItemDraft[] {
  return splitEntries(text)
    .map(parseEntry)
    .filter((draft): draft is ItemDraft => draft !== null);
}

/** Case/spacing/punctuation-insensitive key: "Papa V's" ≈ "papa vs". */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export interface DedupeResult {
  unique: ItemDraft[];
  duplicates: ItemDraft[];
}

/** Drop drafts whose name already exists on the board or earlier in the batch. */
export function dedupeDrafts(drafts: ItemDraft[], existingNames: Iterable<string>): DedupeResult {
  const seen = new Set<string>();
  for (const name of existingNames) seen.add(normalizeName(name));
  const unique: ItemDraft[] = [];
  const duplicates: ItemDraft[] = [];
  for (const draft of drafts) {
    const key = normalizeName(draft.name);
    if (key && seen.has(key)) {
      duplicates.push(draft);
    } else {
      if (key) seen.add(key);
      unique.push(draft);
    }
  }
  return { unique, duplicates };
}

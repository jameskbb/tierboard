/**
 * Share-link codec: board → compact JSON → deflate-raw → base64url.
 *
 * The compact form drops ids (items are referenced by index) and uses short
 * keys, which roughly halves the JSON before compression. The payload is
 * prefixed with a format marker so the encoding can evolve:
 *   "1z…" = v1 compact, deflate-raw compressed
 *   "1j…" = v1 compact, uncompressed (fallback when CompressionStream is missing)
 */
import { migrateBoard } from '@/models/migrate';
import type { BoardThemeId, RankItem, TierBoard } from '@/models/board';

interface CompactExtras {
  s?: string; // subtitle
  e?: string; // emoji
  m?: string; // image URL
  c?: string; // accent
  n?: string; // notes
  l?: string; // link URL
  h?: 1; // hot take
  hn?: string; // hot take note
}
type CompactItem = [string] | [string, CompactExtras];

interface SharePayloadV1 {
  t: string;
  d?: string;
  /** [theme, showCounts, showBranding, compact] */
  o?: [BoardThemeId, 0 | 1, 0 | 1, 0 | 1];
  r: [string, string, number[]][];
  u: number[];
  i: CompactItem[];
}

export interface EncodedShare {
  payload: string;
  /** Uploaded (local) or inline data: images that were left out of the link. */
  strippedImages: number;
}

/** Images that live in IndexedDB or inline data can't travel in a URL. */
export function isEmbeddableImage(image: string | undefined): boolean {
  return !!image && /^https?:\/\//i.test(image);
}

function compactItem(item: RankItem): { value: CompactItem; stripped: boolean } {
  const extras: CompactExtras = {};
  if (item.subtitle) extras.s = item.subtitle;
  if (item.emoji) extras.e = item.emoji;
  if (item.accent) extras.c = item.accent;
  if (item.notes) extras.n = item.notes;
  if (item.url) extras.l = item.url;
  if (item.hotTake) extras.h = 1;
  if (item.hotTakeNote) extras.hn = item.hotTakeNote;
  const stripped = !!item.image && !isEmbeddableImage(item.image);
  if (item.image && !stripped) extras.m = item.image;
  return {
    value: Object.keys(extras).length ? [item.name, extras] : [item.name],
    stripped,
  };
}

export function toSharePayload(board: TierBoard): { data: SharePayloadV1; strippedImages: number } {
  const order = [...board.tiers.flatMap((tier) => tier.itemIds), ...board.unrankedItemIds];
  const indexOf = new Map(order.map((id, index) => [id, index]));
  let strippedImages = 0;
  const items = order.map((id) => {
    const { value, stripped } = compactItem(board.items[id]!);
    if (stripped) strippedImages++;
    return value;
  });
  const { theme, showCounts, showBranding, itemSize } = board.settings;
  const data: SharePayloadV1 = {
    t: board.title,
    o: [theme, showCounts ? 1 : 0, showBranding ? 1 : 0, itemSize === 'compact' ? 1 : 0],
    r: board.tiers.map((tier) => [
      tier.name,
      tier.color,
      tier.itemIds.map((id) => indexOf.get(id)!),
    ]),
    u: board.unrankedItemIds.map((id) => indexOf.get(id)!),
    i: items,
  };
  if (board.description) data.d = board.description;
  return { data, strippedImages };
}

export function fromSharePayload(data: SharePayloadV1): TierBoard {
  const itemIds = data.i.map((_, index) => `i${index}`);
  const items: Record<string, unknown> = {};
  data.i.forEach(([name, extras = {}], index) => {
    items[itemIds[index]!] = {
      name,
      subtitle: extras.s,
      emoji: extras.e,
      image: extras.m,
      accent: extras.c,
      notes: extras.n,
      url: extras.l,
      hotTake: extras.h === 1,
      hotTakeNote: extras.hn,
    };
  });
  const ref = (list: number[]) => list.map((index) => itemIds[index]).filter(Boolean);
  const [theme, counts, branding, compact] = data.o ?? ['classic', 0, 1, 0];
  // Run through migrate/normalize so malformed links can't produce a broken board.
  return migrateBoard({
    schemaVersion: 1,
    title: data.t,
    description: data.d,
    tiers: data.r.map(([name, color, list]) => ({ name, color, itemIds: ref(list) })),
    unrankedItemIds: ref(data.u),
    items,
    settings: {
      theme,
      showCounts: counts === 1,
      showBranding: branding === 1,
      itemSize: compact === 1 ? 'compact' : 'comfortable',
    },
  });
}

// ---------------------------------------------------------------------------
// Bytes

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const source = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream();
  const buffer = await new Response(source.pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buffer);
}

const canCompress = () =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeBoard(board: TierBoard): Promise<EncodedShare> {
  const { data, strippedImages } = toSharePayload(board);
  const json = new TextEncoder().encode(JSON.stringify(data));
  if (!canCompress()) return { payload: `1j${toBase64Url(json)}`, strippedImages };
  const compressed = await pipe(json, new CompressionStream('deflate-raw'));
  return { payload: `1z${toBase64Url(compressed)}`, strippedImages };
}

export class ShareDecodeError extends Error {
  override name = 'ShareDecodeError';
}

export async function decodeBoard(payload: string): Promise<TierBoard> {
  const marker = payload.slice(0, 2);
  const body = payload.slice(2);
  try {
    let bytes = fromBase64Url(body);
    if (marker === '1z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (marker !== '1j') throw new Error(`Unknown share format "${marker}"`);
    const data = JSON.parse(new TextDecoder().decode(bytes)) as SharePayloadV1;
    if (!data || !Array.isArray(data.r) || !Array.isArray(data.i)) throw new Error('Bad payload');
    return fromSharePayload(data);
  } catch (error) {
    throw new ShareDecodeError(
      'This share link is incomplete or damaged. Ask for the link again — some apps cut off long links.',
      { cause: error },
    );
  }
}

/**
 * Pure board operations. Every function takes a board and returns a new board
 * (or the same reference when nothing changed). No React, no storage — which
 * is what makes undo/redo, tests and future realtime sync straightforward.
 */
import { createId, nowIso } from '@/lib/ids';
import {
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  UNRANKED_ID,
  type ContainerId,
  type RankItem,
  type Tier,
  type TierBoard,
} from '@/models/board';
import { DEFAULT_PRESET, TIER_SWATCHES, type TierPreset } from './presets';

export interface ItemDraft {
  name: string;
  subtitle?: string;
  emoji?: string;
  image?: string;
  accent?: string;
  notes?: string;
  url?: string;
}

export function createBoard(
  title = 'Untitled board',
  options: { preset?: TierPreset; drafts?: ItemDraft[]; description?: string } = {},
): TierBoard {
  const now = nowIso();
  const preset = options.preset ?? DEFAULT_PRESET;
  const board: TierBoard = {
    id: createId(),
    schemaVersion: SCHEMA_VERSION,
    title,
    description: options.description,
    createdAt: now,
    updatedAt: now,
    tiers: preset.tiers.map((tier) => ({ id: createId(), ...tier, itemIds: [] })),
    unrankedItemIds: [],
    items: {},
    settings: { ...DEFAULT_SETTINGS },
  };
  return options.drafts?.length ? addItems(board, options.drafts).board : board;
}

// ---------------------------------------------------------------------------
// Containers

export function getContainerItems(board: TierBoard, containerId: ContainerId): string[] {
  if (containerId === UNRANKED_ID) return board.unrankedItemIds;
  return board.tiers.find((tier) => tier.id === containerId)?.itemIds ?? [];
}

export function containerExists(board: TierBoard, containerId: ContainerId): boolean {
  return containerId === UNRANKED_ID || board.tiers.some((tier) => tier.id === containerId);
}

export function findItemContainer(board: TierBoard, itemId: string): ContainerId | null {
  if (board.unrankedItemIds.includes(itemId)) return UNRANKED_ID;
  return board.tiers.find((tier) => tier.itemIds.includes(itemId))?.id ?? null;
}

function setContainerItems(board: TierBoard, containerId: ContainerId, ids: string[]): TierBoard {
  if (containerId === UNRANKED_ID) return { ...board, unrankedItemIds: ids };
  return {
    ...board,
    tiers: board.tiers.map((tier) => (tier.id === containerId ? { ...tier, itemIds: ids } : tier)),
  };
}

/** Remove an item id from whichever container holds it. */
function detach(board: TierBoard, itemId: string): TierBoard {
  const from = findItemContainer(board, itemId);
  if (!from) return board;
  return setContainerItems(
    board,
    from,
    getContainerItems(board, from).filter((id) => id !== itemId),
  );
}

export function tierIndex(board: TierBoard, tierId: ContainerId): number {
  return board.tiers.findIndex((tier) => tier.id === tierId);
}

export function rankedItemIds(board: TierBoard): string[] {
  return board.tiers.flatMap((tier) => tier.itemIds);
}

// ---------------------------------------------------------------------------
// Items

export function addItems(
  board: TierBoard,
  drafts: ItemDraft[],
  containerId: ContainerId = UNRANKED_ID,
): { board: TierBoard; added: RankItem[] } {
  if (drafts.length === 0) return { board, added: [] };
  const added = drafts.map((draft): RankItem => ({ id: createId(), ...draft }));
  const items = { ...board.items };
  for (const item of added) items[item.id] = item;
  const target = containerExists(board, containerId) ? containerId : UNRANKED_ID;
  const next = setContainerItems({ ...board, items }, target, [
    ...getContainerItems(board, target),
    ...added.map((item) => item.id),
  ]);
  return { board: next, added };
}

/**
 * Move an item into a container at an index (end when omitted). Moving within
 * the same container reorders it. Unknown items/containers are ignored.
 */
export function moveItem(
  board: TierBoard,
  itemId: string,
  toContainer: ContainerId,
  toIndex?: number,
): TierBoard {
  if (!board.items[itemId] || !containerExists(board, toContainer)) return board;
  const from = findItemContainer(board, itemId);
  const fromIndex = from ? getContainerItems(board, from).indexOf(itemId) : -1;
  const detached = detach(board, itemId);
  const target = [...getContainerItems(detached, toContainer)];
  const index =
    toIndex === undefined ? target.length : Math.max(0, Math.min(toIndex, target.length));
  if (from === toContainer && fromIndex === index) return board;
  target.splice(index, 0, itemId);
  return setContainerItems(detached, toContainer, target);
}

export function updateItem(
  board: TierBoard,
  itemId: string,
  patch: Partial<Omit<RankItem, 'id'>>,
): TierBoard {
  const item = board.items[itemId];
  if (!item) return board;
  const next: RankItem = { ...item, ...patch };
  // Drop cleared optional fields so exports stay tidy.
  for (const key of Object.keys(next) as (keyof RankItem)[]) {
    if (next[key] === '' || next[key] === undefined || next[key] === false) {
      if (key !== 'id' && key !== 'name') delete next[key];
    }
  }
  return { ...board, items: { ...board.items, [itemId]: next } };
}

export function removeItems(board: TierBoard, itemIds: string[]): TierBoard {
  const doomed = new Set(itemIds.filter((id) => board.items[id]));
  if (doomed.size === 0) return board;
  const items = { ...board.items };
  for (const id of doomed) delete items[id];
  return {
    ...board,
    items,
    unrankedItemIds: board.unrankedItemIds.filter((id) => !doomed.has(id)),
    tiers: board.tiers.map((tier) => ({
      ...tier,
      itemIds: tier.itemIds.filter((id) => !doomed.has(id)),
    })),
  };
}

export function removeItem(board: TierBoard, itemId: string): TierBoard {
  return removeItems(board, [itemId]);
}

/** Duplicate an item right after the original. Hot-take state is not copied. */
export function duplicateItem(
  board: TierBoard,
  itemId: string,
): { board: TierBoard; newId: string | null } {
  const item = board.items[itemId];
  const container = findItemContainer(board, itemId);
  if (!item || !container) return { board, newId: null };
  const copy: RankItem = { ...item, id: createId(), name: `${item.name} (copy)` };
  delete copy.hotTake;
  delete copy.hotTakeNote;
  const ids = [...getContainerItems(board, container)];
  ids.splice(ids.indexOf(itemId) + 1, 0, copy.id);
  const next = setContainerItems(
    { ...board, items: { ...board.items, [copy.id]: copy } },
    container,
    ids,
  );
  return { board: next, newId: copy.id };
}

// ---------------------------------------------------------------------------
// Tiers

export function addTier(
  board: TierBoard,
  tier: Partial<Pick<Tier, 'name' | 'color'>> = {},
  index = board.tiers.length,
): TierBoard {
  const used = new Set(board.tiers.map((t) => t.color));
  const color = tier.color ?? TIER_SWATCHES.find((c) => !used.has(c)) ?? TIER_SWATCHES[0]!;
  const newTier: Tier = { id: createId(), name: tier.name ?? 'New tier', color, itemIds: [] };
  const tiers = [...board.tiers];
  tiers.splice(Math.max(0, Math.min(index, tiers.length)), 0, newTier);
  return { ...board, tiers };
}

export function updateTier(
  board: TierBoard,
  tierId: string,
  patch: Partial<Pick<Tier, 'name' | 'color'>>,
): TierBoard {
  if (tierIndex(board, tierId) < 0) return board;
  return {
    ...board,
    tiers: board.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...patch } : tier)),
  };
}

export type TierDeleteMode = 'unrank' | 'delete-items';

/**
 * Delete a tier. By default its items go back to Unranked (appended in order);
 * 'delete-items' removes them from the board entirely.
 */
export function deleteTier(
  board: TierBoard,
  tierId: string,
  mode: TierDeleteMode = 'unrank',
): TierBoard {
  const tier = board.tiers.find((t) => t.id === tierId);
  if (!tier) return board;
  const withoutTier = { ...board, tiers: board.tiers.filter((t) => t.id !== tierId) };
  if (mode === 'delete-items') {
    const items = { ...board.items };
    for (const id of tier.itemIds) delete items[id];
    return { ...withoutTier, items };
  }
  return { ...withoutTier, unrankedItemIds: [...board.unrankedItemIds, ...tier.itemIds] };
}

/** Duplicate a tier's name and color directly below it. Items stay put. */
export function duplicateTier(board: TierBoard, tierId: string): TierBoard {
  const index = tierIndex(board, tierId);
  const tier = board.tiers[index];
  if (!tier) return board;
  return addTier(board, { name: `${tier.name} copy`, color: tier.color }, index + 1);
}

export function moveTier(board: TierBoard, fromIndex: number, toIndex: number): TierBoard {
  const count = board.tiers.length;
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= count) return board;
  const tiers = [...board.tiers];
  const [moved] = tiers.splice(fromIndex, 1);
  tiers.splice(Math.max(0, Math.min(toIndex, count - 1)), 0, moved!);
  return { ...board, tiers };
}

/**
 * Apply a tier preset. Existing tiers are renamed/recolored by position so
 * rankings survive; surplus tiers are removed with their items returned to
 * Unranked; missing tiers are created.
 */
export function applyTierPreset(board: TierBoard, preset: TierPreset): TierBoard {
  const tiers: Tier[] = preset.tiers.map((spec, index) => {
    const existing = board.tiers[index];
    return existing
      ? { ...existing, name: spec.name, color: spec.color }
      : { id: createId(), name: spec.name, color: spec.color, itemIds: [] };
  });
  const orphaned = board.tiers.slice(preset.tiers.length).flatMap((tier) => tier.itemIds);
  return { ...board, tiers, unrankedItemIds: [...board.unrankedItemIds, ...orphaned] };
}

export function recolorTiers(board: TierBoard, colorAt: (index: number, total: number) => string) {
  return {
    ...board,
    tiers: board.tiers.map((tier, index) => ({
      ...tier,
      color: colorAt(index, board.tiers.length),
    })),
  };
}

// ---------------------------------------------------------------------------
// Bulk

/** Return every ranked item to Unranked (tier order, top to bottom) without deleting. */
export function clearRankings(board: TierBoard): TierBoard {
  const ranked = rankedItemIds(board);
  if (ranked.length === 0) return board;
  return {
    ...board,
    unrankedItemIds: [...ranked, ...board.unrankedItemIds],
    tiers: board.tiers.map((tier) => ({ ...tier, itemIds: [] })),
  };
}

export function deleteAllItems(board: TierBoard): TierBoard {
  return {
    ...board,
    items: {},
    unrankedItemIds: [],
    tiers: board.tiers.map((tier) => ({ ...tier, itemIds: [] })),
  };
}

export type SortMode = 'az' | 'za' | 'shuffle';

export function shuffled<T>(values: T[], random: () => number = Math.random): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function sortContainer(
  board: TierBoard,
  containerId: ContainerId,
  mode: SortMode,
  random: () => number = Math.random,
): TierBoard {
  const ids = getContainerItems(board, containerId);
  if (ids.length < 2) return board;
  const nameOf = (id: string) => board.items[id]?.name ?? '';
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const sorted =
    mode === 'shuffle'
      ? shuffled(ids, random)
      : [...ids].sort((a, b) => collator.compare(nameOf(a), nameOf(b)) * (mode === 'az' ? 1 : -1));
  return setContainerItems(board, containerId, sorted);
}

/** Reorder a subset of a container's items into the given order, keeping their slots. */
export function reorderWithin(
  board: TierBoard,
  containerId: ContainerId,
  orderedSubset: string[],
): TierBoard {
  const ids = getContainerItems(board, containerId);
  const subset = new Set(orderedSubset);
  const queue = orderedSubset.filter((id) => ids.includes(id));
  const next = ids.map((id) => (subset.has(id) ? queue.shift()! : id));
  return setContainerItems(board, containerId, next);
}

/**
 * Place items into tiers by bucket: buckets[i] goes to the i-th tier, in
 * order, appended after any items already there.
 */
export function applyBuckets(board: TierBoard, buckets: string[][]): TierBoard {
  let next = board;
  buckets.forEach((bucket, index) => {
    const tier = next.tiers[index];
    if (!tier) return;
    for (const itemId of bucket) next = moveItem(next, itemId, tier.id);
  });
  return next;
}

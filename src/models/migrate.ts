/**
 * Schema migration + validation. Anything that enters the app from outside
 * (localStorage from an older version, JSON imports, share links) goes through
 * {@link migrateBoard}, which returns a structurally valid current-version board.
 */
import { createId, nowIso } from '@/lib/ids';
import { CLASSIC_COLORS } from '@/features/ranking/presets';
import {
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
  type BoardSettings,
  type BoardThemeId,
  type RankItem,
  type Tier,
  type TierBoard,
} from './board';

export class BoardImportError extends Error {
  override name = 'BoardImportError';
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;
const THEMES: BoardThemeId[] = ['classic', 'neon', 'minimal', 'retro', 'arcade'];

/**
 * v0 → v1. "v0" is the loose, unversioned shape people are likely to hand-write
 * or that early builds produced:
 *   { title, tiers: [{ name, color, items: ["Name" | { name, ... }] }], unranked: [...] }
 */
function migrateV0(raw: Json): Json {
  const items: Record<string, Json> = {};
  const toIds = (list: unknown): string[] =>
    Array.isArray(list)
      ? list.flatMap((entry) => {
          const item = typeof entry === 'string' ? { name: entry } : isObject(entry) ? entry : null;
          if (!item || !str(item.name)) return [];
          const id = str(item.id) ?? createId();
          items[id] = { ...item, id };
          return [id];
        })
      : [];

  const tiers = Array.isArray(raw.tiers)
    ? raw.tiers.filter(isObject).map((tier, index) => ({
        id: str(tier.id) ?? createId(),
        name: str(tier.name) ?? `Tier ${index + 1}`,
        color: str(tier.color) ?? CLASSIC_COLORS[index % CLASSIC_COLORS.length],
        itemIds: toIds(tier.items ?? tier.itemIds),
      }))
    : [];

  return {
    ...raw,
    schemaVersion: 1,
    tiers,
    unrankedItemIds: toIds(raw.unranked ?? raw.unrankedItems),
    items,
  };
}

const MIGRATIONS: Record<number, (raw: Json) => Json> = {
  0: migrateV0,
};

function sanitizeItem(id: string, raw: unknown): RankItem | null {
  if (!isObject(raw)) return null;
  const name = str(raw.name);
  if (!name) return null;
  const item: RankItem = { id, name: name.slice(0, 200) };
  const optional = ['subtitle', 'emoji', 'image', 'accent', 'notes', 'url', 'hotTakeNote'] as const;
  for (const key of optional) {
    const value = str(raw[key]);
    if (value) item[key] = value;
  }
  if (raw.hotTake === true) item.hotTake = true;
  return item;
}

function sanitizeSettings(raw: unknown): BoardSettings {
  const settings = isObject(raw) ? raw : {};
  return {
    theme: THEMES.includes(settings.theme as BoardThemeId)
      ? (settings.theme as BoardThemeId)
      : DEFAULT_SETTINGS.theme,
    showCounts:
      typeof settings.showCounts === 'boolean' ? settings.showCounts : DEFAULT_SETTINGS.showCounts,
    showBranding:
      typeof settings.showBranding === 'boolean'
        ? settings.showBranding
        : DEFAULT_SETTINGS.showBranding,
    itemSize: settings.itemSize === 'compact' ? 'compact' : 'comfortable',
  };
}

/**
 * Enforce invariants on a current-version board: every referenced item exists,
 * each item appears in exactly one container, and orphans land in Unranked.
 */
function normalize(raw: Json): TierBoard {
  const rawItems = isObject(raw.items) ? raw.items : {};
  const items: Record<string, RankItem> = {};
  for (const [id, value] of Object.entries(rawItems)) {
    const item = sanitizeItem(id, value);
    if (item) items[id] = item;
  }

  const placed = new Set<string>();
  const claim = (list: unknown): string[] =>
    Array.isArray(list)
      ? list.filter((id): id is string => {
          if (typeof id !== 'string' || !items[id] || placed.has(id)) return false;
          placed.add(id);
          return true;
        })
      : [];

  const tierIds = new Set<string>();
  const tiers: Tier[] = (Array.isArray(raw.tiers) ? raw.tiers : [])
    .filter(isObject)
    .map((tier, index) => {
      let id = str(tier.id) ?? createId();
      if (tierIds.has(id) || id === 'unranked') id = createId();
      tierIds.add(id);
      return {
        id,
        name: typeof tier.name === 'string' ? tier.name.slice(0, 60) : `Tier ${index + 1}`,
        color: str(tier.color) ?? CLASSIC_COLORS[index % CLASSIC_COLORS.length]!,
        itemIds: claim(tier.itemIds),
      };
    });

  const unrankedItemIds = claim(raw.unrankedItemIds);
  for (const id of Object.keys(items)) if (!placed.has(id)) unrankedItemIds.push(id);

  const now = nowIso();
  return {
    id: str(raw.id) ?? createId(),
    schemaVersion: SCHEMA_VERSION,
    title: (str(raw.title) ?? 'Untitled board').slice(0, 120),
    description: str(raw.description),
    createdAt: str(raw.createdAt) ?? now,
    updatedAt: str(raw.updatedAt) ?? now,
    tiers,
    unrankedItemIds,
    items,
    settings: sanitizeSettings(raw.settings),
  };
}

export function migrateBoard(input: unknown): TierBoard {
  if (!isObject(input)) throw new BoardImportError('That file does not contain a Tierboard board.');
  let raw = input;
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    throw new BoardImportError(
      `This board was made with a newer version of Tierboard (schema ${version}). Refresh the page to update.`,
    );
  }
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new BoardImportError(`Unsupported schema version ${version}.`);
    raw = step(raw);
    version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : version + 1;
  }
  if (!Array.isArray(raw.tiers)) throw new BoardImportError('The board has no tiers.');
  return normalize(raw);
}

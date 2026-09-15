/**
 * Core data model. Everything the app persists, shares or exports is a
 * TierBoard. Keep it plain JSON (no classes, no Dates) so it can be stored,
 * diffed, serialized and migrated without ceremony.
 */

export const SCHEMA_VERSION = 1;

/** Container id used for the Unranked tray. Tier ids never collide with it. */
export const UNRANKED_ID = 'unranked';

/** Either a tier id or {@link UNRANKED_ID}. */
export type ContainerId = string;

export interface RankItem {
  id: string;
  name: string;
  subtitle?: string;
  emoji?: string;
  /** http(s) URL, data: URL, or `local:<id>` for an image stored in IndexedDB. */
  image?: string;
  /** Optional accent color (hex). */
  accent?: string;
  notes?: string;
  url?: string;
  hotTake?: boolean;
  hotTakeNote?: string;
}

export interface Tier {
  id: string;
  name: string;
  color: string;
  itemIds: string[];
}

export type BoardThemeId = 'classic' | 'neon' | 'minimal' | 'retro' | 'arcade';

export interface BoardSettings {
  theme: BoardThemeId;
  showCounts: boolean;
  /** Show "Made with Tierboard" on exported images. */
  showBranding: boolean;
  itemSize: 'compact' | 'comfortable';
}

export interface TierBoard {
  id: string;
  schemaVersion: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tiers: Tier[];
  unrankedItemIds: string[];
  items: Record<string, RankItem>;
  settings: BoardSettings;
}

/** Lightweight listing entry for the board picker. */
export interface BoardSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  itemCount: number;
  rankedCount: number;
  /** Tier colors + counts for the mini preview. */
  preview: { color: string; count: number }[];
}

export const DEFAULT_SETTINGS: BoardSettings = {
  theme: 'classic',
  showCounts: false,
  showBranding: true,
  itemSize: 'comfortable',
};

export function summarizeBoard(board: TierBoard): BoardSummary {
  const rankedCount = board.tiers.reduce((sum, tier) => sum + tier.itemIds.length, 0);
  return {
    id: board.id,
    title: board.title,
    updatedAt: board.updatedAt,
    createdAt: board.createdAt,
    itemCount: Object.keys(board.items).length,
    rankedCount,
    preview: board.tiers.map((tier) => ({ color: tier.color, count: tier.itemIds.length })),
  };
}

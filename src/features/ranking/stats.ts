import type { TierBoard } from '@/models/board';

export interface TierStat {
  id: string;
  name: string;
  color: string;
  count: number;
  /** Share of ranked items, 0–100. */
  percent: number;
}

export interface BoardStats {
  total: number;
  ranked: number;
  unranked: number;
  percentRanked: number;
  tiers: TierStat[];
  mostCrowded: TierStat | null;
  emptyTiers: TierStat[];
  hotTakes: number;
}

export function computeStats(board: TierBoard): BoardStats {
  const ranked = board.tiers.reduce((sum, tier) => sum + tier.itemIds.length, 0);
  const total = Object.keys(board.items).length;
  const tiers = board.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    color: tier.color,
    count: tier.itemIds.length,
    percent: ranked ? Math.round((tier.itemIds.length / ranked) * 100) : 0,
  }));
  const mostCrowded = tiers.reduce<TierStat | null>(
    (best, tier) => (tier.count > 0 && (!best || tier.count > best.count) ? tier : best),
    null,
  );
  return {
    total,
    ranked,
    unranked: board.unrankedItemIds.length,
    percentRanked: total ? Math.round((ranked / total) * 100) : 0,
    tiers,
    mostCrowded,
    emptyTiers: tiers.filter((tier) => tier.count === 0),
    hotTakes: Object.values(board.items).filter((item) => item.hotTake).length,
  };
}

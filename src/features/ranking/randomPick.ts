import type { TierBoard } from '@/models/board';

export function pickRandom<T>(
  values: T[],
  random: () => number = Math.random,
  avoid?: T,
): T | undefined {
  if (values.length === 0) return undefined;
  const pool =
    values.length > 1 && avoid !== undefined ? values.filter((v) => v !== avoid) : values;
  return pool[Math.floor(random() * pool.length)];
}

export interface DebatePair {
  a: string;
  b: string;
}

/**
 * Two ranked items from neighbouring tiers when possible — those are the
 * arguments worth having ("is One Guy really a tier below Capital?").
 */
export function pickDebatePair(
  board: TierBoard,
  random: () => number = Math.random,
): DebatePair | null {
  const filled = board.tiers
    .map((tier, index) => ({ tier, index }))
    .filter(({ tier }) => tier.itemIds.length > 0);
  const ranked = filled.flatMap(({ tier }) => tier.itemIds);
  if (ranked.length < 2) return null;

  const neighbours = filled
    .slice(0, -1)
    .filter((_, i) => filled[i + 1]!.index - filled[i]!.index <= 2);
  if (neighbours.length > 0 && random() < 0.75) {
    const start = pickRandom(neighbours, random)!;
    const next = filled[filled.indexOf(start) + 1]!;
    return {
      a: pickRandom(start.tier.itemIds, random)!,
      b: pickRandom(next.tier.itemIds, random)!,
    };
  }
  const a = pickRandom(ranked, random)!;
  const b = pickRandom(ranked, random, a)!;
  return { a, b };
}

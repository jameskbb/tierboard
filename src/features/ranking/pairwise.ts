/**
 * Comparison mode: build a full ordering from "Which is better?" answers using
 * binary insertion sort. Each new item is placed by binary search against the
 * already-sorted list, so n items need about n·log2(n) questions — ~40 for 15
 * pizza places, ~100 for 30. Simple, predictable, and easy to resume.
 */
import { shuffled } from './boardOps';

export interface CompareState {
  /** Best first. */
  sorted: string[];
  /** Items still waiting to be placed (after `current`). */
  queue: string[];
  current: string | null;
  lo: number;
  hi: number;
  answered: number;
  total: number;
}

export function estimateComparisons(count: number): number {
  let total = 0;
  for (let k = 1; k < count; k++) total += Math.ceil(Math.log2(k + 1));
  return total;
}

export function startCompare(ids: string[], random: () => number = Math.random): CompareState {
  const [first, current = null, ...queue] = shuffled(ids, random);
  const sorted = first === undefined ? [] : [first];
  return {
    sorted,
    queue,
    current,
    lo: 0,
    hi: sorted.length,
    answered: 0,
    total: estimateComparisons(ids.length),
  };
}

/** The pair to show: [challenger, incumbent]. Null when finished. */
export function currentPair(state: CompareState): [string, string] | null {
  if (state.current === null) return null;
  const mid = Math.floor((state.lo + state.hi) / 2);
  return [state.current, state.sorted[mid]!];
}

/** Record an answer: did the challenger (`current`) beat the incumbent? */
export function answerCompare(state: CompareState, challengerWins: boolean): CompareState {
  if (state.current === null) return state;
  const mid = Math.floor((state.lo + state.hi) / 2);
  let { lo, hi } = state;
  if (challengerWins) hi = mid;
  else lo = mid + 1;
  const answered = state.answered + 1;

  if (lo < hi) return { ...state, lo, hi, answered };

  const sorted = [...state.sorted];
  sorted.splice(lo, 0, state.current);
  const [next = null, ...queue] = state.queue;
  return {
    ...state,
    sorted,
    queue,
    current: next,
    lo: 0,
    hi: sorted.length,
    answered,
    // Keep the estimate honest as we go.
    total: Math.max(state.total, answered),
  };
}

export const isCompareDone = (state: CompareState) => state.current === null;

/**
 * Suggested items-per-tier for `count` ranked items over `tierCount` tiers.
 * Middle tiers get more weight (1,2,3,3,2,1 for six tiers), so S and F stay
 * special. Uses largest-remainder rounding; always sums to `count`.
 */
export function suggestTierCounts(count: number, tierCount: number): number[] {
  if (tierCount <= 0) return [];
  const weights = Array.from({ length: tierCount }, (_, i) => 1 + Math.min(i, tierCount - 1 - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / totalWeight) * count);
  const counts = exact.map(Math.floor);
  let remaining = count - counts.reduce((a, b) => a + b, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const { index } of order) {
    if (remaining <= 0) break;
    counts[index]!++;
    remaining--;
  }
  return counts;
}

export function bucketize(sorted: string[], counts: number[]): string[][] {
  const buckets: string[][] = [];
  let start = 0;
  for (const count of counts) {
    buckets.push(sorted.slice(start, start + count));
    start += count;
  }
  // Anything left over (counts summing short) lands in the last tier.
  if (start < sorted.length && buckets.length)
    buckets[buckets.length - 1]!.push(...sorted.slice(start));
  return buckets;
}

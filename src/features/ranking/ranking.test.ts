import { describe, expect, it } from 'vitest';
import { addItems, createBoard, moveItem, updateItem } from './boardOps';
import {
  answerCompare,
  bucketize,
  currentPair,
  estimateComparisons,
  isCompareDone,
  startCompare,
  suggestTierCounts,
} from './pairwise';
import { pickDebatePair, pickRandom } from './randomPick';
import { computeStats } from './stats';

function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('pairwise comparison', () => {
  it('recovers the true order from consistent answers', () => {
    const truth = Array.from({ length: 15 }, (_, i) => `p${i}`);
    let state = startCompare(truth, seeded());
    let questions = 0;
    while (!isCompareDone(state)) {
      const [challenger, incumbent] = currentPair(state)!;
      state = answerCompare(state, truth.indexOf(challenger) < truth.indexOf(incumbent));
      questions++;
    }
    expect(state.sorted).toEqual(truth);
    expect(questions).toBeLessThanOrEqual(estimateComparisons(15));
  });

  it('handles tiny lists', () => {
    expect(isCompareDone(startCompare(['only']))).toBe(true);
    expect(startCompare([]).sorted).toEqual([]);
  });

  it('suggests tier counts that favour the middle and sum to the total', () => {
    const counts = suggestTierCounts(15, 6);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(15);
    expect(counts[0]!).toBeLessThanOrEqual(counts[2]!);
    expect(counts[5]!).toBeLessThanOrEqual(counts[3]!);
    expect(suggestTierCounts(3, 6).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('buckets a sorted list by counts', () => {
    expect(bucketize(['a', 'b', 'c', 'd'], [1, 2, 1])).toEqual([['a'], ['b', 'c'], ['d']]);
  });
});

describe('random helpers', () => {
  it('avoids repeating the previous pick when possible', () => {
    for (let i = 0; i < 20; i++) expect(pickRandom(['a', 'b'], Math.random, 'a')).toBe('b');
    expect(pickRandom([], Math.random)).toBeUndefined();
  });

  it('picks two different ranked items for a debate', () => {
    const { board, added } = addItems(createBoard(), [{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
    expect(pickDebatePair(board)).toBeNull();
    let next = moveItem(board, added[0]!.id, board.tiers[0]!.id);
    next = moveItem(next, added[1]!.id, board.tiers[1]!.id);
    for (let i = 0; i < 20; i++) {
      const pair = pickDebatePair(next)!;
      expect(pair.a).not.toBe(pair.b);
    }
  });
});

describe('stats', () => {
  it('summarizes the board', () => {
    const { board, added } = addItems(createBoard(), [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
    ]);
    let next = moveItem(board, added[0]!.id, board.tiers[0]!.id);
    next = moveItem(next, added[1]!.id, board.tiers[0]!.id);
    next = moveItem(next, added[2]!.id, board.tiers[2]!.id);
    next = updateItem(next, added[2]!.id, { hotTake: true });
    const stats = computeStats(next);
    expect(stats).toMatchObject({
      total: 4,
      ranked: 3,
      unranked: 1,
      hotTakes: 1,
      percentRanked: 75,
    });
    expect(stats.mostCrowded?.name).toBe('S');
    expect(stats.tiers[0]!.percent).toBe(67);
    expect(stats.emptyTiers.map((t) => t.name)).toEqual(['A', 'C', 'D', 'F']);
  });
});

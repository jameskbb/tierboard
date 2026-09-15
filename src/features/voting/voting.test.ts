import { describe, expect, it } from 'vitest';
import {
  applyVote,
  createLocalVoteChannel,
  emptyTally,
  tierVoteResult,
  upDownVerdict,
  type VoteEvent,
} from './voting';

const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
const vote = (tierId: string, delta: 1 | -1 = 1): VoteEvent => ({
  itemId: 'capital',
  choice: { kind: 'tier', tierId },
  delta,
});

function tallyOf(votes: Record<string, number>) {
  let tally = emptyTally('capital');
  for (const [tier, count] of Object.entries(votes)) {
    for (let i = 0; i < count; i++) tally = applyVote(tally, vote(tier));
  }
  return tally;
}

describe('tier voting', () => {
  it('picks the plurality (S+2, A+5, B+1 → A)', () => {
    expect(tierVoteResult(tiers, tallyOf({ S: 2, A: 5, B: 1 }))).toEqual({
      winnerTierId: 'A',
      total: 8,
      tieBroken: false,
    });
  });

  it('breaks ties with the median vote', () => {
    // S:3, C:3, F:1 → median lands in C.
    const result = tierVoteResult(tiers, tallyOf({ S: 3, C: 3, F: 1 }));
    expect(result.winnerTierId).toBe('C');
    expect(result.tieBroken).toBe(true);
  });

  it('has no result without votes and never goes negative', () => {
    let tally = emptyTally('capital');
    tally = applyVote(tally, vote('S', -1));
    expect(tally.tiers.S).toBe(0);
    expect(tierVoteResult(tiers, tally).winnerTierId).toBeNull();
  });

  it('ignores votes for other items', () => {
    const tally = applyVote(emptyTally('capital'), { ...vote('S'), itemId: 'other' });
    expect(tally.tiers).toEqual({});
  });
});

describe('up/down voting', () => {
  it('returns a verdict', () => {
    expect(upDownVerdict({ up: 3, down: 1 })).toBe('up');
    expect(upDownVerdict({ up: 1, down: 4 })).toBe('down');
    expect(upDownVerdict({ up: 2, down: 2 })).toBe('stay');
  });
});

describe('vote channel', () => {
  it('delivers events to subscribers until they unsubscribe', () => {
    const channel = createLocalVoteChannel();
    const received: VoteEvent[] = [];
    const unsubscribe = channel.subscribe((event) => received.push(event));
    channel.publish(vote('S'));
    unsubscribe();
    channel.publish(vote('A'));
    expect(received).toHaveLength(1);
  });
});

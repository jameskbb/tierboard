/**
 * Local group voting around one shared screen. Votes are modelled as events
 * applied to a tally, so a future realtime backend can feed the same reducer
 * from participants' phones via a {@link VoteChannel}.
 */

export type VoteChoice = { kind: 'tier'; tierId: string } | { kind: 'updown'; direction: 1 | -1 };

export interface VoteEvent {
  itemId: string;
  choice: VoteChoice;
  /** +1 to add a vote, -1 to take one back. */
  delta: 1 | -1;
  /** Present once votes come from individual devices. */
  voterId?: string;
}

export interface VoteTally {
  itemId: string;
  tiers: Record<string, number>;
  up: number;
  down: number;
}

export function emptyTally(itemId: string): VoteTally {
  return { itemId, tiers: {}, up: 0, down: 0 };
}

export function applyVote(tally: VoteTally, event: VoteEvent): VoteTally {
  if (event.itemId !== tally.itemId) return tally;
  if (event.choice.kind === 'tier') {
    const current = tally.tiers[event.choice.tierId] ?? 0;
    return {
      ...tally,
      tiers: { ...tally.tiers, [event.choice.tierId]: Math.max(0, current + event.delta) },
    };
  }
  const key = event.choice.direction === 1 ? 'up' : 'down';
  return { ...tally, [key]: Math.max(0, tally[key] + event.delta) };
}

export interface TierVoteResult {
  winnerTierId: string | null;
  total: number;
  /** True when the plurality was tied and the median broke the tie. */
  tieBroken: boolean;
}

/**
 * Plurality wins. Ties are broken by the weighted median vote, so a split
 * between S and B lands where the room's middle opinion is.
 */
export function tierVoteResult(tierOrder: string[], tally: VoteTally): TierVoteResult {
  const counts = tierOrder.map((id) => tally.tiers[id] ?? 0);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return { winnerTierId: null, total, tieBroken: false };
  const max = Math.max(...counts);
  const leaders = tierOrder.filter((_, index) => counts[index] === max);
  if (leaders.length === 1) return { winnerTierId: leaders[0]!, total, tieBroken: false };

  let running = 0;
  let medianIndex = 0;
  for (let i = 0; i < counts.length; i++) {
    running += counts[i]!;
    if (running >= total / 2) {
      medianIndex = i;
      break;
    }
  }
  const winner = leaders.reduce((best, id) =>
    Math.abs(tierOrder.indexOf(id) - medianIndex) < Math.abs(tierOrder.indexOf(best) - medianIndex)
      ? id
      : best,
  );
  return { winnerTierId: winner, total, tieBroken: true };
}

export type UpDownVerdict = 'up' | 'down' | 'stay';

export function upDownVerdict(tally: Pick<VoteTally, 'up' | 'down'>): UpDownVerdict {
  if (tally.up > tally.down) return 'up';
  if (tally.down > tally.up) return 'down';
  return 'stay';
}

/** Transport seam for future multiplayer voting. */
export interface VoteChannel {
  publish(event: VoteEvent): void;
  subscribe(listener: (event: VoteEvent) => void): () => void;
}

/** In-memory channel used for single-screen voting today. */
export function createLocalVoteChannel(): VoteChannel {
  const listeners = new Set<(event: VoteEvent) => void>();
  return {
    publish(event) {
      for (const listener of listeners) listener(event);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

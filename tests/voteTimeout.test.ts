import { describe, it, expect } from 'vitest';
import { getVoteTimeout } from '../src/games/undercover/types';

describe('getVoteTimeout', () => {
  it('returns 20s for 5 players', () => expect(getVoteTimeout(5)).toBe(20_000));
  it('returns 20s for 6 players', () => expect(getVoteTimeout(6)).toBe(20_000));
  it('returns 30s for 7 players', () => expect(getVoteTimeout(7)).toBe(30_000));
  it('returns 30s for 9 players', () => expect(getVoteTimeout(9)).toBe(30_000));
  it('returns 40s for 10 players', () => expect(getVoteTimeout(10)).toBe(40_000));
  it('returns 40s for 12 players', () => expect(getVoteTimeout(12)).toBe(40_000));
  it('returns 40s for very large count', () => expect(getVoteTimeout(50)).toBe(40_000));
});

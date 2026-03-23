import { describe, it, expect } from 'vitest';
import { getSpyCount, assignRolesAndWords, suggestDifficulty } from '../src/games/undercover/words';
import type { UndercoverPlayer } from '../src/games/undercover/types';

function makePlayers(count: number): UndercoverPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    userId: i + 1,
    name: `Player${i + 1}`,
    alive: true,
  }));
}

describe('getSpyCount', () => {
  it('returns 1 spy for 5 players', () => expect(getSpyCount(5)).toBe(1));
  it('returns 1 spy for 6 players', () => expect(getSpyCount(6)).toBe(1));
  it('returns 2 spies for 7 players', () => expect(getSpyCount(7)).toBe(2));
  it('returns 2 spies for 9 players', () => expect(getSpyCount(9)).toBe(2));
  it('returns 3 spies for 10 players', () => expect(getSpyCount(10)).toBe(3));
  it('returns 3 spies for 12 players', () => expect(getSpyCount(12)).toBe(3));
  it('handles edge case: 4 players → at least 1', () => expect(getSpyCount(4)).toBeGreaterThanOrEqual(1));
  it('handles edge case: 20 players → floor(20/4)=5', () => expect(getSpyCount(20)).toBe(5));
});

describe('assignRolesAndWords', () => {
  it('assigns correct number of spies and civilians', () => {
    const players = makePlayers(8);
    const result = assignRolesAndWords(players, 'apple', 'orange');
    const spies = result.filter((p) => p.role === 'SPY');
    const civilians = result.filter((p) => p.role === 'CIVILIAN');
    expect(spies.length).toBe(2); // 8 players → 2 spies
    expect(civilians.length).toBe(6);
  });

  it('assigns correct words to each role', () => {
    const players = makePlayers(6);
    const result = assignRolesAndWords(players, 'cat', 'dog');
    for (const p of result) {
      if (p.role === 'SPY') expect(p.word).toBe('dog');
      if (p.role === 'CIVILIAN') expect(p.word).toBe('cat');
    }
  });

  it('preserves player count', () => {
    const players = makePlayers(10);
    const result = assignRolesAndWords(players, 'a', 'b');
    expect(result.length).toBe(10);
  });

  it('every player has a role and word', () => {
    const players = makePlayers(7);
    const result = assignRolesAndWords(players, 'x', 'y');
    for (const p of result) {
      expect(p.role).toBeDefined();
      expect(p.word).toBeDefined();
      expect(['SPY', 'CIVILIAN']).toContain(p.role);
    }
  });
});

describe('suggestDifficulty', () => {
  it('returns easy for game 1', () => expect(suggestDifficulty(1)).toBe('easy'));
  it('returns medium for game 2', () => expect(suggestDifficulty(2)).toBe('medium'));
  it('returns medium for game 3', () => expect(suggestDifficulty(3)).toBe('medium'));
  it('returns hard for game 4', () => expect(suggestDifficulty(4)).toBe('hard'));
  it('returns hard for game 100', () => expect(suggestDifficulty(100)).toBe('hard'));
});

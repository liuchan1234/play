import { describe, it, expect } from 'vitest';
import { checkWinCondition } from '../src/games/undercover/winCondition';
import type { UndercoverPlayer } from '../src/games/undercover/types';

function makePlayer(id: number, role: 'SPY' | 'CIVILIAN', alive: boolean): UndercoverPlayer {
  return { userId: id, name: `Player${id}`, alive, role, word: 'test' };
}

describe('checkWinCondition', () => {
  it('returns civilians_win when all spies are eliminated', () => {
    const players = [
      makePlayer(1, 'SPY', false),
      makePlayer(2, 'CIVILIAN', true),
      makePlayer(3, 'CIVILIAN', true),
      makePlayer(4, 'CIVILIAN', true),
    ];
    expect(checkWinCondition(players)).toBe('civilians_win');
  });

  it('returns spies_win when spies >= civilians', () => {
    const players = [
      makePlayer(1, 'SPY', true),
      makePlayer(2, 'CIVILIAN', true),
      makePlayer(3, 'CIVILIAN', false),
      makePlayer(4, 'CIVILIAN', false),
    ];
    // 1 spy alive, 1 civilian alive → spies >= civilians
    expect(checkWinCondition(players)).toBe('spies_win');
  });

  it('returns continue when spies < civilians and spies alive', () => {
    const players = [
      makePlayer(1, 'SPY', true),
      makePlayer(2, 'CIVILIAN', true),
      makePlayer(3, 'CIVILIAN', true),
      makePlayer(4, 'CIVILIAN', true),
    ];
    expect(checkWinCondition(players)).toBe('continue');
  });

  it('returns spies_win when 2 spies vs 2 civilians', () => {
    const players = [
      makePlayer(1, 'SPY', true),
      makePlayer(2, 'SPY', true),
      makePlayer(3, 'CIVILIAN', true),
      makePlayer(4, 'CIVILIAN', true),
      makePlayer(5, 'CIVILIAN', false),
    ];
    expect(checkWinCondition(players)).toBe('spies_win');
  });

  it('returns continue when 2 spies vs 3 civilians', () => {
    const players = [
      makePlayer(1, 'SPY', true),
      makePlayer(2, 'SPY', true),
      makePlayer(3, 'CIVILIAN', true),
      makePlayer(4, 'CIVILIAN', true),
      makePlayer(5, 'CIVILIAN', true),
    ];
    expect(checkWinCondition(players)).toBe('continue');
  });

  it('returns civilians_win when multiple spies all eliminated', () => {
    const players = [
      makePlayer(1, 'SPY', false),
      makePlayer(2, 'SPY', false),
      makePlayer(3, 'CIVILIAN', true),
      makePlayer(4, 'CIVILIAN', true),
      makePlayer(5, 'CIVILIAN', true),
    ];
    expect(checkWinCondition(players)).toBe('civilians_win');
  });

  it('handles edge case: 1 spy vs 0 civilians (spy wins)', () => {
    const players = [
      makePlayer(1, 'SPY', true),
      makePlayer(2, 'CIVILIAN', false),
      makePlayer(3, 'CIVILIAN', false),
    ];
    expect(checkWinCondition(players)).toBe('spies_win');
  });
});

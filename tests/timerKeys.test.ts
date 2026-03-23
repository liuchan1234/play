import { describe, it, expect } from 'vitest';
import {
  timerKey,
  resolverKey,
  phaseToTimerSuffix,
  phaseToDeadlineType,
  ALL_TIMER_SUFFIXES,
  ALL_RESOLVER_PHASES,
} from '../src/games/undercover/timerKeys';

describe('timerKey', () => {
  it('produces expected format', () => {
    expect(timerKey(3, 'speaking')).toBe('undercover_3_speaking');
    expect(timerKey(1, 'countdown_10')).toBe('undercover_1_countdown_10');
  });
});

describe('resolverKey', () => {
  it('produces expected format', () => {
    expect(resolverKey(-100123, 2, 'vote')).toBe('undercover_-100123_2_vote');
    expect(resolverKey(456, 1, 'speaking')).toBe('undercover_456_1_speaking');
  });
});

describe('phaseToTimerSuffix', () => {
  it('maps speaking → speaking', () => expect(phaseToTimerSuffix('speaking')).toBe('speaking'));
  it('maps freetalk → free_talk', () => expect(phaseToTimerSuffix('freetalk')).toBe('free_talk'));
  it('maps vote → vote_timeout', () => expect(phaseToTimerSuffix('vote')).toBe('vote_timeout'));
});

describe('phaseToDeadlineType', () => {
  it('maps speaking → speaking', () => expect(phaseToDeadlineType('speaking')).toBe('speaking'));
  it('maps freetalk → freetalk', () => expect(phaseToDeadlineType('freetalk')).toBe('freetalk'));
  it('maps vote → vote', () => expect(phaseToDeadlineType('vote')).toBe('vote'));
});

describe('constants', () => {
  it('ALL_TIMER_SUFFIXES has 8 entries', () => {
    expect(ALL_TIMER_SUFFIXES.length).toBe(8);
  });

  it('ALL_RESOLVER_PHASES has 3 entries', () => {
    expect(ALL_RESOLVER_PHASES.length).toBe(3);
  });

  it('phaseToTimerSuffix output is always in ALL_TIMER_SUFFIXES', () => {
    for (const phase of ALL_RESOLVER_PHASES) {
      const suffix = phaseToTimerSuffix(phase);
      expect(ALL_TIMER_SUFFIXES).toContain(suffix);
    }
  });
});

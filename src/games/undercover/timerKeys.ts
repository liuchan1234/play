/**
 * timerKeys.ts — Centralized key construction for undercover timers and resolvers.
 *
 * All timer/resolver keys are built here to prevent typo-related bugs.
 * Timer keys are used with setChatTimeout/clearChatTimeout.
 * Resolver keys are used with pendingUndercoverResolvers Map.
 */

// ─── Timer keys (used with setChatTimeout) ──────────────────────────────────

/** Timer suffixes — the complete set of timer types for cleanup */
export const ALL_TIMER_SUFFIXES = [
  'countdown_10',
  'start',
  'speaking',
  'free_talk',
  'vote_timeout',
  'speak_10s_warn',
  'freetalk_10s_warn',
  'next_round',
] as const;

export type TimerSuffix = typeof ALL_TIMER_SUFFIXES[number];

/** Build a timer key for setChatTimeout. Format: undercover_{roomId}_{suffix} */
export function timerKey(roomId: number, suffix: TimerSuffix): string {
  return `undercover_${roomId}_${suffix}`;
}

// ─── Resolver keys (used with pendingUndercoverResolvers) ───────────────────

export type ResolverPhase = 'speaking' | 'freetalk' | 'vote';

export const ALL_RESOLVER_PHASES: ResolverPhase[] = ['speaking', 'freetalk', 'vote'];

/** Build a resolver map key. Format: undercover_{chatId}_{roomId}_{phase} */
export function resolverKey(chatId: number, roomId: number, phase: ResolverPhase): string {
  return `undercover_${chatId}_${roomId}_${phase}`;
}

// ─── Phase → timer suffix mapping ───────────────────────────────────────────

/** Maps resolver phase to the timer suffix used by waitWithSkip */
export function phaseToTimerSuffix(phase: ResolverPhase): TimerSuffix {
  switch (phase) {
    case 'speaking': return 'speaking';
    case 'freetalk': return 'free_talk';
    case 'vote': return 'vote_timeout';
  }
}

/** Maps resolver phase to the phaseDeadlineType stored in Redis */
export function phaseToDeadlineType(phase: ResolverPhase): string {
  switch (phase) {
    case 'speaking': return 'speaking';
    case 'freetalk': return 'freetalk';
    case 'vote': return 'vote';
  }
}

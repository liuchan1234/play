/**
 * Shared utility functions used across modules.
 */

import { randomInt } from 'node:crypto';

/**
 * Fisher-Yates shuffle — returns a new shuffled array without mutating the input.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

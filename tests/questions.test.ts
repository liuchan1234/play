import { describe, it, expect } from 'vitest';
import { pickQuestion } from '../src/games/truthordare/questions';

describe('pickQuestion', () => {
  it('returns a non-empty string', () => {
    const q = pickQuestion('en', 'icebreaker', 'truth', new Set());
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });

  it('returns different questions (dedup via usedSet)', () => {
    const used = new Set<string>();
    const questions = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const q = pickQuestion('en', 'icebreaker', 'truth', used);
      questions.add(q);
    }
    // Should have gotten 10 unique questions
    expect(questions.size).toBe(10);
  });

  it('resets when pool is exhausted', () => {
    const used = new Set<string>();
    // Pick a lot of questions — eventually the pool resets and repeats are allowed
    const results: string[] = [];
    for (let i = 0; i < 200; i++) {
      results.push(pickQuestion('en', 'icebreaker', 'truth', used));
    }
    // Should still get valid strings even after pool exhaustion
    expect(results.every((q) => typeof q === 'string' && q.length > 0)).toBe(true);
  });

  it('works for all tiers and types', () => {
    for (const tier of ['icebreaker', 'advanced', 'spicy'] as const) {
      for (const type of ['truth', 'dare'] as const) {
        const q = pickQuestion('en', tier, type, new Set());
        expect(q.length).toBeGreaterThan(0);
      }
    }
  });

  it('works for all supported languages', () => {
    for (const lang of ['en', 'zh', 'ru']) {
      const q = pickQuestion(lang, 'icebreaker', 'truth', new Set());
      expect(q.length).toBeGreaterThan(0);
    }
  });
});

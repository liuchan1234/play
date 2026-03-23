/**
 * Undercover word pairs by language.
 * Each pair: [civilianWord, undercoverWord]
 *
 * Word data is stored in src/data/words_{lang}.json for easy editing
 * by non-developers (ops team can add/remove pairs without touching TS).
 *
 * Quality criteria:
 * - Similar but subtly different (not obvious in 1 second)
 * - Relatable to young people / internet culture
 * - Fun to describe and debate
 * - No offensive or insensitive content
 */

import zhPairs from '../data/words_zh.json';
import enPairs from '../data/words_en.json';
import ruPairs from '../data/words_ru.json';

type WordPair = [string, string];

export const WORD_PAIRS_BY_LANG: Record<string, WordPair[]> = {
  zh: zhPairs as WordPair[],
  en: enPairs as WordPair[],
  ru: ruPairs as WordPair[],
};

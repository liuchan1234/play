/** Anonymous wall types and constants */

/** Color definition for anonymous identity */
export interface AnonColor {
  name: string;
  bg: string;
  text: string;
}

/** Active anonymous session (stored in Redis as JSON) */
export interface AnonSession {
  chatId: number;
  colorIndex: number;
  activatedAt: number;
}

/** Color identity TTL — 10 minutes */
export const COLOR_TTL_SECONDS = 600;

/** Max text length (CJK characters count as 1, others count as 1) */
export const MAX_TEXT_LENGTH = 500;

/** Min text length */
export const MIN_TEXT_LENGTH = 1;

/**
 * Effective character count: CJK chars count as 2.5 toward the limit
 * so 200 CJK chars ≈ 500 Latin chars.
 */
export function effectiveLength(text: string): number {
  let count = 0;
  for (const ch of text) {
    // CJK Unified Ideographs, CJK Extension A, Hangul, Kana, etc.
    if (/[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(ch)) {
      count += 2.5;
    } else {
      count += 1;
    }
  }
  return Math.ceil(count);
}

/** Card dimensions */
export const CARD_WIDTH = 800;
export const CARD_HEIGHT = 400;

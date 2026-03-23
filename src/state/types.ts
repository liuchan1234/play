/**
 * Core state and language types.
 *
 * ChatState stores per-chat persistent state (language, etc.).
 * Game-specific phase management lives in each game's own types
 * (e.g. UndercoverRoom.state.phase, TodSession.active).
 */

export interface ChatState {
  chatId: number;
  data: Record<string, unknown>;
}

export type LanguageCode = 'ru' | 'en' | 'zh';

export type TimerKey = string;

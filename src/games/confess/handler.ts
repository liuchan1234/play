/**
 * handler.ts — Anonymous wall (匿名大字报)
 *
 * Flow:
 *   Group: /play → menu → intro → URL deeplink button → private chat
 *   Private: user sends text → bot renders card → sends to group
 *   Session: 10-min color identity, auto-expire, /quit to exit
 *
 * Fixes applied (v1.6.1):
 *   #1  Intro page deeplink is built inline — no extra message step
 *   #3  Any /start payload auto-clears active anon session
 *   #5  sendPhoto fallback to text when group restricts media
 *   #6  Confirmation message edits in-place instead of stacking
 *   #7  /quit in group gives guidance to use private chat
 *   #9  Private chat prompts use user language, not group language
 *   #10 Validate user is member of target group before sending
 */

import { Context, Markup, Telegraf } from 'telegraf';
import { getChatLanguage, getUserLanguage } from '../../state';
import type { LanguageCode } from '../../state';
import { getTexts } from '../../i18n';
import { getRedis } from '../../state/redisClient';
import { config } from '../../config';
import { logger, errMsg } from '../../logger';
import { LruMap } from '../../lruMap';
import { getOrAssignColor, clearColor, COLORS } from './colors';
import { renderCard } from './renderer';
import { COLOR_TTL_SECONDS, MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, effectiveLength } from './types';
import type { AnonSession } from './types';

// ─── Session store ───────────────────────────────────────────────────────────

function sessionKey(userId: number): string {
  return `anon:session:${userId}`;
}

const memorySessions = new LruMap<number, AnonSession & { expiresAt: number }>(5000);

async function getSession(userId: number): Promise<AnonSession | null> {
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) {
      const raw = await redis.get(sessionKey(userId));
      if (!raw) return null;
      try { return JSON.parse(raw) as AnonSession; } catch { return null; }
    }
  }
  const entry = memorySessions.get(userId);
  if (entry && entry.expiresAt > Date.now()) return entry;
  if (entry) memorySessions.delete(userId);
  return null;
}

async function setSession(userId: number, session: AnonSession): Promise<void> {
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) {
      await redis.set(sessionKey(userId), JSON.stringify(session), 'EX', COLOR_TTL_SECONDS);
      return;
    }
  }
  memorySessions.set(userId, { ...session, expiresAt: Date.now() + COLOR_TTL_SECONDS * 1000 });
}

async function refreshSession(userId: number): Promise<void> {
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) {
      await redis.expire(sessionKey(userId), COLOR_TTL_SECONDS);
      return;
    }
  }
  const entry = memorySessions.get(userId);
  if (entry) entry.expiresAt = Date.now() + COLOR_TTL_SECONDS * 1000;
}

/**
 * Clear session and color. Exported so other modules can call it
 * (e.g. undercover /start handler to prevent session conflicts).
 */
export async function clearAnonSession(userId: number): Promise<AnonSession | null> {
  const session = await getSession(userId);
  if (!session) return null;
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) await redis.del(sessionKey(userId));
  }
  memorySessions.delete(userId);
  await clearColor(session.chatId, userId);
  return session;
}

// ─── Disabled groups ─────────────────────────────────────────────────────────

function disabledKey(chatId: number): string {
  return `anon:disabled:${chatId}`;
}

async function isDisabled(chatId: number): Promise<boolean> {
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) {
      const val = await redis.get(disabledKey(chatId));
      return val === '1';
    }
  }
  return false;
}

async function setDisabled(chatId: number, disabled: boolean): Promise<void> {
  if (config.useRedis) {
    const redis = getRedis();
    if (redis) {
      if (disabled) {
        await redis.set(disabledKey(chatId), '1');
      } else {
        await redis.del(disabledKey(chatId));
      }
    }
  }
}

// ─── Admin check ─────────────────────────────────────────────────────────────

async function isGroupAdmin(bot: Telegraf<Context>, chatId: number, userId: number): Promise<boolean> {
  try {
    const member = await bot.telegram.getChatMember(chatId, userId);
    return member.status === 'administrator' || member.status === 'creator';
  } catch {
    return false;
  }
}

// ─── User language helper (Fix #9) ──────────────────────────────────────────

/**
 * Get the best language for a user in private chat context.
 * Tries user preference first, then falls back to group language.
 */
async function getUserLang(userId: number, groupChatId: number): Promise<LanguageCode> {
  const userLang = await getUserLanguage(userId);
  if (userLang) return userLang;
  return getChatLanguage(groupChatId);
}

// ─── Deeplink encoding ──────────────────────────────────────────────────────

export function encodeChatId(chatId: number): string {
  return chatId < 0 ? `n${Math.abs(chatId)}` : String(chatId);
}

function decodeChatId(encoded: string): number {
  return encoded.startsWith('n') ? -Number(encoded.slice(1)) : Number(encoded);
}

// ─── Confirmation message tracking (Fix #6) ─────────────────────────────────

/** Track the last confirmation message per user so we can edit instead of stack */
const lastConfirmMsg = new LruMap<number, number>(5000); // userId → messageId

// ─── Register ────────────────────────────────────────────────────────────────

export function registerConfess(bot: Telegraf<Context>) {

  // ── Group entry: start_confess callback ────────────────────────────────
  //    This is now only triggered if someone clicks an old-style callback button.
  //    The intro page uses a direct URL deeplink (Fix #1), so this is a fallback.

  bot.action('start_confess', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      if (!ctx.chat || (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup')) {
        const lang = await getChatLanguage(ctx.chat?.id ?? 0);
        await ctx.reply(getTexts(lang).common.onlyGroups);
        return;
      }

      const chatId = ctx.chat.id;
      const lang = await getChatLanguage(chatId);
      const t = getTexts(lang);

      if (await isDisabled(chatId)) {
        await ctx.reply(t.anonymousChat.disabled);
        return;
      }

      const botUsername = ctx.botInfo?.username;
      if (!botUsername) {
        await ctx.reply(t.errors.generic);
        return;
      }

      try { await ctx.editMessageReplyMarkup(undefined); } catch { /* may already be edited */ }

      const deepLink = `https://t.me/${botUsername}?start=anon_${encodeChatId(chatId)}`;
      await ctx.reply(t.anonymousChat.groupPrompt, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url(t.anonymousChat.btnStart, deepLink)],
        ]).reply_markup,
      });
    } catch (err) {
      logger.error({ err: errMsg(err) }, 'start_confess handler error');
    }
  });

  // ── Private chat /start anon_{chatId} → activate session ───────────────

  bot.start(async (ctx) => {
    const payload =
      ctx.startPayload ??
      ('text' in (ctx.message || {})
        ? String((ctx.message as { text?: string }).text || '')
            .replace(/^\/start\s*/, '')
            .trim()
        : '');
    if (!payload.startsWith('anon_')) return;

    try {
      const encoded = payload.replace('anon_', '');
      const chatId = decodeChatId(encoded);

      if (!Number.isFinite(chatId)) {
        await ctx.reply('Invalid link.');
        return;
      }

      const userId = ctx.from?.id;
      if (!userId) return;

      // Fix #9: use user language for private chat prompts
      const lang = await getUserLang(userId, chatId);
      const t = getTexts(lang);

      if (await isDisabled(chatId)) {
        await ctx.reply(t.anonymousChat.disabled);
        return;
      }

      // Fix #10: verify user is actually a member of the target group
      try {
        const member = await bot.telegram.getChatMember(chatId, userId);
        if (member.status === 'left' || member.status === 'kicked') {
          await ctx.reply(t.anonymousChat.notInGroup);
          return;
        }
      } catch {
        // getChatMember can fail if bot isn't admin — skip check, allow attempt
      }

      // Fix #3: clear any existing session (prevents conflict with undercover etc.)
      const existing = await getSession(userId);
      if (existing) {
        if (existing.chatId === chatId) {
          await ctx.reply(t.anonymousChat.activatedHint, { parse_mode: 'HTML' });
          return;
        }
        await clearAnonSession(userId);
      }

      // Get chat title for display
      let chatTitle = String(chatId);
      try {
        const chatInfo = await bot.telegram.getChat(chatId);
        if ('title' in chatInfo && chatInfo.title) chatTitle = chatInfo.title;
      } catch { /* non-critical */ }

      // Assign color
      const colorIndex = await getOrAssignColor(chatId, userId);

      // Create session
      await setSession(userId, { chatId, colorIndex, activatedAt: Date.now() });

      await ctx.reply(
        `${t.anonymousChat.activated(chatTitle)}\n\n${t.anonymousChat.activatedHint}`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      logger.error({ err: errMsg(err) }, 'anon start handler error');
      try { await ctx.reply('Something went wrong. Please try again.'); } catch { /* last resort */ }
    }
  });

  // ── /quit — exit wall mode ─────────────────────────────────────────────

  bot.command('quit', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Fix #7: /quit in group gives guidance
    if (ctx.chat?.type !== 'private') {
      const lang = await getChatLanguage(ctx.chat?.id ?? 0);
      const t = getTexts(lang);
      await ctx.reply(t.anonymousChat.quitInGroup);
      return;
    }

    const session = await clearAnonSession(userId);
    if (session) {
      const lang = await getUserLang(userId, session.chatId);
      const t = getTexts(lang);
      await ctx.reply(`${t.anonymousChat.quit}\n${t.anonymousChat.quitHint}`);
    }
  });

  // ── /anon_off and /anon_on — admin controls ───────────────────────────

  bot.command('anon_off', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId || (ctx.chat?.type !== 'group' && ctx.chat?.type !== 'supergroup')) return;
    const userId = ctx.from?.id;
    if (!userId) return;

    const lang = await getChatLanguage(chatId);
    const t = getTexts(lang);

    if (!(await isGroupAdmin(bot, chatId, userId))) {
      await ctx.reply(t.anonymousChat.adminOnly);
      return;
    }

    await setDisabled(chatId, true);
    await ctx.reply(t.anonymousChat.adminOff);
  });

  bot.command('anon_on', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId || (ctx.chat?.type !== 'group' && ctx.chat?.type !== 'supergroup')) return;
    const userId = ctx.from?.id;
    if (!userId) return;

    const lang = await getChatLanguage(chatId);
    const t = getTexts(lang);

    if (!(await isGroupAdmin(bot, chatId, userId))) {
      await ctx.reply(t.anonymousChat.adminOnly);
      return;
    }

    await setDisabled(chatId, false);
    await ctx.reply(t.anonymousChat.adminOn);
  });

  // ── Private chat text messages — the core message pipe ─────────────────

  bot.on('text', async (ctx, next) => {
    if (ctx.chat?.type !== 'private') return next();

    const userId = ctx.from?.id;
    if (!userId) return next();

    const message = ctx.message;
    if (!('text' in message)) return next();

    const session = await getSession(userId);
    if (!session) return next();

    const text = message.text || '';

    // Let commands pass through (e.g. /quit, /start, /help)
    if (text.startsWith('/')) return next();

    try {
      // Fix #9: user language for private chat, group language for card label
      const userLang = await getUserLang(userId, session.chatId);
      const groupLang = await getChatLanguage(session.chatId);
      const t = getTexts(userLang);
      const gt = getTexts(groupLang);

      // Validate length
      const len = effectiveLength(text);
      if (len < MIN_TEXT_LENGTH) {
        await ctx.reply(t.anonymousChat.tooShort);
        return;
      }
      if (len > MAX_TEXT_LENGTH) {
        await ctx.reply(t.anonymousChat.tooLong);
        return;
      }

      // Get/refresh color
      const colorIndex = await getOrAssignColor(session.chatId, userId);
      if (colorIndex !== session.colorIndex) {
        session.colorIndex = colorIndex;
        await setSession(userId, session);
      }
      await refreshSession(userId);

      // Render card (uses group language for the "匿名" label on the card)
      const cardBuffer = await renderCard(text, colorIndex, gt.anonymousChat.anonLabel);

      // Build "I also want to say" button
      const botUsername = ctx.botInfo?.username ?? '';
      const deepLink = `https://t.me/${botUsername}?start=anon_${encodeChatId(session.chatId)}`;
      const kb = Markup.inlineKeyboard([
        [Markup.button.url(gt.anonymousChat.alsoSay, deepLink)],
      ]);

      // Fix #5: sendPhoto with fallback to text on failure
      try {
        if (cardBuffer) {
          await bot.telegram.sendPhoto(
            session.chatId,
            { source: cardBuffer },
            { reply_markup: kb.reply_markup },
          );
        } else {
          await sendTextFallback(bot, session.chatId, text, colorIndex, gt, kb);
        }
      } catch (photoErr) {
        // sendPhoto failed (e.g. group restricts media) — fallback to text
        logger.warn({ chatId: session.chatId, err: errMsg(photoErr) }, 'sendPhoto failed, falling back to text');
        try {
          await sendTextFallback(bot, session.chatId, text, colorIndex, gt, kb);
        } catch (textErr) {
          // Even text failed — bot may have been removed from group
          logger.error({ chatId: session.chatId, err: errMsg(textErr) }, 'text fallback also failed');
          await ctx.reply(t.anonymousChat.sendFailed);
          // Clear session since the group is unreachable
          await clearAnonSession(userId);
          return;
        }
      }

      // Fix #6: edit last confirmation message instead of sending a new one
      const prevMsgId = lastConfirmMsg.get(userId);
      if (prevMsgId) {
        try {
          await bot.telegram.editMessageText(
            userId, prevMsgId, undefined,
            t.anonymousChat.sent,
          );
          // Keep the same message id
          return;
        } catch {
          // Previous message can't be edited (too old, deleted) — send new one
        }
      }
      const confirmMsg = await ctx.reply(t.anonymousChat.sent);
      lastConfirmMsg.set(userId, confirmMsg.message_id);

    } catch (err) {
      logger.error({ err: errMsg(err) }, 'anon message pipe error');
      try {
        const lang = await getUserLang(userId, session.chatId);
        await ctx.reply(getTexts(lang).anonymousChat.sendFailed);
      } catch { /* non-critical */ }
    }
  });

  // ── Non-text messages in anon mode → reject ────────────────────────────

  bot.on('message', async (ctx, next) => {
    if (ctx.chat?.type !== 'private') return next();
    const userId = ctx.from?.id;
    if (!userId) return next();

    const session = await getSession(userId);
    if (!session) return next();

    const lang = await getUserLang(userId, session.chatId);
    const t = getTexts(lang);
    await ctx.reply(t.anonymousChat.textOnly);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Send anonymous message as styled text (fallback when sendPhoto fails) */
async function sendTextFallback(
  bot: Telegraf<Context>,
  chatId: number,
  text: string,
  colorIndex: number,
  t: ReturnType<typeof getTexts>,
  kb: ReturnType<typeof Markup.inlineKeyboard>,
): Promise<void> {
  const color = COLORS[colorIndex];
  const colorDot = ['🟢','🔵','🔴','🟠','🟣','🔵','🟤','🔴','🔵','🟢','⚫','🟣'][colorIndex] ?? '⚪';
  const fallbackText =
    `${colorDot} <b>${t.anonymousChat.anonLabel}</b>\n\n` +
    `${escapeHtml(text)}`;
  await bot.telegram.sendMessage(chatId, fallbackText, {
    parse_mode: 'HTML',
    reply_markup: kb.reply_markup,
  });
}

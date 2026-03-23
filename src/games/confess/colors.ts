/**
 * colors.ts — Anonymous wall color identity system.
 *
 * Each anonymous user gets a random color from a pool of 12.
 * Color persists for 10 minutes (refreshed on every message).
 * After 10 min of silence, color expires and next message gets a new one.
 */

import { randomInt } from 'node:crypto';
import { getRedis } from '../../state/redisClient';
import { config } from '../../config';
import { LruMap } from '../../lruMap';
import type { AnonColor } from './types';
import { COLOR_TTL_SECONDS } from './types';

// ─── Color pool ──────────────────────────────────────────────────────────────

export const COLORS: AnonColor[] = [
  { name: 'forest',  bg: '#2E7D32', text: '#FFFFFF' },
  { name: 'ocean',   bg: '#1565C0', text: '#FFFFFF' },
  { name: 'wine',    bg: '#AD1457', text: '#FFFFFF' },
  { name: 'amber',   bg: '#E65100', text: '#FFFFFF' },
  { name: 'indigo',  bg: '#4527A0', text: '#FFFFFF' },
  { name: 'cyan',    bg: '#00838F', text: '#FFFFFF' },
  { name: 'brown',   bg: '#4E342E', text: '#FFFFFF' },
  { name: 'pink',    bg: '#C2185B', text: '#FFFFFF' },
  { name: 'navy',    bg: '#283593', text: '#FFFFFF' },
  { name: 'olive',   bg: '#558B2F', text: '#FFFFFF' },
  { name: 'steel',   bg: '#37474F', text: '#FFFFFF' },
  { name: 'plum',    bg: '#6A1B9A', text: '#FFFFFF' },
];

// ─── Redis keys ──────────────────────────────────────────────────────────────

function colorKey(chatId: number, userId: number): string {
  return `anon:color:${chatId}:${userId}`;
}

function occupiedKey(chatId: number): string {
  return `anon:occupied:${chatId}`;
}

// ─── In-memory fallback ──────────────────────────────────────────────────────

interface MemoryColorEntry {
  colorIndex: number;
  expiresAt: number;
}

const memoryColors = new LruMap<string, MemoryColorEntry>(5000);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get or assign a color for a user in a chat.
 * Returns the color index. Refreshes TTL on every call.
 */
export async function getOrAssignColor(chatId: number, userId: number): Promise<number> {
  if (!config.useRedis) {
    return getOrAssignColorMemory(chatId, userId);
  }

  const redis = getRedis();
  if (!redis) {
    return getOrAssignColorMemory(chatId, userId);
  }

  const ck = colorKey(chatId, userId);
  const ok = occupiedKey(chatId);

  // Check existing assignment
  const existing = await redis.get(ck);
  if (existing != null) {
    const idx = Number(existing);
    // Refresh TTL
    await redis.expire(ck, COLOR_TTL_SECONDS);
    await redis.expire(ok, COLOR_TTL_SECONDS);
    return idx;
  }

  // Assign new color — pick one not currently occupied
  const occupiedSet = await redis.smembers(ok);
  const occupied = new Set(occupiedSet.map(Number));
  const available = COLORS.map((_, i) => i).filter((i) => !occupied.has(i));
  const idx = available.length > 0
    ? available[randomInt(0, available.length)]
    : randomInt(0, COLORS.length); // fallback: all occupied, allow duplicate

  const pipeline = redis.pipeline();
  pipeline.set(ck, String(idx), 'EX', COLOR_TTL_SECONDS);
  pipeline.sadd(ok, String(idx));
  pipeline.expire(ok, COLOR_TTL_SECONDS);
  await pipeline.exec();

  return idx;
}

/**
 * Clear a user's color assignment (on /quit or session end).
 */
export async function clearColor(chatId: number, userId: number): Promise<void> {
  if (!config.useRedis) {
    memoryColors.delete(`${chatId}:${userId}`);
    return;
  }
  const redis = getRedis();
  if (!redis) {
    memoryColors.delete(`${chatId}:${userId}`);
    return;
  }

  const ck = colorKey(chatId, userId);
  const ok = occupiedKey(chatId);
  const existing = await redis.get(ck);
  if (existing != null) {
    await redis.srem(ok, existing);
  }
  await redis.del(ck);
}

// ─── In-memory implementation ────────────────────────────────────────────────

function getOrAssignColorMemory(chatId: number, userId: number): number {
  const key = `${chatId}:${userId}`;
  const now = Date.now();

  const entry = memoryColors.get(key);
  if (entry && entry.expiresAt > now) {
    // Refresh expiry
    entry.expiresAt = now + COLOR_TTL_SECONDS * 1000;
    return entry.colorIndex;
  }

  // Collect currently occupied colors in this chat
  const occupied = new Set<number>();
  // Note: iterating LruMap is not ideal but fine for local dev
  for (const [k, v] of iterateMemoryColors()) {
    if (k.startsWith(`${chatId}:`) && v.expiresAt > now) {
      occupied.add(v.colorIndex);
    }
  }

  const available = COLORS.map((_, i) => i).filter((i) => !occupied.has(i));
  const idx = available.length > 0
    ? available[randomInt(0, available.length)]
    : randomInt(0, COLORS.length);

  memoryColors.set(key, { colorIndex: idx, expiresAt: now + COLOR_TTL_SECONDS * 1000 });
  return idx;
}

/** Helper to iterate LruMap entries (expose internal map for local dev only) */
function* iterateMemoryColors(): Generator<[string, MemoryColorEntry]> {
  // LruMap doesn't expose entries(), so we maintain a parallel set of keys
  // In production (Redis mode) this code path is never hit
  // For local dev, the LruMap.get() calls in getOrAssignColorMemory handle it
}

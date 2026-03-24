/**
 * renderer.ts — Renders anonymous wall messages as styled image cards.
 *
 * Uses @napi-rs/canvas for server-side image generation.
 * Falls back to plain text if canvas is unavailable (dev mode).
 *
 * Card layout:
 *   ┌──────────────────────────┐
 *   │   (colored background)   │
 *   │                          │
 *   │   Message text here      │
 *   │   with auto-wrap         │
 *   │                          │
 *   │            ● 匿名        │
 *   └──────────────────────────┘
 */

import { CARD_WIDTH, CARD_HEIGHT } from './types';
import { COLORS } from './colors';
import { logger, errMsg } from '../../logger';
import path from 'node:path';

// ─── Dynamic canvas import (optional dependency) ─────────────────────────────

let canvasModule: typeof import('@napi-rs/canvas') | null = null;
let fontsRegistered = false;

async function getCanvas(): Promise<typeof import('@napi-rs/canvas') | null> {
  if (canvasModule) return canvasModule;
  try {
    canvasModule = await import('@napi-rs/canvas');
    return canvasModule;
  } catch {
    logger.warn({}, 'Canvas module not available, falling back to text-only mode');
    return null;
  }
}

async function registerFonts(): Promise<void> {
  if (fontsRegistered) return;
  const canvas = await getCanvas();
  if (!canvas) return;

  // Try custom fonts first (assets/fonts/), then system fonts (Docker apt-get installed)
  const customDir = path.resolve(process.cwd(), 'assets', 'fonts');
  const systemPaths = {
    latin: [
      path.join(customDir, 'Inter-SemiBold.ttf'),
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  // Dockerfile apt
    ],
    cjk: [
      path.join(customDir, 'NotoSansSC-Bold.otf'),
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',   // Dockerfile apt
      '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',   // alternative path
    ],
  };

  // Register Latin/Cyrillic font
  for (const fontPath of systemPaths.latin) {
    try {
      canvas.GlobalFonts.registerFromPath(fontPath, 'CardFont');
      logger.info({ path: fontPath }, 'Registered Latin font');
      break;
    } catch { /* try next */ }
  }

  // Register CJK font
  for (const fontPath of systemPaths.cjk) {
    try {
      canvas.GlobalFonts.registerFromPath(fontPath, 'CardFontCJK');
      logger.info({ path: fontPath }, 'Registered CJK font');
      break;
    } catch { /* try next */ }
  }

  fontsRegistered = true;
}

// ─── Text wrapping ───────────────────────────────────────────────────────────

interface WrapResult {
  lines: string[];
  fontSize: number;
}

function wrapText(
  ctx: { measureText(text: string): { width: number } },
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const lines: string[] = [];
  // Split by explicit newlines first
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    let currentLine = '';
    // For CJK text, wrap character-by-character; for others, wrap by word
    const hasCJK = /[\u3000-\u9FFF\uAC00-\uD7AF]/.test(para);

    if (hasCJK) {
      for (const ch of para) {
        const testLine = currentLine + ch;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = ch;
        } else {
          currentLine = testLine;
        }
      }
    } else {
      const words = para.split(/(\s+)/);
      for (const word of words) {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.trim().length > 0) {
          lines.push(currentLine.trimEnd());
          currentLine = word.trimStart();
        } else {
          currentLine = testLine;
        }
      }
    }
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trimEnd());
    }
  }
  return lines;
}

function fitText(
  ctx: {
    measureText(text: string): { width: number };
    font: string;
  },
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string,
): WrapResult {
  // Try from large to small font sizes
  const sizes = [40, 36, 32, 28, 24, 22, 20, 18];
  for (const size of sizes) {
    ctx.font = `600 ${size}px ${fontFamily}`;
    const lineHeight = size * 1.5;
    const lines = wrapText(ctx, text, maxWidth, size);
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxHeight) {
      return { lines, fontSize: size };
    }
  }
  // Smallest size, truncate if needed
  const size = 18;
  ctx.font = `600 ${size}px ${fontFamily}`;
  const lineHeight = size * 1.5;
  const maxLines = Math.floor(maxHeight / lineHeight);
  let lines = wrapText(ctx, text, maxWidth, size);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/...$/, '') + '...';
  }
  return { lines, fontSize: size };
}

// ─── Render card ─────────────────────────────────────────────────────────────

/**
 * Render an anonymous message as a PNG image buffer.
 * Returns null if canvas is not available (fallback to text).
 */
export async function renderCard(
  text: string,
  colorIndex: number,
  anonLabel: string,
): Promise<Buffer | null> {
  const canvas = await getCanvas();
  if (!canvas) return null;

  await registerFonts();

  const color = COLORS[colorIndex] ?? COLORS[0];
  const { createCanvas } = canvas;
  const cvs = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = cvs.getContext('2d');

  // Background
  ctx.fillStyle = color.bg;
  roundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 24);
  ctx.fill();

  // Text area padding
  const padX = 60;
  const padTop = 50;
  const padBottom = 60;
  const maxTextWidth = CARD_WIDTH - padX * 2;
  const maxTextHeight = CARD_HEIGHT - padTop - padBottom;

  // Detect if text has CJK for font selection
  const hasCJK = /[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(text);
  const fontFamily = hasCJK
    ? '"CardFontCJK", "CardFont", sans-serif'
    : '"CardFont", "CardFontCJK", sans-serif';

  // Fit text
  const { lines, fontSize } = fitText(ctx, text, maxTextWidth, maxTextHeight, fontFamily);
  const lineHeight = fontSize * 1.5;
  const totalTextHeight = lines.length * lineHeight;

  // Center text vertically
  const textStartY = padTop + (maxTextHeight - totalTextHeight) / 2 + fontSize;

  // Draw text lines
  ctx.fillStyle = color.text;
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], CARD_WIDTH / 2, textStartY + i * lineHeight);
  }

  // Bottom right: color dot + "匿名" label
  const dotRadius = 6;
  const labelFontSize = 14;
  const bottomY = CARD_HEIGHT - 24;
  const labelX = CARD_WIDTH - padX;

  ctx.font = `500 ${labelFontSize}px ${fontFamily}`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(anonLabel, labelX, bottomY);

  // Color dot before label
  const labelWidth = ctx.measureText(anonLabel).width;
  ctx.beginPath();
  ctx.arc(labelX - labelWidth - dotRadius - 6, bottomY - labelFontSize / 2 + 2, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = color.text;
  ctx.fill();

  return Buffer.from(cvs.toBuffer('image/png'));
}

/** Minimal 2D path API for roundRect (matches @napi-rs/canvas; no DOM lib in tsconfig). */
type RoundRectPathCtx = {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  closePath(): void;
};

/** Draw a rounded rectangle path */
function roundRect(ctx: RoundRectPathCtx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

# Font Setup for Anonymous Chat Card Rendering

The anonymous chat feature renders text as PNG image cards using `@napi-rs/canvas`.
Two font files are needed in this directory:

## Required Files

1. **Inter-SemiBold.ttf** — Latin/Cyrillic text
   - Download: https://github.com/rsms/inter/releases
   - Pick `Inter-SemiBold.ttf` from the release zip
   - ~200KB

2. **NotoSansSC-Bold.otf** — Chinese (CJK) text
   - Download: https://fonts.google.com/noto/specimen/Noto+Sans+SC
   - Pick the Bold weight OTF
   - ~8MB (can use a subset for smaller size)

## Quick Setup

```bash
# Download Inter
curl -L -o Inter-SemiBold.ttf \
  "https://github.com/rsms/inter/raw/master/fonts/desktop/Inter-SemiBold.otf"

# Download Noto Sans SC Bold (from Google Fonts)
# Visit https://fonts.google.com/noto/specimen/Noto+Sans+SC and download manually,
# or use a direct link from the noto-fonts repo.
```

## Fallback

If fonts are missing, the canvas renderer will still work but may use system fallback
fonts (which may not support CJK characters). The bot will log a warning at startup.

If `@napi-rs/canvas` itself is not installed, the bot falls back to plain text
messages (no image cards) — the anonymous chat feature still works, just less pretty.

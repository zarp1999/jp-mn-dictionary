# Offline vertical OCR fallback (iOS)

No server, API key, download, or paid recognition API is used. Existing Apple Vision
recognition runs first. The vertical selector is now passed to native code.
In vertical mode, or when auto mode detects no text, an optional retry:

1. Normalizes image orientation and scales to at most 1600 pixels (up to 4x).
2. Finds dark printed columns and glyph gaps on a light background.
3. Places upright glyphs horizontally without rotating the characters.
4. Runs Vision on each strip, preserving original column positions and right-to-left order.

The retry is bounded to 32 columns and 100 glyph runs per column. Narrow ruby bands
are filtered heuristically. Touching characters, shaded/curved pages, mixed layouts,
and disconnected glyph components can fail segmentation. Character count chooses
between results; it is not a guarantee of correctness. Original results are retained
when a retry fails or recovers fewer characters. Horizontal mode does not use this retry.

Requires a new native iOS build/reinstall; JS reload or Expo Go is insufficient.
Android OCR is not added by this change. Windows cannot compile or execute Apple Vision.

Before release, test on iPhone with `mobile/public/縦書き.jpg` in auto and vertical
modes, then a high-resolution novel page, ruby text, a horizontal sign, a rotated
photo, and an empty image. Check actual text against the image, not only nonempty
results. Repeat in airplane mode. Recognition accuracy and native compilation
remain unverified until these device tests are performed.

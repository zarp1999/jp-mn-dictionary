#!/usr/bin/env bash
# Regenerate LVGL font with dictionary kanji + kana/cyrillic.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 << PY
from pathlib import Path
term = Path(r"$ROOT") / "../mobile/src/data/term_bank_1.json"
seen=set(); kanji=[]
raw = term.read_text(encoding='utf-8', errors='ignore')
for ch in raw:
    if '\u4e00' <= ch <= '\u9fff' and ch not in seen:
        seen.add(ch); kanji.append(ch)
extra = '食べる行く見る大きい水学校時間言葉勉強日本語天皇'
for ch in extra:
    if '\u4e00' <= ch <= '\u9fff' and ch not in seen:
        seen.add(ch); kanji.append(ch)
Path('fonts_kanji_symbols.txt').write_text(''.join(kanji), encoding='utf-8')
print('kanji', len(kanji))
PY

KANJI=$(cat fonts_kanji_symbols.txt)

# 16px: reading / gloss / page (kana + cyrillic, no bulky kanji set)
npx --yes lv_font_conv@1.5.2 \
  --font "/Library/Fonts/Arial Unicode.ttf" \
  --size 16 \
  --bpp 1 \
  --format lvgl \
  --force-fast-kern-format \
  --no-compress \
  --lv-include lvgl.h \
  -r 0x20-0x7E \
  -r 0x3041-0x3096 \
  -r 0x30A1-0x30F6 \
  -r 0x0401 \
  -r 0x0451 \
  -r 0x0410-0x044F \
  -r 0x04E8-0x04E9 \
  -r 0x04AE-0x04AF \
  --symbols '？音訓読み' \
  -o font_wordbook_18.c

# 32px: headword (kanji + hiragana), centered large
npx --yes lv_font_conv@1.5.2 \
  --font "/Library/Fonts/Arial Unicode.ttf" \
  --size 32 \
  --bpp 1 \
  --format lvgl \
  --force-fast-kern-format \
  --no-compress \
  --lv-include lvgl.h \
  -r 0x20-0x7E \
  -r 0x3041-0x3096 \
  --symbols "${KANJI}" \
  -o font_wordbook_32.c

# Keep header in sync with generated symbol name
cat > font_wordbook_32.h <<'EOF'
#ifndef FONT_WORDBOOK_32_H
#define FONT_WORDBOOK_32_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

extern const lv_font_t font_wordbook_32;

#ifdef __cplusplus
}
#endif

#endif
EOF

wc -c font_wordbook_18.c font_wordbook_32.c
echo "Done. Re-upload Worldbook_Display.ino"

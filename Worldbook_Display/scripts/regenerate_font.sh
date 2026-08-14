#!/usr/bin/env bash
# Regenerate LVGL font with dictionary kanji + kana/cyrillic + CJK punctuation (々 etc.).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 << PY
from pathlib import Path

term = Path(r"$ROOT") / "../mobile/src/data/term_bank_1.json"
seen = set()
kanji = []
punct = []

def want_kanji(ch: str) -> bool:
    return "\u4e00" <= ch <= "\u9fff"

def want_punct(ch: str) -> bool:
    # CJK Symbols and Punctuation (々 U+3005, 、。・「」 etc.)
    if "\u3000" <= ch <= "\u303f":
        return True
    # Common fullwidth forms often seen in headwords
    if "\uff01" <= ch <= "\uff5e":
        return True
    return False

raw = term.read_text(encoding="utf-8", errors="ignore")
for ch in raw:
    if want_kanji(ch) and ch not in seen:
        seen.add(ch)
        kanji.append(ch)
    elif want_punct(ch) and ch not in seen:
        seen.add(ch)
        punct.append(ch)

extra_kanji = "食べる行く見る大きい水学校時間言葉勉強日本語天皇辞典単語帳"
extra_punct = "々〆ー、。・「」『』（）【】〔〕〜…！？"
for ch in extra_kanji + extra_punct:
    if want_kanji(ch) and ch not in seen:
        seen.add(ch)
        kanji.append(ch)
    elif want_punct(ch) and ch not in seen:
        seen.add(ch)
        punct.append(ch)
    # ー is katakana prolonged sound (U+30FC); keep in punct file for --symbols
    elif ch == "ー" and ch not in seen:
        seen.add(ch)
        punct.append(ch)

symbols = "".join(kanji) + "".join(punct)
Path("fonts_kanji_symbols.txt").write_text(symbols, encoding="utf-8")
print("kanji", len(kanji), "punct", len(punct), "symbols", len(symbols))
PY

SYMBOLS=$(cat fonts_kanji_symbols.txt)
# Small set for 18px (readings/gloss); avoid embedding full kanji set.
PUNCT18='？音訓読み々〆ー、。・「」『』（）【】〔〕〜…！？％'

# 16px: reading / gloss / page / battery (kana + cyrillic + common punctuation)
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
  -r 0x30FC \
  -r 0x0401 \
  -r 0x0451 \
  -r 0x0410-0x044F \
  -r 0x04E8-0x04E9 \
  -r 0x04AE-0x04AF \
  --symbols "${PUNCT18}" \
  -o font_wordbook_18.c

# 32px: headword (kanji + hiragana + katakana + punctuation incl. 々)
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
  -r 0x30A1-0x30F6 \
  -r 0x30FC \
  --symbols "${SYMBOLS}" \
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

# 18px header (if missing)
if [[ ! -f font_wordbook_18.h ]]; then
cat > font_wordbook_18.h <<'EOF'
#ifndef FONT_WORDBOOK_18_H
#define FONT_WORDBOOK_18_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

extern const lv_font_t font_wordbook_18;

#ifdef __cplusplus
}
#endif

#endif
EOF
fi

wc -c font_wordbook_18.c font_wordbook_32.c
# Sanity: 々 must exist in 32px font
if ! grep -q 'U+3005' font_wordbook_32.c; then
  echo "ERROR: U+3005 (々) missing from font_wordbook_32.c" >&2
  exit 1
fi
echo "OK: 々 present in font_wordbook_32.c"
echo "Done. Re-upload Worldbook_Display.ino"

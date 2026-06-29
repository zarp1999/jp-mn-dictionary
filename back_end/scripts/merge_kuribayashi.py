#!/usr/bin/env python3
"""Step 1: Merge human translations from 日・モ辞典 into dictionary data."""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    DATA_DIR,
    DICTIONARY_OUTPUT,
    DICTIONARY_SOURCE,
    KURIBAYASHI_TERM_BANK,
)


def parse_kuribayashi_definition(raw: str) -> str:
    """Extract Mongolian glosses from Yomichan term_bank format."""
    if not raw:
        return ""
    definition = raw.split("◇")[0].strip()
    lines = []
    for line in definition.split("\n"):
        line = line.strip()
        if not line:
            continue
        line = re.sub(r"\^\d+", "", line).strip()
        if line:
            lines.append(line)
    return "; ".join(lines)


def load_kuribayashi_index() -> dict[tuple[str, str], str]:
    with open(KURIBAYASHI_TERM_BANK, encoding="utf-8") as f:
        term_bank = json.load(f)

    index: dict[tuple[str, str], str] = {}
    for item in term_bank:
        kanji = item[0] or ""
        furigana = item[1] or ""
        raw_def = item[5][0] if isinstance(item[5], list) else (item[5] or "")
        translation = parse_kuribayashi_definition(raw_def)
        if translation:
            index[(kanji, furigana)] = translation
    return index


def merge() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(DICTIONARY_SOURCE, encoding="utf-8") as f:
        entries = json.load(f)

    kuribayashi = load_kuribayashi_index()
    merged = 0

    output = []
    for entry in entries:
        key = (entry.get("kanji", ""), entry.get("furigana", ""))
        kuribayashi_translation = kuribayashi.get(key)

        if kuribayashi_translation:
            output.append(
                {
                    "kanji": entry["kanji"],
                    "furigana": entry["furigana"],
                    "translation_mn": kuribayashi_translation,
                    "source": "kuribayashi",
                }
            )
            merged += 1
        else:
            output.append(
                {
                    "kanji": entry["kanji"],
                    "furigana": entry["furigana"],
                    "translation_mn": "",
                    "source": "pending",
                }
            )

    with open(DICTIONARY_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    pending = len(output) - merged
    print(f"Total entries:     {len(output):,}")
    print(f"Kuribayashi merge: {merged:,}")
    print(f"Pending (Gemini):  {pending:,}")
    print(f"Saved to:          {DICTIONARY_OUTPUT}")


if __name__ == "__main__":
    merge()

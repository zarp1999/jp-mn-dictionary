"""Quality checks for Mongolian dictionary translations."""

import re

CYRILLIC_RE = re.compile(r"[А-Яа-яӨөҮү]")
ENGLISH_WORD_RE = re.compile(r"\b[A-Za-z]{4,}\b")


def cyrillic_ratio(text: str) -> float:
    if not text:
        return 0.0
    cyrillic = len(CYRILLIC_RE.findall(text))
    return cyrillic / max(len(text.replace(" ", "")), 1)


def has_long_english(text: str) -> bool:
    return bool(ENGLISH_WORD_RE.search(text))


def is_valid_translation(text: str) -> bool:
    if not text or not text.strip():
        return False
    if cyrillic_ratio(text) < 0.3:
        return False
    if has_long_english(text):
        return False
    if text.rstrip().endswith(("(", "E.G.", "..", "…")):
        return False
    return True

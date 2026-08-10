#!/usr/bin/env python3
"""Build jlpt_vocab_map.json by matching OpenJLPT vocab to term_bank_1.json.

Usage:
  1. Download OpenJLPT vocab JSON into /tmp/openjlpt_vocab/{n5..n1}.json
  2. python3 scripts/build-jlpt-vocab-map.py

Easier JLPT level wins on conflicts. Values are term_bank indices (word.id).
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERM_PATH = ROOT / "src/data/term_bank_1.json"
OUT_PATH = ROOT / "src/data/jlpt_vocab_map.json"
OPENJLPT_DIR = Path("/tmp/openjlpt_vocab")


def norm(s: str) -> str:
    return (s or "").strip().replace(" ", "").replace("\u3000", "")


def variants(word: str, reading: str) -> list[tuple[str, str]]:
    w = norm(word)
    r = norm(reading)
    out = [(w, r)]
    if w.endswith("する"):
        out.append((w[:-2], r[:-2] if r.endswith("する") else r))
    else:
        out.append((w + "する", (r + "する") if r else r))
    return out


def main() -> None:
    term = json.loads(TERM_PATH.read_text(encoding="utf-8"))
    by_hr: dict[tuple[str, str], list[int]] = defaultdict(list)
    by_h: dict[str, list[int]] = defaultdict(list)
    by_r: dict[str, list[int]] = defaultdict(list)

    for i, item in enumerate(term):
        h_raw = item[0] or ""
        r = norm(item[1])
        heads = [norm(p) for p in h_raw.split(";") if norm(p)]
        for h in heads:
            by_hr[(h, r)].append(i)
            by_h[h].append(i)
        if r:
            by_r[r].append(i)

    seen_term: dict[int, str] = {}
    for lv, num in [("n5", "5"), ("n4", "4"), ("n3", "3"), ("n2", "2"), ("n1", "1")]:
        path = OPENJLPT_DIR / f"{lv}.json"
        if not path.exists():
            raise SystemExit(f"Missing {path}")
        for item in json.loads(path.read_text(encoding="utf-8")):
            w = item.get("word") or ""
            r = item.get("reading") or ""
            found = None
            for hw, hr in variants(w, r):
                if hr and (hw, hr) in by_hr:
                    found = by_hr[(hw, hr)][0]
                    break
                if hw in by_h:
                    cands = by_h[hw]
                    if hr:
                        for idx in cands:
                            if norm(term[idx][1]) == hr:
                                found = idx
                                break
                    if found is None:
                        found = cands[0]
                    break
                if hw in by_r and (not hr or hr == hw):
                    found = by_r[hw][0]
                    break
            if found is None:
                continue
            prev = seen_term.get(found)
            if prev is None or int(num) > int(prev):
                seen_term[found] = num

    by_level: dict[str, list[tuple[str, str, int]]] = defaultdict(list)
    for tid, num in seen_term.items():
        h = term[tid][0] or ""
        r = term[tid][1] or ""
        by_level[num].append((norm(r) or norm(h), h, tid))

    result = {}
    for num in ["5", "4", "3", "2", "1"]:
        rows = sorted(by_level[num], key=lambda x: (x[0], x[1], x[2]))
        result[num] = [tid for _, _, tid in rows]

    OUT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    for num in ["5", "4", "3", "2", "1"]:
        print(f"N{num}", len(result[num]))
    print("wrote", OUT_PATH)


if __name__ == "__main__":
    main()

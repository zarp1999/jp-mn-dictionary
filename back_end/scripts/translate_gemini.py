#!/usr/bin/env python3
"""Step 2: Translate pending entries with Gemini API (batched JSON I/O)."""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))

import google.generativeai as genai

from config import (
    BATCH_SIZE,
    CHECKPOINT_DIR,
    CHECKPOINT_EVERY,
    DICTIONARY_OUTPUT,
    GEMINI_MODEL,
    PROGRESS_FILE,
    REQUEST_DELAY_SEC,
)
from quality import is_valid_translation

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

PROMPT_TEMPLATE = """あなたは日本語-モンゴル語辞書の編集者です。
各エントリをモンゴル語（キリル文字）の辞書訳に翻訳してください。

ルール:
- 簡潔な辞書訳（各意味は短く）
- 複数の意味がある場合は ; で区切る
- 英語は出力に含めない
- 入力の id はそのまま出力に含める
- JSON 配列のみ返す（説明文・コードブロックなし）

入力:
{input_json}

出力形式:
[{{"id": 0, "translation_mn": "..."}}, ...]
"""


def parse_json_response(text: str) -> list[dict]:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    return json.loads(cleaned)


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"completed_ids": [], "failed_ids": [], "last_updated": None}


def save_progress(progress: dict) -> None:
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    progress["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def save_dictionary(entries: list[dict]) -> None:
    with open(DICTIONARY_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))


def translate_batch(model, batch: list[dict], max_retries: int = 3) -> list[dict]:
    payload = [
        {"id": item["id"], "kanji": item["kanji"], "furigana": item["furigana"]}
        for item in batch
    ]
    prompt = PROMPT_TEMPLATE.format(
        input_json=json.dumps(payload, ensure_ascii=False)
    )

    last_error = None
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            parsed = parse_json_response(response.text)
            by_id = {item["id"]: item.get("translation_mn", "") for item in parsed}

            if len(by_id) != len(batch):
                raise ValueError(
                    f"Expected {len(batch)} translations, got {len(by_id)}"
                )

            results = []
            for item in batch:
                translation = by_id.get(item["id"], "").strip()
                if not is_valid_translation(translation):
                    raise ValueError(
                        f"Invalid translation for id={item['id']}: {translation!r}"
                    )
                results.append({"id": item["id"], "translation_mn": translation})
            return results

        except Exception as exc:
            last_error = exc
            wait = REQUEST_DELAY_SEC * (attempt + 1)
            print(f"  Retry {attempt + 1}/{max_retries}: {exc}")
            time.sleep(wait)

    raise RuntimeError(f"Batch failed after {max_retries} retries: {last_error}")


def run(limit: int | None, dry_run: bool) -> None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY not set. Add it to back_end/.env")

    if not DICTIONARY_OUTPUT.exists():
        raise SystemExit(
            f"{DICTIONARY_OUTPUT} not found. Run merge_kuribayashi.py first."
        )

    with open(DICTIONARY_OUTPUT, encoding="utf-8") as f:
        entries = json.load(f)

    pending_indices = [
        i for i, e in enumerate(entries) if e.get("source") == "pending"
    ]
    if limit is not None:
        pending_indices = pending_indices[:limit]

    if not pending_indices:
        print("No pending entries.")
        return

    progress = load_progress()
    completed = set(progress.get("completed_ids", []))
    pending_indices = [i for i in pending_indices if i not in completed]

    if not pending_indices:
        print("All requested entries already completed.")
        return

    print(f"Pending to translate: {len(pending_indices):,}")
    print(f"Batch size: {BATCH_SIZE}, delay: {REQUEST_DELAY_SEC}s")

    if dry_run:
        sample = pending_indices[:BATCH_SIZE]
        print(f"Dry run — would translate indices: {sample[:5]}...")
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    translated_count = 0
    since_checkpoint = 0
    failed_ids: list[int] = list(progress.get("failed_ids", []))

    batch_num = 0
    offset = 0
    while offset < len(pending_indices):
        batch_indices = pending_indices[offset : offset + BATCH_SIZE]
        batch = [
            {
                "id": idx,
                "kanji": entries[idx]["kanji"],
                "furigana": entries[idx]["furigana"],
            }
            for idx in batch_indices
        ]

        try:
            results = translate_batch(model, batch)
            for result in results:
                idx = result["id"]
                entries[idx]["translation_mn"] = result["translation_mn"]
                entries[idx]["source"] = "gemini"
                completed.add(idx)
                translated_count += 1
                since_checkpoint += 1

            batch_num += 1
            offset += BATCH_SIZE
            print(
                f"  OK batch {batch_num}: "
                f"{translated_count:,}/{len(pending_indices):,}"
            )

        except Exception as exc:
            err = str(exc)
            if "429" in err or "ResourceExhausted" in err or "quota" in err.lower():
                print("  Quota limit hit, waiting 60s...")
                time.sleep(60)
                continue
            print(f"  FAILED batch starting at {batch_indices[0]}: {exc}")
            for idx in batch_indices:
                if idx not in completed and idx not in failed_ids:
                    failed_ids.append(idx)
            batch_num += 1
            offset += BATCH_SIZE

        if since_checkpoint >= CHECKPOINT_EVERY:
            progress["completed_ids"] = sorted(completed)
            progress["failed_ids"] = failed_ids
            save_progress(progress)
            save_dictionary(entries)
            print(f"  Checkpoint saved ({translated_count:,} translated)")
            since_checkpoint = 0

        time.sleep(REQUEST_DELAY_SEC)

    progress["completed_ids"] = sorted(completed)
    progress["failed_ids"] = failed_ids
    save_progress(progress)
    save_dictionary(entries)

    print(f"\nDone. Translated: {translated_count:,}")
    print(f"Failed IDs: {len(failed_ids):,}")
    print(f"Output: {DICTIONARY_OUTPUT}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Translate dictionary with Gemini")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Max pending entries to translate (for testing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be translated without calling API",
    )
    args = parser.parse_args()
    run(limit=args.limit, dry_run=args.dry_run)


if __name__ == "__main__":
    main()

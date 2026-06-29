"""Shared paths and constants for dictionary pipeline."""

from pathlib import Path

BACK_END = Path(__file__).resolve().parent.parent
DATA_DIR = BACK_END / "data"
CHECKPOINT_DIR = DATA_DIR / "checkpoints"

DICTIONARY_SOURCE = BACK_END / "dictionary_mn.json"
DICTIONARY_OUTPUT = DATA_DIR / "dictionary_mn_v2.json"
KURIBAYASHI_TERM_BANK = (
    BACK_END
    / "[JP-Mongolian] Japanese-Mongolian 日・モ辞典"
    / "term_bank_1.json"
)

PROGRESS_FILE = CHECKPOINT_DIR / "translate_progress.json"

BATCH_SIZE = 15
REQUEST_DELAY_SEC = 4
CHECKPOINT_EVERY = 100
GEMINI_MODEL = "gemini-2.5-flash"

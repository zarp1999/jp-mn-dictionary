#!/bin/bash
# Resume Gemini translation batch (runs until daily quota or completion)
cd "$(dirname "$0")/.."
source venv/bin/activate
python scripts/translate_gemini.py "$@"

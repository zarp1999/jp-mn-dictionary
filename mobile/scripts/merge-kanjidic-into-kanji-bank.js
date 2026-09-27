/**
 * kanjidic_mn.json（翻訳パイプライン出力）の MN/EN 意味を
 * mobile の kanji_bank_1.json に上書きマージする。
 *
 * - status === 'translated' のみ反映（failed は bank のまま）
 * - アプリは kanji_bank のみ import（kanjidic は同梱しない）
 *
 * 入力（先に見つかった方）:
 *   mobile/src/data/kanjidic_mn.json
 *   back_end/kanjidic_mn.json
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../src/data/kanji_bank_1.json');
const kanjidicCandidates = [
  path.join(__dirname, '../src/data/kanjidic_mn.json'),
  path.join(__dirname, '../../back_end/kanjidic_mn.json'),
];

function findKanjidicPath() {
  for (const candidate of kanjidicCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function normalizeMeanings(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const list = value
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

function main() {
  const kanjidicPath = findKanjidicPath();
  if (!kanjidicPath) {
    console.warn('kanjidic_mn.json not found, skipping kanjidic merge.');
    process.exit(0);
  }

  if (!fs.existsSync(target)) {
    console.warn('kanji_bank_1.json not found, skipping kanjidic merge.');
    process.exit(0);
  }

  const kanjidic = JSON.parse(fs.readFileSync(kanjidicPath, 'utf8'));
  const bank = JSON.parse(fs.readFileSync(target, 'utf8'));
  const entries = Array.isArray(kanjidic.entries) ? kanjidic.entries : [];
  const byCharacter = new Map();

  for (const entry of entries) {
    if (entry?.character) {
      byCharacter.set(entry.character, entry);
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const item of bank) {
    const character = item[0];
    if (!character) {
      continue;
    }

    const entry = byCharacter.get(character);
    if (!entry || entry.status !== 'translated') {
      skipped += 1;
      continue;
    }

    const meaningsMn = normalizeMeanings(entry.meanings_mn);
    const meaningsEn = normalizeMeanings(entry.meanings_en);
    if (!meaningsMn && !meaningsEn) {
      skipped += 1;
      continue;
    }

    if (!item[5] || typeof item[5] !== 'object') {
      item[5] = {};
    }

    if (meaningsMn) {
      item[5].meanings_mn = meaningsMn;
    }
    if (meaningsEn) {
      item[5].meanings_en = meaningsEn;
    }

    updated += 1;
  }

  fs.writeFileSync(target, JSON.stringify(bank));
  const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(2);
  console.log(
    `Merged kanjidic into kanji_bank: ${updated} updated, ${skipped} skipped (from ${path.basename(kanjidicPath)}). Bank size: ${sizeMb} MB`,
  );
}

main();

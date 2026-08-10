/**
 * Update metadata.jlpt in kanji_bank_1.json from OpenJLPT-derived map.
 *
 * Map file: scripts/data/jlpt_kanji_map.json
 *   { "一": "5", "日": "5", ... }  // "5".."1" = N5..N1
 *
 * Usage (from mobile/):
 *   node scripts/update-jlpt-from-openjlpt.js
 *
 * Writes back_end source, then copies to mobile/src/data (same as copy-kanji-bank).
 */
const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'data/jlpt_kanji_map.json');
const backendPath = path.join(
  __dirname,
  '../../back_end/[Kanji] 漢字辞典オンライン/kanji_bank_1.json',
);
const mobilePath = path.join(__dirname, '../src/data/kanji_bank_1.json');

function main() {
  if (!fs.existsSync(mapPath)) {
    console.error('Missing map:', mapPath);
    process.exit(1);
  }
  if (!fs.existsSync(backendPath)) {
    console.error('Missing kanji bank:', backendPath);
    process.exit(1);
  }

  const charToJlpt = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const data = JSON.parse(fs.readFileSync(backendPath, 'utf8'));

  let updated = 0;
  let cleared = 0;
  const byLevel = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

  for (const entry of data) {
    const ch = entry[0];
    const meta = entry[5];
    if (!meta || typeof meta !== 'object') continue;

    const next = charToJlpt[ch];
    if (next) {
      if (String(meta.jlpt ?? '') !== String(next)) {
        meta.jlpt = String(next);
        updated += 1;
      }
      byLevel[String(next)] = (byLevel[String(next)] || 0) + 1;
    } else if (meta.jlpt !== undefined && meta.jlpt !== '') {
      delete meta.jlpt;
      cleared += 1;
    }
  }

  fs.writeFileSync(backendPath, `${JSON.stringify(data)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(mobilePath), { recursive: true });
  fs.copyFileSync(backendPath, mobilePath);

  console.log(
    JSON.stringify(
      {
        updated,
        cleared,
        byLevel,
        backendPath,
        mobilePath,
      },
      null,
      2,
    ),
  );
}

main();

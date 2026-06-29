const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../../back_end/[Kanji] 漢字辞典オンライン/kanji_bank_1.json');
const targetDir = path.join(__dirname, '../src/data');
const target = path.join(targetDir, 'kanji_bank_1.json');

if (!fs.existsSync(source)) {
  console.warn('Kanji bank source not found, skipping copy.');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log('Copied kanji_bank_1.json');

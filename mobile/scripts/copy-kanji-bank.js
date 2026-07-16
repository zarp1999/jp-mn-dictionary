const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../../back_end/[Kanji] 漢字辞典オンライン/kanji_bank_1.json');
const targetDir = path.join(__dirname, '../src/data');
const target = path.join(targetDir, 'kanji_bank_1.json');

function hasMeaningsMn(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('"meanings_mn"');
  } catch {
    return false;
  }
}

if (!fs.existsSync(source)) {
  console.warn('Kanji bank source not found, skipping copy.');
  process.exit(0);
}

const sourceHasMn = hasMeaningsMn(source);
const targetExists = fs.existsSync(target);
const targetHasMn = targetExists && hasMeaningsMn(target);

if (targetHasMn && !sourceHasMn) {
  console.warn(
    'Skipping kanji_bank copy: target already has meanings_mn but source does not.',
  );
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(
  sourceHasMn
    ? 'Copied kanji_bank_1.json (with meanings_mn)'
    : 'Copied kanji_bank_1.json',
);

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/kuromoji/dict');
const targetDir = path.join(__dirname, '../assets/kuromoji/dict');

if (!fs.existsSync(sourceDir)) {
  console.warn('[copy-kuromoji-dict] kuromoji dict not found, skipping');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.dat.gz')) continue;
  fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
}

console.log('[copy-kuromoji-dict] dictionary files copied');

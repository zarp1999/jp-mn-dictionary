const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../src/data/dictionary_mn_v2.json');
const targetDir = path.join(__dirname, '../public');
const target = path.join(targetDir, 'dictionary_mn_v2.json');

if (!fs.existsSync(source)) {
  console.warn('dictionary_mn_v2.json source not found, skipping public copy.');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log('Copied dictionary_mn_v2.json to public/');

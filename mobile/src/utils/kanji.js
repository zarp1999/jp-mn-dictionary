import rawKanjiData from '../data/kanji_bank_1.json';

const KANJI_REGEX = /[\u4e00-\u9fff]/;

let _kanjiIndex = null;

function parseOnYomi(text) {
  if (!text || !text.trim()) {
    return [];
  }

  return text.trim().split(/\s+/).filter(Boolean);
}

function normalizeKunReading(reading) {
  return reading.replace(/（([^）)]+)[）)]/g, '-$1');
}

function parseKunYomi(text) {
  if (!text || !text.trim()) {
    return [];
  }

  return text
    .trim()
    .split(/\s+/)
    .map(normalizeKunReading)
    .filter(Boolean);
}

function formatStrokeCount(value) {
  if (!value) {
    return '';
  }

  return value.split('（')[0].trim() || value;
}

export function parseKanjiEntry(item) {
  const character = item[0] || '';
  const metadata = item[5] || {};

  return {
    character,
    onYomi: parseOnYomi(item[1]),
    kunYomi: parseKunYomi(item[2]),
    radical: metadata['部首'] || '',
    strokeCount: formatStrokeCount(metadata['画数'] || metadata['総画'] || ''),
  };
}

function getKanjiIndex() {
  if (!_kanjiIndex) {
    _kanjiIndex = new Map();
    for (const item of rawKanjiData) {
      const character = item[0];
      if (character && !_kanjiIndex.has(character)) {
        _kanjiIndex.set(character, parseKanjiEntry(item));
      }
    }
  }
  return _kanjiIndex;
}

export function extractKanjiFromHeadword(headword) {
  const chars = [];
  const seen = new Set();

  for (const part of headword.split(';')) {
    for (const char of part.trim()) {
      if (KANJI_REGEX.test(char) && !seen.has(char)) {
        seen.add(char);
        chars.push(char);
      }
    }
  }

  return chars;
}

export function getKanjiForWord(word) {
  const characters = extractKanjiFromHeadword(word.headword || '');
  const index = getKanjiIndex();

  return characters
    .map((character) => index.get(character))
    .filter(Boolean);
}

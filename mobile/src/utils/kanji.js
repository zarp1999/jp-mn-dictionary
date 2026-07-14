import rawKanjiData from '../data/kanji_bank_1.json';

const KANJI_REGEX = /[\u4e00-\u9fff]/;

let _kanjiRawByCharacter = null;
let _kanjiParsedCache = null;

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

function parseMeaningsMn(metadata) {
  const meanings = metadata?.meanings_mn;
  if (!Array.isArray(meanings)) {
    return '';
  }

  return meanings
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('・');
}

export function parseKanjiEntry(item) {
  const character = item[0] || '';
  const metadata = item[5] || {};

  return {
    character,
    onYomi: parseOnYomi(item[1]),
    kunYomi: parseKunYomi(item[2]),
    meaningMn: parseMeaningsMn(metadata),
    strokeCount: formatStrokeCount(metadata['画数'] || metadata['総画'] || ''),
  };
}

function getKanjiRawByCharacter() {
  if (!_kanjiRawByCharacter) {
    _kanjiRawByCharacter = new Map();
    for (const item of rawKanjiData) {
      const character = item[0];
      if (character && !_kanjiRawByCharacter.has(character)) {
        _kanjiRawByCharacter.set(character, item);
      }
    }
  }
  return _kanjiRawByCharacter;
}

function getKanjiEntry(character) {
  if (!_kanjiParsedCache) {
    _kanjiParsedCache = new Map();
  }

  if (_kanjiParsedCache.has(character)) {
    return _kanjiParsedCache.get(character);
  }

  const raw = getKanjiRawByCharacter().get(character);
  if (!raw) {
    return null;
  }

  const entry = parseKanjiEntry(raw);
  _kanjiParsedCache.set(character, entry);
  return entry;
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

  return characters
    .map((character) => getKanjiEntry(character))
    .filter(Boolean);
}

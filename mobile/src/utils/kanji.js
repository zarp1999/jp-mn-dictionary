import rawKanjiData from '../data/kanji_bank_1.json';

const KANJI_REGEX = /[\u4e00-\u9fff]/;
const SIMILAR_KANJI_PREFIX = '似ている漢字:';
const MAX_SIMILAR_KANJI = 12;

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

function parseMeaningsMnList(metadata) {
  const meanings = metadata?.meanings_mn;
  if (!Array.isArray(meanings)) {
    return [];
  }

  return meanings
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
}

function parseMeaningsMn(metadata) {
  return parseMeaningsMnList(metadata).join('・');
}

function parseSimilarKanji(lines, character) {
  if (!Array.isArray(lines)) {
    return [];
  }

  const line = lines.find(
    (entry) => typeof entry === 'string' && entry.includes(SIMILAR_KANJI_PREFIX),
  );
  if (!line) {
    return [];
  }

  const raw = line.split(SIMILAR_KANJI_PREFIX)[1] || '';
  const seen = new Set();
  const result = [];

  for (const part of raw.split(/\s+/)) {
    const char = part.trim();
    if (!char || char === character || seen.has(char) || !KANJI_REGEX.test(char)) {
      continue;
    }
    seen.add(char);
    result.push(char);
  }

  return result;
}

function formatJlpt(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const text = String(value).trim();
  if (!text) {
    return '';
  }
  if (/^n?\d+$/i.test(text)) {
    return `N${text.replace(/^n/i, '')}`;
  }
  return text;
}

export function parseKanjiEntry(item) {
  const character = item[0] || '';
  const metadata = item[5] || {};
  const meaningsMnList = parseMeaningsMnList(metadata);

  return {
    character,
    onYomi: parseOnYomi(item[1]),
    kunYomi: parseKunYomi(item[2]),
    meaningMn: meaningsMnList.join('・'),
    meaningsMnList,
    strokeCount: formatStrokeCount(metadata['画数'] || metadata['総画'] || ''),
    jlpt: formatJlpt(metadata.jlpt),
    grade: metadata['学年'] || '',
    radical: metadata['部首'] || '',
    variants: metadata['異体字'] || '',
    similarKanji: parseSimilarKanji(item[4], character),
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

export function getKanjiEntry(character) {
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

export function filterKnownSimilarKanji(characters) {
  const known = [];

  for (const character of characters || []) {
    if (!getKanjiEntry(character)) {
      continue;
    }
    known.push(character);
    if (known.length >= MAX_SIMILAR_KANJI) {
      break;
    }
  }

  return known;
}

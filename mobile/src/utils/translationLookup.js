import rawV2Data from '../data/dictionary_mn_v2.json';
import rawTermData from '../data/term_bank_1.json';

const KANJI_REGEX = /^[\u4e00-\u9fff]$/;
export const V2_ID_OFFSET = 1_000_000;

let _v2Index = null;
let _singleKanjiTermIndex = null;
let _singleKanjiV2Index = null;

function makeLookupKey(headword, reading) {
  return `${headword}\0${reading || ''}`;
}

function stripHeadwordPrefix(text, headword) {
  if (!text || !headword) {
    return text;
  }

  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`^${escaped}\\s*[:：]\\s*`), '').trim();
}

function parseTranslationMn(text, headword = '') {
  if (!text || !text.trim()) {
    return [];
  }

  return text
    .split(';')
    .map((part) => stripHeadwordPrefix(part.trim(), headword))
    .filter(Boolean);
}

function parseTermBankDefinitions(item) {
  const definitionRaw = Array.isArray(item[5]) ? item[5][0] : (item[5] || '');
  return definitionRaw
    .split('◇')[0]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function shouldReplaceV2Entry(existing, candidate) {
  if (!existing) {
    return true;
  }
  if (candidate.source === 'kuribayashi' && existing.source !== 'kuribayashi') {
    return true;
  }
  return false;
}

function getV2Index() {
  if (!_v2Index) {
    _v2Index = new Map();

    for (const entry of rawV2Data) {
      const key = makeLookupKey(entry.kanji, entry.furigana);
      const existing = _v2Index.get(key);
      if (shouldReplaceV2Entry(existing, entry)) {
        _v2Index.set(key, entry);
      }
    }
  }
  return _v2Index;
}

function getSingleKanjiTermIndex() {
  if (!_singleKanjiTermIndex) {
    _singleKanjiTermIndex = new Map();

    for (const item of rawTermData) {
      const headword = item[0] || '';
      if (!KANJI_REGEX.test(headword) || _singleKanjiTermIndex.has(headword)) {
        continue;
      }

      const definitions = parseTermBankDefinitions(item);
      if (definitions.length > 0) {
        _singleKanjiTermIndex.set(headword, definitions);
      }
    }
  }
  return _singleKanjiTermIndex;
}

function getSingleKanjiV2Index() {
  if (!_singleKanjiV2Index) {
    _singleKanjiV2Index = new Map();

    for (const entry of rawV2Data) {
      const kanji = entry.kanji || '';
      if (!KANJI_REGEX.test(kanji) || !entry.translation_mn?.trim()) {
        continue;
      }

      const existing = _singleKanjiV2Index.get(kanji);
      if (shouldReplaceV2Entry(existing, entry)) {
        _singleKanjiV2Index.set(kanji, entry);
      }
    }
  }
  return _singleKanjiV2Index;
}

export function getV2Definitions(headword, reading) {
  const entry = getV2Index().get(makeLookupKey(headword, reading));
  if (!entry?.translation_mn?.trim()) {
    return [];
  }
  return parseTranslationMn(entry.translation_mn, headword);
}

export function resolveDefinitions(headword, reading, termBankDefinitions) {
  if (termBankDefinitions?.length) {
    return termBankDefinitions;
  }
  return getV2Definitions(headword, reading);
}

export function getSingleKanjiMnMeaning(character) {
  const termDefinitions = getSingleKanjiTermIndex().get(character);
  if (termDefinitions?.length) {
    return termDefinitions[0];
  }

  const v2Entry = getSingleKanjiV2Index().get(character);
  if (!v2Entry?.translation_mn?.trim()) {
    return '';
  }

  return parseTranslationMn(v2Entry.translation_mn, character)[0] || '';
}

let _preferredV2Entries = null;

function getPreferredV2Entries() {
  if (!_preferredV2Entries) {
    const preferredEntries = [];
    const seenKeys = new Map();

    for (const entry of rawV2Data) {
      const headword = entry.kanji || '';
      if (!headword || !entry.translation_mn?.trim()) {
        continue;
      }

      const key = makeLookupKey(headword, entry.furigana || '');
      const existingIndex = seenKeys.get(key);
      if (existingIndex === undefined) {
        seenKeys.set(key, preferredEntries.length);
        preferredEntries.push(entry);
        continue;
      }

      if (shouldReplaceV2Entry(preferredEntries[existingIndex], entry)) {
        preferredEntries[existingIndex] = entry;
      }
    }

    _preferredV2Entries = preferredEntries;
  }
  return _preferredV2Entries;
}

function v2EntryToWord(entry, index) {
  const headword = entry.kanji || '';
  return {
    id: V2_ID_OFFSET + index,
    headword,
    reading: entry.furigana || '',
    definitions: parseTranslationMn(entry.translation_mn, headword),
    examples: [],
    source: entry.source || 'v2',
  };
}

function scoreTextMatch(text, query, baseOffset) {
  if (!text || !text.includes(query)) return null;
  if (text === query) return baseOffset;
  if (text.startsWith(query)) return baseOffset + 1;
  return baseOffset + 2;
}

function getV2JapaneseMatchScore(entry, query) {
  const headwordScore = scoreTextMatch(entry.kanji || '', query, 0);
  const readingScore = scoreTextMatch(entry.furigana || '', query, 3);
  const scores = [headwordScore, readingScore].filter((score) => score !== null);
  return scores.length > 0 ? Math.min(...scores) : null;
}

function getV2MongolianMatchScore(entry, query) {
  const text = (entry.translation_mn || '').toLowerCase();
  return scoreTextMatch(text, query, 0);
}

export function searchV2WordsScored(query, direction = 'jp-mn', limit = 100) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  const entries = getPreferredV2Entries();
  const matches = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const score = direction === 'jp-mn'
      ? getV2JapaneseMatchScore(entry, q)
      : getV2MongolianMatchScore(entry, q);

    if (score !== null) {
      matches.push({
        word: v2EntryToWord(entry, i),
        score,
      });
    }
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.word.headword.length !== b.word.headword.length) {
      return a.word.headword.length - b.word.headword.length;
    }
    return a.word.id - b.word.id;
  });

  return matches.slice(0, limit);
}

export function searchV2Words(query, direction = 'jp-mn', limit = 100) {
  return searchV2WordsScored(query, direction, limit).map(({ word }) => word);
}

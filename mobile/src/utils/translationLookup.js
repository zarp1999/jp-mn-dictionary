import rawV2Data from '../data/dictionary_mn_v2.json';
import rawTermData from '../data/term_bank_1.json';

const KANJI_REGEX = /^[\u4e00-\u9fff]$/;
export const V2_ID_OFFSET = 1_000_000;

let _v2Index = null;
let _singleKanjiTermIndex = null;
let _singleKanjiV2Index = null;

let _preferredV2Entries = null;
let _v2ExactHeadwordIndex = null;
let _v2ExactReadingIndex = null;
let _v2SortedHeadwords = null;
let _v2SortedReadings = null;
let _v2WarmupPromise = null;

export function normalizeSearchText(text) {
  if (!text) {
    return '';
  }
  return text.normalize('NFC').trim();
}

export function normalizeSearchQuery(text, { lowerCase = false } = {}) {
  const normalized = normalizeSearchText(text);
  return lowerCase ? normalized.toLowerCase() : normalized;
}

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

function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
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

function getPreferredV2Entries() {
  if (!_preferredV2Entries) {
    const preferredEntries = [];
    const seenKeys = new Map();

    for (const entry of rawV2Data) {
      const headword = normalizeSearchText(entry.kanji || '');
      if (!headword || !entry.translation_mn?.trim()) {
        continue;
      }

      const reading = normalizeSearchText(entry.furigana || '');
      const key = makeLookupKey(headword, reading);
      const existingIndex = seenKeys.get(key);
      const normalizedEntry = {
        ...entry,
        kanji: headword,
        furigana: reading,
      };

      if (existingIndex === undefined) {
        seenKeys.set(key, preferredEntries.length);
        preferredEntries.push(normalizedEntry);
        continue;
      }

      if (shouldReplaceV2Entry(preferredEntries[existingIndex], normalizedEntry)) {
        preferredEntries[existingIndex] = normalizedEntry;
      }
    }

    _preferredV2Entries = preferredEntries;
  }
  return _preferredV2Entries;
}

function pushIndexValue(map, key, value) {
  if (!key) {
    return;
  }
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

function lowerBound(sorted, query) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].key < query) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function collectPrefixFromSorted(sorted, query, limit) {
  if (!query || !sorted?.length) {
    return [];
  }

  const start = lowerBound(sorted, query);
  const matches = [];
  for (let i = start; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (!item.key.startsWith(query)) {
      break;
    }
    matches.push(item.index);
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

function buildV2SearchIndexes() {
  if (_v2ExactHeadwordIndex && _v2ExactReadingIndex) {
    return;
  }

  const entries = getPreferredV2Entries();
  const exactHeadword = new Map();
  const exactReading = new Map();
  const sortedHeadwords = [];
  const sortedReadings = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const headword = entry.kanji || '';
    const reading = entry.furigana || '';

    pushIndexValue(exactHeadword, headword, i);
    pushIndexValue(exactReading, reading, i);
    if (headword) {
      sortedHeadwords.push({ key: headword, index: i });
    }
    if (reading) {
      sortedReadings.push({ key: reading, index: i });
    }
  }

  sortedHeadwords.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  sortedReadings.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  _v2ExactHeadwordIndex = exactHeadword;
  _v2ExactReadingIndex = exactReading;
  _v2SortedHeadwords = sortedHeadwords;
  _v2SortedReadings = sortedReadings;
}

export async function warmUpV2SearchIndexes() {
  if (_v2ExactHeadwordIndex && _v2ExactReadingIndex) {
    return;
  }
  if (_v2WarmupPromise) {
    return _v2WarmupPromise;
  }

  _v2WarmupPromise = (async () => {
    if (!_preferredV2Entries) {
      const preferredEntries = [];
      const seenKeys = new Map();

      for (let i = 0; i < rawV2Data.length; i += 1) {
        const entry = rawV2Data[i];
        const headword = normalizeSearchText(entry.kanji || '');
        if (!headword || !entry.translation_mn?.trim()) {
          continue;
        }

        const reading = normalizeSearchText(entry.furigana || '');
        const key = makeLookupKey(headword, reading);
        const existingIndex = seenKeys.get(key);
        const normalizedEntry = {
          ...entry,
          kanji: headword,
          furigana: reading,
        };

        if (existingIndex === undefined) {
          seenKeys.set(key, preferredEntries.length);
          preferredEntries.push(normalizedEntry);
        } else if (shouldReplaceV2Entry(preferredEntries[existingIndex], normalizedEntry)) {
          preferredEntries[existingIndex] = normalizedEntry;
        }

        if (i > 0 && i % 2000 === 0) {
          await yieldToMain();
        }
      }

      _preferredV2Entries = preferredEntries;
    }

    await yieldToMain();
    buildV2SearchIndexes();
    await yieldToMain();
  })();

  try {
    await _v2WarmupPromise;
  } finally {
    _v2WarmupPromise = null;
  }
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

function addScoredMatch(matches, seen, index, score) {
  if (seen.has(index)) {
    return;
  }
  seen.add(index);
  matches.push({ index, score });
}

function searchV2JapaneseIndexed(query, limit) {
  buildV2SearchIndexes();
  const entries = getPreferredV2Entries();
  const matches = [];
  const seen = new Set();

  for (const index of _v2ExactHeadwordIndex.get(query) || []) {
    addScoredMatch(matches, seen, index, 0);
  }
  for (const index of _v2ExactReadingIndex.get(query) || []) {
    addScoredMatch(matches, seen, index, 3);
  }

  for (const index of collectPrefixFromSorted(_v2SortedHeadwords, query, limit * 2)) {
    if (entries[index].kanji === query) {
      continue;
    }
    addScoredMatch(matches, seen, index, 1);
  }
  for (const index of collectPrefixFromSorted(_v2SortedReadings, query, limit * 2)) {
    if (entries[index].furigana === query) {
      continue;
    }
    addScoredMatch(matches, seen, index, 4);
  }

  if (matches.length < limit && query.length >= 2) {
    for (let i = 0; i < entries.length; i += 1) {
      if (seen.has(i)) {
        continue;
      }
      const entry = entries[i];
      const headword = entry.kanji || '';
      const reading = entry.furigana || '';
      if (headword.includes(query) && !headword.startsWith(query)) {
        addScoredMatch(matches, seen, i, 2);
      } else if (reading.includes(query) && !reading.startsWith(query)) {
        addScoredMatch(matches, seen, i, 5);
      }
      if (matches.length >= limit * 3) {
        break;
      }
    }
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const aLen = (entries[a.index].kanji || '').length;
    const bLen = (entries[b.index].kanji || '').length;
    if (aLen !== bLen) return aLen - bLen;
    return a.index - b.index;
  });

  return matches.slice(0, limit).map(({ index, score }) => ({
    word: v2EntryToWord(entries[index], index),
    score,
  }));
}

function searchV2MongolianScored(query, limit) {
  const entries = getPreferredV2Entries();
  const matches = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const text = (entry.translation_mn || '').toLowerCase();
    const score = scoreTextMatch(text, query, 0);
    if (score !== null) {
      matches.push({
        word: v2EntryToWord(entry, i),
        score,
      });
      if (matches.length >= limit * 3 && score > 0) {
        // keep scanning a bit for exact matches, but bound work
      }
    }
    if (matches.length >= limit * 5) {
      break;
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

export function searchV2WordsScored(query, direction = 'jp-mn', limit = 100) {
  const q = normalizeSearchQuery(query, { lowerCase: direction === 'mn-jp' });
  if (!q) {
    return [];
  }

  if (direction === 'jp-mn') {
    return searchV2JapaneseIndexed(q, limit);
  }

  return searchV2MongolianScored(q, limit);
}

export function searchV2Words(query, direction = 'jp-mn', limit = 100) {
  return searchV2WordsScored(query, direction, limit).map(({ word }) => word);
}

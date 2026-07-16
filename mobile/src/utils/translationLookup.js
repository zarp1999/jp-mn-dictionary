import { Platform } from 'react-native';
import rawTermData from '../data/term_bank_1.json';
import staticV2Data from './v2Data';

const KANJI_REGEX = /^[\u4e00-\u9fff]$/;
export const V2_ID_OFFSET = 1_000_000;

let _rawV2Data = null;
let _v2LoadPromise = null;
let _v2Unavailable = false;

let _v2PreferredByKey = null;
let _v2ExactHeadwordIndex = null;
let _v2ExactReadingIndex = null;
let _v2SortedHeadwords = null;
let _v2SortedReadings = null;
let _v2WarmupPromise = null;

let _singleKanjiTermIndex = null;
let _singleKanjiV2Index = null;

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

function getV2PublicUrl() {
  if (typeof window === 'undefined') {
    return 'dictionary_mn_v2.json';
  }
  try {
    return new URL('dictionary_mn_v2.json', window.location.href).href;
  } catch {
    return 'dictionary_mn_v2.json';
  }
}

export async function loadRawV2Data() {
  if (_rawV2Data) {
    return _rawV2Data;
  }
  if (_v2Unavailable) {
    return null;
  }
  if (_v2LoadPromise) {
    return _v2LoadPromise;
  }

  _v2LoadPromise = (async () => {
    if (Platform.OS === 'web') {
      const response = await fetch(getV2PublicUrl());
      if (!response.ok) {
        throw new Error(`Failed to fetch v2 dictionary: ${response.status}`);
      }
      _rawV2Data = await response.json();
    } else if (staticV2Data) {
      _rawV2Data = staticV2Data;
    } else {
      throw new Error('V2 dictionary is not available on this platform');
    }
    return _rawV2Data;
  })();

  try {
    return await _v2LoadPromise;
  } catch (error) {
    _v2Unavailable = true;
    throw error;
  } finally {
    _v2LoadPromise = null;
  }
}

export function isV2DictionaryAvailable() {
  return Boolean(_rawV2Data) && !_v2Unavailable;
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
    if (!_rawV2Data) {
      return _singleKanjiV2Index;
    }

    for (const entry of _rawV2Data) {
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
  if (!_v2PreferredByKey || !_rawV2Data) {
    return [];
  }

  const key = makeLookupKey(
    normalizeSearchText(headword),
    normalizeSearchText(reading || ''),
  );
  const rawIndex = _v2PreferredByKey.get(key);
  if (rawIndex === undefined) {
    return [];
  }

  const entry = _rawV2Data[rawIndex];
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
    matches.push(item.rawIndex);
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

async function buildV2PreferredIndex() {
  const raw = await loadRawV2Data();
  if (!raw) {
    return;
  }
  if (_v2PreferredByKey) {
    return;
  }

  const preferredByKey = new Map();

  for (let i = 0; i < raw.length; i += 1) {
    const entry = raw[i];
    const headword = normalizeSearchText(entry.kanji || '');
    if (!headword || !entry.translation_mn?.trim()) {
      continue;
    }

    const reading = normalizeSearchText(entry.furigana || '');
    const key = makeLookupKey(headword, reading);
    const existingIndex = preferredByKey.get(key);

    if (existingIndex === undefined) {
      preferredByKey.set(key, i);
    } else if (shouldReplaceV2Entry(raw[existingIndex], entry)) {
      preferredByKey.set(key, i);
    }

    if (i > 0 && i % 3000 === 0) {
      await yieldToMain();
    }
  }

  _v2PreferredByKey = preferredByKey;
}

async function buildV2SearchIndexes() {
  if (_v2ExactHeadwordIndex && _v2ExactReadingIndex) {
    return;
  }

  await buildV2PreferredIndex();
  if (!_v2PreferredByKey || !_rawV2Data) {
    return;
  }

  const exactHeadword = new Map();
  const exactReading = new Map();
  const sortedHeadwords = [];
  const sortedReadings = [];
  let count = 0;

  for (const rawIndex of _v2PreferredByKey.values()) {
    const entry = _rawV2Data[rawIndex];
    const headword = normalizeSearchText(entry.kanji || '');
    const reading = normalizeSearchText(entry.furigana || '');

    pushIndexValue(exactHeadword, headword, rawIndex);
    pushIndexValue(exactReading, reading, rawIndex);
    if (headword) {
      sortedHeadwords.push({ key: headword, rawIndex });
    }
    if (reading) {
      sortedReadings.push({ key: reading, rawIndex });
    }

    count += 1;
    if (count % 3000 === 0) {
      await yieldToMain();
    }
  }

  sortedHeadwords.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  await yieldToMain();
  sortedReadings.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  _v2ExactHeadwordIndex = exactHeadword;
  _v2ExactReadingIndex = exactReading;
  _v2SortedHeadwords = sortedHeadwords;
  _v2SortedReadings = sortedReadings;
}

export async function warmUpV2SearchIndexes() {
  if (_v2Unavailable) {
    return false;
  }
  if (_v2ExactHeadwordIndex && _v2ExactReadingIndex) {
    return true;
  }
  if (_v2WarmupPromise) {
    return _v2WarmupPromise;
  }

  _v2WarmupPromise = (async () => {
    await buildV2SearchIndexes();
    return true;
  })();

  try {
    return await _v2WarmupPromise;
  } catch (error) {
    console.warn('V2 dictionary warmup failed', error);
    _v2Unavailable = true;
    return false;
  } finally {
    _v2WarmupPromise = null;
  }
}

function v2RawIndexToWord(rawIndex) {
  const entry = _rawV2Data[rawIndex];
  const headword = normalizeSearchText(entry.kanji || '');
  return {
    id: V2_ID_OFFSET + rawIndex,
    headword,
    reading: normalizeSearchText(entry.furigana || ''),
    definitions: parseTranslationMn(entry.translation_mn, headword),
    examples: [],
    source: entry.source || 'v2',
  };
}

function addScoredMatch(matches, seen, rawIndex, score) {
  if (seen.has(rawIndex)) {
    return;
  }
  seen.add(rawIndex);
  matches.push({ rawIndex, score });
}

function searchV2JapaneseIndexed(query, limit) {
  if (!_v2ExactHeadwordIndex || !_rawV2Data) {
    return [];
  }

  const matches = [];
  const seen = new Set();

  for (const rawIndex of _v2ExactHeadwordIndex.get(query) || []) {
    addScoredMatch(matches, seen, rawIndex, 0);
  }
  for (const rawIndex of _v2ExactReadingIndex.get(query) || []) {
    addScoredMatch(matches, seen, rawIndex, 3);
  }

  for (const rawIndex of collectPrefixFromSorted(_v2SortedHeadwords, query, limit * 2)) {
    const headword = normalizeSearchText(_rawV2Data[rawIndex].kanji || '');
    if (headword === query) {
      continue;
    }
    addScoredMatch(matches, seen, rawIndex, 1);
  }
  for (const rawIndex of collectPrefixFromSorted(_v2SortedReadings, query, limit * 2)) {
    const reading = normalizeSearchText(_rawV2Data[rawIndex].furigana || '');
    if (reading === query) {
      continue;
    }
    addScoredMatch(matches, seen, rawIndex, 4);
  }

  if (matches.length < limit && query.length >= 2) {
    for (const rawIndex of _v2PreferredByKey.values()) {
      if (seen.has(rawIndex)) {
        continue;
      }
      const entry = _rawV2Data[rawIndex];
      const headword = normalizeSearchText(entry.kanji || '');
      const reading = normalizeSearchText(entry.furigana || '');
      if (headword.includes(query) && !headword.startsWith(query)) {
        addScoredMatch(matches, seen, rawIndex, 2);
      } else if (reading.includes(query) && !reading.startsWith(query)) {
        addScoredMatch(matches, seen, rawIndex, 5);
      }
      if (matches.length >= limit * 3) {
        break;
      }
    }
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const aLen = normalizeSearchText(_rawV2Data[a.rawIndex].kanji || '').length;
    const bLen = normalizeSearchText(_rawV2Data[b.rawIndex].kanji || '').length;
    if (aLen !== bLen) return aLen - bLen;
    return a.rawIndex - b.rawIndex;
  });

  return matches.slice(0, limit).map(({ rawIndex, score }) => ({
    word: v2RawIndexToWord(rawIndex),
    score,
  }));
}

function searchV2MongolianScored(query, limit) {
  if (!_v2PreferredByKey || !_rawV2Data) {
    return [];
  }

  const matches = [];
  for (const rawIndex of _v2PreferredByKey.values()) {
    const entry = _rawV2Data[rawIndex];
    const text = (entry.translation_mn || '').toLowerCase();
    if (!text.includes(query)) {
      continue;
    }
    let score = 2;
    if (text === query) score = 0;
    else if (text.startsWith(query)) score = 1;
    matches.push({
      word: v2RawIndexToWord(rawIndex),
      score,
    });
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

export async function searchV2WordsScored(query, direction = 'jp-mn', limit = 100) {
  const q = normalizeSearchQuery(query, { lowerCase: direction === 'mn-jp' });
  if (!q) {
    return [];
  }

  const ready = await warmUpV2SearchIndexes();
  if (!ready) {
    return [];
  }

  if (direction === 'jp-mn') {
    return searchV2JapaneseIndexed(q, limit);
  }

  return searchV2MongolianScored(q, limit);
}

export async function searchV2Words(query, direction = 'jp-mn', limit = 100) {
  const scored = await searchV2WordsScored(query, direction, limit);
  return scored.map(({ word }) => word);
}

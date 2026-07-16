import rawData from '../data/term_bank_1.json';
import { getLookupTerms } from './kuromojiTokenizer';
import {
  resolveDefinitions,
  searchV2WordsScored,
  warmUpV2SearchIndexes,
  normalizeSearchText,
  normalizeSearchQuery,
  V2_ID_OFFSET,
} from './translationLookup';

// term_bank_1.json のフォーマット:
// [見出し語, 読み, '', '', 数値, [訳語+例文の文字列], 数値, '']
function parseEntry(item, index) {
  const headword = normalizeSearchText(item[0] || '');
  const reading = normalizeSearchText(item[1] || '');
  const definitionRaw = Array.isArray(item[5]) ? item[5][0] : (item[5] || '');

  // 訳語（◇より前の部分）と例文（◇以降）を分離
  const parts = definitionRaw.split('◇');
  const termBankDefinitions = parts[0]
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const definitions = resolveDefinitions(headword, reading, termBankDefinitions);
  const examples = parts[1]
    ? parts[1]
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  return {
    id: index,
    headword,
    reading,
    definitions,
    examples,
  };
}

// 全データをパース（一度だけ実行）
let _allWords = null;
let _headwordIndex = null;
let _headwordSet = null;
let _termExactHeadwordIndex = null;
let _termExactReadingIndex = null;
let _termSortedHeadwords = null;
let _termSortedReadings = null;
let _termWarmupPromise = null;

function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function getAllWords() {
  if (!_allWords) {
    _allWords = rawData.map((item, i) => parseEntry(item, i));
  }
  return _allWords;
}

async function buildAllWordsChunked() {
  if (_allWords) {
    return _allWords;
  }

  const words = [];
  const chunkSize = 500;
  for (let i = 0; i < rawData.length; i += 1) {
    words.push(parseEntry(rawData[i], i));
    if (i > 0 && i % chunkSize === 0) {
      await yieldToMain();
    }
  }
  _allWords = words;
  return _allWords;
}

function getHeadwordAliases(headword) {
  return headword
    .split(';')
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);
}

function getHeadwordIndex() {
  if (!_headwordIndex) {
    _headwordIndex = new Map();
    const allWords = getAllWords();

    for (const word of allWords) {
      for (const alias of getHeadwordAliases(word.headword)) {
        if (!_headwordIndex.has(alias)) {
          _headwordIndex.set(alias, word);
        }
      }
    }

    // 読みは見出し語登録後に追加（例: 読み「したい」の死体より見出し語「したい」を優先）
    for (const word of allWords) {
      if (word.reading && !_headwordIndex.has(word.reading)) {
        _headwordIndex.set(word.reading, word);
      }
    }
  }
  return _headwordIndex;
}

function getHeadwordSet() {
  if (!_headwordSet) {
    _headwordSet = new Set();
    for (const word of getAllWords()) {
      for (const alias of getHeadwordAliases(word.headword)) {
        _headwordSet.add(alias);
      }
    }
  }
  return _headwordSet;
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
    matches.push(item.word);
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

function buildTermSearchIndexes() {
  if (_termExactHeadwordIndex && _termExactReadingIndex) {
    return;
  }

  const allWords = getAllWords();
  const exactHeadword = new Map();
  const exactReading = new Map();
  const sortedHeadwords = [];
  const sortedReadings = [];

  for (const word of allWords) {
    for (const alias of getHeadwordAliases(word.headword)) {
      pushIndexValue(exactHeadword, alias, word);
      sortedHeadwords.push({ key: alias, word });
    }
    if (word.reading) {
      pushIndexValue(exactReading, word.reading, word);
      sortedReadings.push({ key: word.reading, word });
    }
  }

  sortedHeadwords.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  sortedReadings.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  _termExactHeadwordIndex = exactHeadword;
  _termExactReadingIndex = exactReading;
  _termSortedHeadwords = sortedHeadwords;
  _termSortedReadings = sortedReadings;
}

export async function warmUpDictionarySearch() {
  if (_termWarmupPromise) {
    return _termWarmupPromise;
  }

  _termWarmupPromise = (async () => {
    await warmUpV2SearchIndexes();
    await buildAllWordsChunked();
    await yieldToMain();
    buildTermSearchIndexes();
    getHeadwordIndex();
    getHeadwordSet();
    await yieldToMain();
  })();

  try {
    await _termWarmupPromise;
  } finally {
    _termWarmupPromise = null;
  }
}

// 五段動詞の連用形末尾 → 辞書形末尾
const GODAN_RENYOU_TO_DICT = {
  き: 'く',
  ぎ: 'ぐ',
  し: 'す',
  ち: 'つ',
  び: 'ぶ',
  み: 'む',
  り: 'る',
  い: 'う',
};

function getStemLookupForms(stem) {
  const headwords = getHeadwordSet();
  const forms = [];

  if (headwords.has(stem)) {
    forms.push(stem);
  }

  const ichidanForm = `${stem}る`;
  if (headwords.has(ichidanForm)) {
    forms.push(ichidanForm);
  }

  const dictEnding = GODAN_RENYOU_TO_DICT[stem.slice(-1)];
  if (dictEnding) {
    const godanForm = stem.slice(0, -1) + dictEnding;
    if (headwords.has(godanForm)) {
      forms.push(godanForm);
    }
  }

  return forms;
}

function shouldSkipSingleCharPrefixMatch(partLength, remainingLength) {
  return partLength === 1 && remainingLength > 1;
}

function matchHeadwordOrStem(text) {
  const headwords = getHeadwordSet();

  for (let len = text.length; len >= 1; len -= 1) {
    const part = text.slice(0, len);
    if (shouldSkipSingleCharPrefixMatch(len, text.length)) {
      continue;
    }
    if (headwords.has(part)) {
      return { consumed: len, term: part };
    }
  }

  for (let len = text.length; len >= 1; len -= 1) {
    const part = text.slice(0, len);
    if (shouldSkipSingleCharPrefixMatch(len, text.length)) {
      continue;
    }
    const forms = getStemLookupForms(part);
    if (forms.length > 0) {
      return { consumed: len, term: forms[0] };
    }
  }

  return null;
}

function segmentByHeadwordsWithStems(text) {
  const parts = [];
  let rest = text;

  while (rest.length > 0) {
    const match = matchHeadwordOrStem(rest);
    if (!match) {
      return null;
    }
    parts.push(match.term);
    rest = rest.slice(match.consumed);
  }

  return parts.length > 0 ? parts : null;
}

function segmentByHeadwordsPartialWithStems(text) {
  const parts = [];
  let rest = text;

  while (rest.length > 0) {
    const match = matchHeadwordOrStem(rest);
    if (!match) {
      return parts.length > 0 ? parts : null;
    }
    parts.push(match.term);
    rest = rest.slice(match.consumed);
  }

  return parts.length > 0 ? parts : null;
}

function segmentByHeadwords(text) {
  const headwords = getHeadwordSet();
  const parts = [];
  let rest = text;

  while (rest.length > 0) {
    let matched = null;
    for (let len = rest.length; len >= 1; len -= 1) {
      const part = rest.slice(0, len);
      if (headwords.has(part)) {
        matched = part;
        rest = rest.slice(len);
        break;
      }
    }
    if (!matched) {
      return null;
    }
    parts.push(matched);
  }

  return parts.length > 0 ? parts : null;
}

function segmentByHeadwordsPartial(text) {
  const headwords = getHeadwordSet();
  const parts = [];
  let rest = text;

  while (rest.length > 0) {
    let matched = null;
    for (let len = rest.length; len >= 1; len -= 1) {
      const part = rest.slice(0, len);
      if (headwords.has(part)) {
        matched = part;
        rest = rest.slice(len);
        break;
      }
    }
    if (!matched) {
      return parts.length > 0 ? parts : null;
    }
    parts.push(matched);
  }

  return parts.length > 0 ? parts : null;
}

const HONORIFIC_PREFIX = /^(お|ご|御)/;

function getQueryVariants(query) {
  const trimmed = normalizeSearchText(query);
  const variants = [trimmed];
  const stripped = trimmed.replace(HONORIFIC_PREFIX, '');
  if (stripped && stripped !== trimmed) {
    variants.push(stripped);
  }
  return variants;
}

function isUsefulPartialSegment(parts) {
  if (!parts || parts.length === 0) {
    return false;
  }
  // 会いしたい → 会 のような1文字だけの誤マッチを除外
  if (parts.length === 1 && parts[0].length === 1) {
    return false;
  }
  return true;
}

function lookupExactTerm(term) {
  return getHeadwordIndex().get(term) || null;
}

function resolveTermToParts(term) {
  if (lookupExactTerm(term)) {
    return null;
  }

  const literalParts = segmentByHeadwords(term);
  if (literalParts) {
    return literalParts;
  }

  const stemParts = segmentByHeadwordsWithStems(term);
  if (stemParts) {
    return stemParts;
  }

  return null;
}

function lookupParts(parts, results, seenIds) {
  for (const part of parts) {
    const partWord = lookupExactTerm(part);
    if (partWord && !seenIds.has(partWord.id)) {
      seenIds.add(partWord.id);
      results.push(partWord);
    }
  }
}

function lookupExactTerms(terms) {
  const results = [];
  const seenIds = new Set();

  for (const term of terms) {
    const word = lookupExactTerm(term);

    if (word) {
      if (!seenIds.has(word.id)) {
        seenIds.add(word.id);
        results.push(word);
      }
      continue;
    }

    const parts = resolveTermToParts(term);
    if (parts) {
      lookupParts(parts, results, seenIds);
    }
  }

  return results;
}

function lookupSegmentedParts(parts) {
  if (!parts || parts.length === 0) {
    return [];
  }
  return lookupExactTerms(parts);
}

function scoreTextMatch(text, query, baseOffset) {
  if (!text || !text.includes(query)) return null;
  if (text === query) return baseOffset;
  if (text.startsWith(query)) return baseOffset + 1;
  return baseOffset + 2;
}

function getJapaneseMatchScore(word, query) {
  let best = null;
  for (const alias of getHeadwordAliases(word.headword)) {
    const score = scoreTextMatch(alias, query, 0);
    if (score !== null && (best === null || score < best)) {
      best = score;
    }
  }
  const readingScore = scoreTextMatch(word.reading, query, 3);
  if (readingScore !== null && (best === null || readingScore < best)) {
    best = readingScore;
  }
  return best;
}

function getMongolianMatchScore(word, query) {
  let best = null;
  for (const def of word.definitions) {
    const text = def.toLowerCase();
    const score = scoreTextMatch(text, query, 0);
    if (score !== null && (best === null || score < best)) {
      best = score;
    }
  }
  return best;
}

function compareSearchResults(a, b) {
  if (a.score !== b.score) return a.score - b.score;
  if (a.word.headword.length !== b.word.headword.length) {
    return a.word.headword.length - b.word.headword.length;
  }
  return a.word.id - b.word.id;
}

function getWordDedupKey(word) {
  return `${word.headword}\0${word.reading || ''}`;
}

function isTermBankWord(word) {
  return word.id < V2_ID_OFFSET;
}

function mergeScoredResults(scoredLists, limit = 100) {
  const bestByKey = new Map();

  for (const list of scoredLists) {
    for (const match of list) {
      const key = getWordDedupKey(match.word);
      const existing = bestByKey.get(key);

      if (!existing) {
        bestByKey.set(key, match);
        continue;
      }

      if (match.score < existing.score) {
        bestByKey.set(key, match);
        continue;
      }

      if (
        match.score === existing.score
        && isTermBankWord(match.word)
        && !isTermBankWord(existing.word)
      ) {
        bestByKey.set(key, match);
      }
    }
  }

  return [...bestByKey.values()]
    .sort(compareSearchResults)
    .slice(0, limit)
    .map(({ word }) => word);
}

function addScoredWord(matches, seenIds, word, score) {
  if (!word || seenIds.has(word.id)) {
    return;
  }
  seenIds.add(word.id);
  matches.push({ word, score });
}

function searchWordsJapaneseIndexed(query, limit = 100) {
  buildTermSearchIndexes();
  const matches = [];
  const seenIds = new Set();

  for (const word of _termExactHeadwordIndex.get(query) || []) {
    addScoredWord(matches, seenIds, word, 0);
  }
  for (const word of _termExactReadingIndex.get(query) || []) {
    addScoredWord(matches, seenIds, word, 3);
  }

  for (const word of collectPrefixFromSorted(_termSortedHeadwords, query, limit * 2)) {
    const exactAlias = getHeadwordAliases(word.headword).some((alias) => alias === query);
    if (exactAlias) {
      continue;
    }
    addScoredWord(matches, seenIds, word, 1);
  }
  for (const word of collectPrefixFromSorted(_termSortedReadings, query, limit * 2)) {
    if (word.reading === query) {
      continue;
    }
    addScoredWord(matches, seenIds, word, 4);
  }

  if (matches.length < limit && query.length >= 2) {
    const all = getAllWords();
    for (let i = 0; i < all.length; i += 1) {
      const word = all[i];
      if (seenIds.has(word.id)) {
        continue;
      }
      const score = getJapaneseMatchScore(word, query);
      if (score === 2 || score === 5) {
        addScoredWord(matches, seenIds, word, score);
      }
      if (matches.length >= limit * 3) {
        break;
      }
    }
  }

  matches.sort(compareSearchResults);
  return matches.slice(0, limit);
}

function searchWordsStandardScored(query, direction = 'jp-mn', limit = 100) {
  const q = normalizeSearchQuery(query, { lowerCase: direction === 'mn-jp' });
  if (!q) {
    return [];
  }

  if (direction === 'jp-mn') {
    return searchWordsJapaneseIndexed(q, limit);
  }

  const all = getAllWords();
  const matches = [];

  for (let i = 0; i < all.length; i++) {
    const word = all[i];
    const score = getMongolianMatchScore(word, q);
    if (score !== null) {
      matches.push({ word, score });
      if (matches.length >= limit * 5) {
        break;
      }
    }
  }

  matches.sort(compareSearchResults);
  return matches.slice(0, limit);
}

function searchMergedSources(query, direction = 'jp-mn', limit = 100) {
  const normalized = normalizeSearchText(query);
  const variants = direction === 'jp-mn'
    ? getQueryVariants(normalized)
    : [normalized];

  const scoredLists = [];
  for (const variant of variants) {
    scoredLists.push(searchWordsStandardScored(variant, direction, limit));
    scoredLists.push(searchV2WordsScored(variant, direction, limit));
  }

  return mergeScoredResults(scoredLists, limit);
}

async function searchWordsMorphological(query, limit = 100) {
  const trimmedQuery = normalizeSearchText(query);

  // 分割は元クエリ優先。接頭辞付き（お会いしたい等）は除去後も試す
  const segmentationQueries = [trimmedQuery];
  const strippedQuery = trimmedQuery.replace(HONORIFIC_PREFIX, '');
  if (strippedQuery && strippedQuery !== trimmedQuery) {
    segmentationQueries.push(strippedQuery);
  }

  // Kuromoji 不要: 複合語・連用形の分割（例: 天皇陛下、送り届ける）
  for (const variant of segmentationQueries) {
    const literal = segmentByHeadwords(variant);
    if (literal && literal.length > 1) {
      const results = lookupSegmentedParts(literal);
      if (results.length > 0) {
        return results.slice(0, limit);
      }
    }

    const stems = segmentByHeadwordsWithStems(variant);
    if (stems && stems.length > 1) {
      const results = lookupSegmentedParts(stems);
      if (results.length > 0) {
        return results.slice(0, limit);
      }
    }

    const partialLiteral = segmentByHeadwordsPartial(variant);
    if (isUsefulPartialSegment(partialLiteral)) {
      const results = lookupSegmentedParts(partialLiteral);
      if (results.length > 0) {
        return results.slice(0, limit);
      }
    }

    const partialStems = segmentByHeadwordsPartialWithStems(variant);
    if (isUsefulPartialSegment(partialStems)) {
      const results = lookupSegmentedParts(partialStems);
      if (results.length > 0) {
        return results.slice(0, limit);
      }
    }
  }

  // 文章・活用形: Kuromoji でトークン化
  try {
    const lookupTerms = await getLookupTerms(trimmedQuery);
    const tokenResults = lookupExactTerms(lookupTerms);
    if (tokenResults.length > 0) {
      return tokenResults.slice(0, limit);
    }
  } catch (error) {
    console.warn('Kuromoji search failed', error);
  }

  return [];
}

export async function searchWords(query, direction = 'jp-mn', limit = 100) {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) return [];

  await warmUpDictionarySearch();

  const merged = searchMergedSources(trimmed, direction, limit);
  if (merged.length > 0) {
    return merged;
  }

  if (direction === 'jp-mn') {
    return searchWordsMorphological(trimmed, limit);
  }

  return [];
}

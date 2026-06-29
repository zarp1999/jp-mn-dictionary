import rawData from '../data/term_bank_1.json';
import { getLookupTerms } from './kuromojiTokenizer';

// term_bank_1.json のフォーマット:
// [見出し語, 読み, '', '', 数値, [訳語+例文の文字列], 数値, '']
function parseEntry(item, index) {
  const headword = item[0] || '';
  const reading = item[1] || '';
  const definitionRaw = Array.isArray(item[5]) ? item[5][0] : (item[5] || '');

  // 訳語（◇より前の部分）と例文（◇以降）を分離
  const parts = definitionRaw.split('◇');
  const definitions = parts[0]
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
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

export function getAllWords() {
  if (!_allWords) {
    _allWords = rawData.map((item, i) => parseEntry(item, i));
  }
  return _allWords;
}

function getHeadwordAliases(headword) {
  return headword
    .split(';')
    .map((part) => part.trim())
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
  const trimmed = query.trim();
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
  const headwordScore = scoreTextMatch(word.headword, query, 0);
  const readingScore = scoreTextMatch(word.reading, query, 3);
  const scores = [headwordScore, readingScore].filter((score) => score !== null);
  return scores.length > 0 ? Math.min(...scores) : null;
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

function searchWordsStandard(query, direction = 'jp-mn', limit = 100) {
  const q = query.trim().toLowerCase();
  const all = getAllWords();
  const matches = [];

  for (let i = 0; i < all.length; i++) {
    const word = all[i];
    const score = direction === 'jp-mn'
      ? getJapaneseMatchScore(word, q)
      : getMongolianMatchScore(word, q);

    if (score !== null) {
      matches.push({ word, score });
    }
  }

  matches.sort(compareSearchResults);
  return matches.slice(0, limit).map(({ word }) => word);
}

async function searchWordsWithKuromoji(query, limit = 100) {
  const trimmedQuery = query.trim();
  const variants = getQueryVariants(trimmedQuery);

  for (const variant of variants) {
    const standard = searchWordsStandard(variant, 'jp-mn', limit);
    if (standard.length > 0) {
      return standard;
    }
  }

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
  if (!query || query.trim() === '') return [];

  if (direction === 'jp-mn') {
    return searchWordsWithKuromoji(query.trim(), limit);
  }

  return searchWordsStandard(query, direction, limit);
}

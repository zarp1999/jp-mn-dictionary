import { getAllWords, hydrateWords, warmUpDictionarySearch } from './dictionary';
import {
  loadRawV2Data,
  normalizeSearchText,
  resolveDefinitions,
  V2_ID_OFFSET,
} from './translationLookup';
import { KANJI_WORD_POSITION } from './kanjiPositionQuery';

export { KANJI_WORD_POSITION, parseKanjiPositionQuery } from './kanjiPositionQuery';

const KANJI_CHAR_REGEX = /^[\u4e00-\u9fff]$/;

function getHeadwordAliases(headword) {
  return headword
    .split(';')
    .map((part) => normalizeSearchText(part))
    .filter(Boolean);
}

function headwordMatchesKanjiPosition(alias, kanji, position) {
  if (!alias.includes(kanji)) {
    return false;
  }

  if (position === KANJI_WORD_POSITION.prefix) {
    return alias.startsWith(kanji);
  }
  if (position === KANJI_WORD_POSITION.suffix) {
    return alias.endsWith(kanji);
  }
  if (position === KANJI_WORD_POSITION.middle) {
    return !alias.startsWith(kanji) && !alias.endsWith(kanji);
  }

  return false;
}

function wordMatchesKanjiPosition(headword, kanji, position) {
  for (const alias of getHeadwordAliases(headword)) {
    if (headwordMatchesKanjiPosition(alias, kanji, position)) {
      return true;
    }
  }
  return false;
}

function getWordDedupKey(word) {
  return `${word.headword}\0${word.reading || ''}`;
}

function compareWordsByHeadword(a, b) {
  const aPrimary = getHeadwordAliases(a.headword)[0] || a.headword;
  const bPrimary = getHeadwordAliases(b.headword)[0] || b.headword;

  if (aPrimary.length !== bPrimary.length) {
    return aPrimary.length - bPrimary.length;
  }

  return aPrimary.localeCompare(bPrimary, 'ja');
}

function parseV2DefinitionLines(text, headword) {
  if (!text?.trim()) {
    return [];
  }

  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .split(';')
    .map((part) => part.trim().replace(new RegExp(`^${escaped}\\s*[:：]\\s*`), '').trim())
    .filter(Boolean);
}

function v2EntryToWord(entry, rawIndex) {
  const headword = normalizeSearchText(entry.kanji || '');
  const reading = normalizeSearchText(entry.furigana || '');
  const rawDefinitions = parseV2DefinitionLines(entry.translation_mn, headword);

  return {
    id: V2_ID_OFFSET + rawIndex,
    headword,
    reading,
    definitions: resolveDefinitions(headword, reading, rawDefinitions),
    examples: [],
  };
}

export async function searchWordsByKanjiPosition(kanji, position, limit = 200) {
  const character = normalizeSearchText(kanji);
  if (!KANJI_CHAR_REGEX.test(character)) {
    return [];
  }
  if (!Object.values(KANJI_WORD_POSITION).includes(position)) {
    return [];
  }

  await warmUpDictionarySearch();

  const matches = [];
  const seenKeys = new Set();

  const addWord = (word) => {
    const key = getWordDedupKey(word);
    if (seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);
    matches.push(word);
  };

  for (const word of getAllWords()) {
    if (wordMatchesKanjiPosition(word.headword, character, position)) {
      addWord(word);
    }
  }

  try {
    const v2Data = await loadRawV2Data();
    if (v2Data) {
      for (let i = 0; i < v2Data.length; i += 1) {
        const entry = v2Data[i];
        const headword = normalizeSearchText(entry.kanji || '');
        if (!headword || !wordMatchesKanjiPosition(headword, character, position)) {
          continue;
        }
        addWord(v2EntryToWord(entry, i));
      }
    }
  } catch {
    // V2 は任意
  }

  matches.sort(compareWordsByHeadword);
  return hydrateWords(matches.slice(0, limit));
}

export function getKanjiWordSearchTitleKey(position) {
  if (position === KANJI_WORD_POSITION.prefix) {
    return 'kanjiWordSearchTitlePrefix';
  }
  if (position === KANJI_WORD_POSITION.middle) {
    return 'kanjiWordSearchTitleMiddle';
  }
  return 'kanjiWordSearchTitleSuffix';
}

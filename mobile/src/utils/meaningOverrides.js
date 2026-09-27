/**
 * 【機能】ユーザーが編集した訳（オーバーライド）の保存・適用
 *
 * 役割: 単語のモンゴル語訳・漢字意味を端末に保存し、表示時に差し替える
 * 呼び出し元: MeaningOverridesContext, WordDetail / KanjiDetail
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveEnglishDefinitions } from './translationLookup';

const STORAGE_KEY = '@jp_mn_meaning_overrides';

export function emptyMeaningOverrides() {
  return { words: {}, kanji: {} };
}

export async function loadMeaningOverrides() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) {
      return emptyMeaningOverrides();
    }
    const parsed = JSON.parse(json);
    return {
      words: parsed?.words && typeof parsed.words === 'object' ? parsed.words : {},
      kanji: parsed?.kanji && typeof parsed.kanji === 'object' ? parsed.kanji : {},
    };
  } catch {
    return emptyMeaningOverrides();
  }
}

export async function saveMeaningOverrides(overrides) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore persistence errors
  }
}

function normalizeMeaningsList(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((part) => String(part).trim()).filter(Boolean);
}

export function parseMeaningsText(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function meaningsToText(meanings) {
  return normalizeMeaningsList(meanings).join('\n');
}

export function getWordDefinitions(word, overrides) {
  if (!word) {
    return [];
  }
  const id = String(word.id ?? '');
  const custom = overrides?.words?.[id];
  if (custom?.length) {
    return custom;
  }
  return Array.isArray(word.definitions) ? word.definitions : [];
}

/** English glosses are not user-editable; from dictionary data (lazy lookup if needed). */
export function getWordEnglishDefinitions(word) {
  if (!word) {
    return [];
  }
  if (Array.isArray(word.definitionsEn) && word.definitionsEn.length > 0) {
    return word.definitionsEn;
  }
  if (word.headword) {
    const resolved = resolveEnglishDefinitions(word.headword, word.reading);
    if (resolved.length && !Array.isArray(word.definitionsEn)) {
      word.definitionsEn = resolved;
    }
    return resolved;
  }
  return [];
}

export function getKanjiMeaningsList(kanji, overrides) {
  if (!kanji) {
    return [];
  }
  const character = kanji.character || '';
  const custom = overrides?.kanji?.[character];
  if (custom?.length) {
    return custom;
  }
  return Array.isArray(kanji.meaningsMnList) ? kanji.meaningsMnList : [];
}

export function getKanjiMeaningMn(kanji, overrides) {
  return getKanjiMeaningsList(kanji, overrides).join('・');
}

export function getKanjiEnglishMeaningsList(kanji) {
  if (!kanji) {
    return [];
  }
  return Array.isArray(kanji.meaningsEnList) ? kanji.meaningsEnList : [];
}

export function hasWordOverride(wordId, overrides) {
  return Boolean(overrides?.words?.[String(wordId ?? '')]);
}

export function hasKanjiOverride(character, overrides) {
  return Boolean(overrides?.kanji?.[character || '']);
}

export async function setWordOverride(overrides, wordId, meanings) {
  const next = {
    words: { ...overrides.words },
    kanji: { ...overrides.kanji },
  };
  const list = normalizeMeaningsList(meanings);
  const key = String(wordId ?? '');
  if (!list.length) {
    delete next.words[key];
  } else {
    next.words[key] = list;
  }
  await saveMeaningOverrides(next);
  return next;
}

export async function clearWordOverride(overrides, wordId) {
  const next = {
    words: { ...overrides.words },
    kanji: { ...overrides.kanji },
  };
  delete next.words[String(wordId ?? '')];
  await saveMeaningOverrides(next);
  return next;
}

export async function setKanjiOverride(overrides, character, meanings) {
  const next = {
    words: { ...overrides.words },
    kanji: { ...overrides.kanji },
  };
  const list = normalizeMeaningsList(meanings);
  const key = character || '';
  if (!list.length) {
    delete next.kanji[key];
  } else {
    next.kanji[key] = list;
  }
  await saveMeaningOverrides(next);
  return next;
}

export async function clearKanjiOverride(overrides, character) {
  const next = {
    words: { ...overrides.words },
    kanji: { ...overrides.kanji },
  };
  delete next.kanji[character || ''];
  await saveMeaningOverrides(next);
  return next;
}

export function resolveWordForDisplay(word, overrides) {
  if (!word) {
    return word;
  }
  return {
    ...word,
    definitions: getWordDefinitions(word, overrides),
  };
}

export function resolveKanjiForDisplay(kanji, overrides) {
  if (!kanji) {
    return kanji;
  }
  const meaningsMnList = getKanjiMeaningsList(kanji, overrides);
  const meaningsEnList = getKanjiEnglishMeaningsList(kanji);
  return {
    ...kanji,
    meaningsMnList,
    meaningsEnList,
    meaningMn: meaningsMnList.join('・'),
  };
}

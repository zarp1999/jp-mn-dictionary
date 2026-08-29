import AsyncStorage from '@react-native-async-storage/async-storage';

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
  return {
    ...kanji,
    meaningsMnList,
    meaningMn: meaningsMnList.join('・'),
  };
}
